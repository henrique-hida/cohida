package com.hida.cohida.auth.service;

import com.hida.cohida.account.domain.Account;
import com.hida.cohida.account.repository.AccountRepository;
import com.hida.cohida.auth.dto.AddressRequest;
import com.hida.cohida.auth.dto.AuthenticationResponse;
import com.hida.cohida.auth.dto.LoginRequest;
import com.hida.cohida.auth.dto.RegisterRequest;
import com.hida.cohida.auth.exception.InvalidCredentialsException;
import com.hida.cohida.auth.exception.InvalidRequestException;
import com.hida.cohida.customer.domain.Customer;
import com.hida.cohida.customer.domain.CustomerAddress;
import com.hida.cohida.customer.enums.AddressType;
import com.hida.cohida.customer.repository.CustomerRepository;
import com.hida.cohida.customer.service.CustomerService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.UUID;

@Service
public class AuthService {
    private final CustomerRepository customers;
    private final AccountRepository accounts;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CustomerService customerService;

    public AuthService(CustomerRepository customers, AccountRepository accounts, PasswordEncoder passwordEncoder,
                       JwtService jwtService, CustomerService customerService) {
        this.customers = customers;
        this.accounts = accounts;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.customerService = customerService;
    }

    @Transactional
    public AuthenticationResponse register(RegisterRequest request) {
        Customer saved = createCustomer(request);
        return responseFor(saved);
    }

    @Transactional
    public Customer createCustomer(RegisterRequest request) {
        validateRegistration(request);
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        String cpf = digitsOnly(request.cpf());
        Customer customer = new Customer(nextCode(), request.name().trim(), request.birthDate(), cpf,
                digitsOnly(request.phone()));
        customer.attachAccount(new Account(email, passwordEncoder.encode(request.password())));
        customer.addAddress(toAddress(request.billingAddress(), AddressType.BILLING));
        customer.addAddress(toAddress(request.deliveryAddress(), AddressType.DELIVERY));
        return customerService.create(customer);
    }

    @Transactional(readOnly = true)
    public AuthenticationResponse login(LoginRequest request) {
        String email = request.email() == null ? "" : request.email().trim().toLowerCase(Locale.ROOT);
        Account account = accounts.findByEmailIgnoreCaseAndDeletedAtIsNull(email)
                .filter(Account::isActive)
                .filter(found -> passwordEncoder.matches(request.password(), found.getPasswordHash()))
                .orElseThrow(() -> new InvalidCredentialsException("E-mail ou senha inválidos."));
        if (account.getCustomer() != null && !account.getCustomer().isActive())
            throw new InvalidCredentialsException("E-mail ou senha inválidos.");
        return responseFor(account);
    }

    private AuthenticationResponse responseFor(Customer customer) {
        return responseFor(customer.getAccount());
    }

    private AuthenticationResponse responseFor(Account account) {
        Customer customer = account.getCustomer();
        Long customerId = customer == null ? null : customer.getId();
        String name = customer == null ? account.getAdmin().getName() : customer.getName();
        String token = jwtService.createAccessToken(account.getId(), customerId, account.getEmail(), account.getRole());
        return new AuthenticationResponse(token, "Bearer", jwtService.getAccessTokenTtlSeconds(),
                customerId, name, account.getRole().name());
    }

    private String nextCode() {
        String code;
        do {
            code = "CU-" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase(Locale.ROOT);
        } while (customers.existsByCode(code));
        return code;
    }

    private static void validateRegistration(RegisterRequest request) {
        if (request == null || request.billingAddress() == null || request.deliveryAddress() == null
                || isBlank(request.name()) || request.birthDate() == null || isBlank(request.email())) {
            throw new InvalidRequestException("Preencha os dados obrigatórios do cliente.");
        }
        if (!digitsOnly(request.phone()).matches("\\d{10,11}")) {
            throw new InvalidRequestException("Informe um telefone válido.");
        }
        if (isBlank(request.password()) || !request.password().equals(request.passwordConfirmation())
                || !request.password().matches("(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}")) {
            throw new InvalidRequestException("A senha deve ter ao menos 8 caracteres, maiúscula, minúscula e caractere especial.");
        }
        validateAddress(request.billingAddress());
        validateAddress(request.deliveryAddress());
    }

    private static void validateAddress(AddressRequest address) {
        if (isBlank(address.label()) || isBlank(address.street()) || isBlank(address.number())
                || isBlank(address.neighborhood()) || !digitsOnly(address.postalCode()).matches("\\d{8}")
                || isBlank(address.city()) || !address.state().trim().matches("[A-Za-z]{2}") || isBlank(address.country())) {
            throw new InvalidRequestException("Informe endereços completos de cobrança e entrega.");
        }
    }

    private static CustomerAddress toAddress(AddressRequest address, AddressType type) {
        return new CustomerAddress(address.label().trim(), type, address.street().trim(),
                address.number().trim(), address.neighborhood().trim(), digitsOnly(address.postalCode()),
                address.city().trim(), address.state().trim().toUpperCase(Locale.ROOT), address.country().trim());
    }

    private static String digitsOnly(String value) {
        return value == null ? "" : value.replaceAll("\\D", "");
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
