package com.hida.cohida.customer.service;

import com.hida.cohida.account.repository.AccountRepository;
import com.hida.cohida.auth.dto.AddressRequest;
import com.hida.cohida.auth.exception.InvalidRequestException;
import com.hida.cohida.customer.domain.Customer;
import com.hida.cohida.customer.domain.CustomerAddress;
import com.hida.cohida.customer.dto.CustomerAddressRequest;
import com.hida.cohida.customer.dto.CustomerProfileUpdateRequest;
import com.hida.cohida.customer.dto.CustomerUpdateRequest;
import com.hida.cohida.customer.dto.PasswordUpdateRequest;
import com.hida.cohida.customer.enums.AddressType;
import com.hida.cohida.customer.exception.CustomerNotFoundException;
import com.hida.cohida.customer.exception.CustomerValidationException;
import com.hida.cohida.customer.exception.DuplicateCustomerDataException;
import com.hida.cohida.customer.repository.CustomerRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
public class CustomerService {
    private final CustomerRepository customers;
    private final AccountRepository accounts;
    private final PasswordEncoder passwordEncoder;

    public CustomerService(CustomerRepository customers, AccountRepository accounts, PasswordEncoder passwordEncoder) {
        this.customers = customers;
        this.accounts = accounts;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public Customer create(Customer customer) {
        return save(customer);
    }

    @Transactional(readOnly = true)
    public Customer findById(Long id) {
        return customers.findWithDetailsById(id).orElseThrow(() -> new CustomerNotFoundException(id));
    }

    @Transactional(readOnly = true)
    public Page<Customer> findActivePage(String search, int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new IllegalArgumentException("A página deve ser não negativa e o tamanho deve estar entre 1 e 100.");
        }
        return customers.findActivePage(search == null ? "" : search.trim(), PageRequest.of(page, size));
    }

    @Transactional
    public Customer update(Long id, CustomerUpdateRequest request) {
        if (request == null || request.billingAddress() == null || request.deliveryAddress() == null) {
            throw new InvalidRequestException("Preencha os dados obrigatórios do cliente.");
        }
        Customer customer = findById(id);
        updateProfile(customer, request.name(), request.birthDate(), request.phone(), request.email());
        customer.replaceAddresses(
                toAddress(request.billingAddress(), AddressType.BILLING),
                toAddress(request.deliveryAddress(), AddressType.DELIVERY)
        );
        return save(customer);
    }

    @Transactional
    public Customer updateProfile(Long id, CustomerProfileUpdateRequest request) {
        if (request == null) {
            throw new InvalidRequestException("Preencha os dados obrigatórios do cliente.");
        }
        Customer customer = findById(id);
        updateProfile(customer, request.name(), request.birthDate(), request.phone(), request.email());
        return save(customer);
    }

    @Transactional
    public void changePassword(Long id, PasswordUpdateRequest request) {
        Customer customer = findById(id);
        if (request == null || !passwordEncoder.matches(request.currentPassword(), customer.getAccount().getPasswordHash())
                || !strong(request.newPassword()) || !request.newPassword().equals(request.newPasswordConfirmation())) {
            throw new InvalidRequestException("Solicitação de alteração de senha inválida.");
        }
        customer.getAccount().changePassword(passwordEncoder.encode(request.newPassword()));
        save(customer);
    }

    @Transactional
    public void deactivate(Long id) {
        Customer customer = findById(id);
        customer.deactivate();
        customers.save(customer);
    }

    @Transactional(readOnly = true)
    public List<CustomerAddress> findAddresses(Long customerId) {
        return findById(customerId).getAddresses();
    }

    @Transactional
    public CustomerAddress addAddress(Long customerId, CustomerAddressRequest request) {
        Customer customer = findById(customerId);
        CustomerAddress address = toAddress(request);
        customer.addAddress(address);
        save(customer);
        return address;
    }

    @Transactional
    public CustomerAddress updateAddress(Long customerId, Long addressId, CustomerAddressRequest request) {
        Customer customer = findById(customerId);
        CustomerAddress address = customer.address(addressId);
        CustomerAddressRequest normalized = normalized(request);
        address.update(normalized);
        save(customer);
        return address;
    }

    @Transactional
    public void removeAddress(Long customerId, Long addressId) {
        Customer customer = findById(customerId);
        customer.removeAddress(addressId);
        save(customer);
    }

    private Customer save(Customer customer) {
        validate(customer);
        assertUnique(customer);
        return customers.save(customer);
    }

    private static void updateProfile(Customer customer, String name, java.time.LocalDate birthDate, String phone, String email) {
        if (isBlank(name) || birthDate == null || isBlank(email) || !digits(phone).matches("\\d{10,11}")) {
            throw new InvalidRequestException("Preencha os dados obrigatórios do cliente.");
        }
        customer.updateProfile(name.trim(), birthDate, digits(phone), email.trim().toLowerCase(Locale.ROOT));
    }

    private void validate(Customer customer) {
        if (customer == null || isBlank(customer.getCode()) || isBlank(customer.getName())
                || customer.getBirthDate() == null || isBlank(customer.getCpf()) || isBlank(customer.getPhone())
                || customer.getAccount() == null) {
            throw new CustomerValidationException("Preencha os dados obrigatórios do cliente.");
        }
        customer.normalize();
        validateCpf(customer.getCpf());
        customer.ensureRequiredAddressTypes();
    }

    private void assertUnique(Customer customer) {
        Long customerId = customer.getId();
        if (customerId == null ? customers.existsByCode(customer.getCode())
                : customers.existsByCodeAndIdNot(customer.getCode(), customerId)) {
            throw new DuplicateCustomerDataException("Código de cliente já cadastrado.");
        }
        if (customerId == null ? customers.existsByCpf(customer.getCpf())
                : customers.existsByCpfAndIdNot(customer.getCpf(), customerId)) {
            throw new DuplicateCustomerDataException("CPF já cadastrado.");
        }
        Long accountId = customer.getAccount().getId();
        if (accountId == null ? accounts.existsByEmailIgnoreCase(customer.getAccount().getEmail())
                : accounts.existsByEmailIgnoreCaseAndIdNot(customer.getAccount().getEmail(), accountId)) {
            throw new DuplicateCustomerDataException("E-mail já cadastrado.");
        }
    }

    private static CustomerAddress toAddress(AddressRequest address, AddressType type) {
        if (address == null || isBlank(address.label()) || isBlank(address.street()) || isBlank(address.number())
                || isBlank(address.neighborhood()) || !digits(address.postalCode()).matches("\\d{8}")
                || isBlank(address.city()) || isBlank(address.state()) || isBlank(address.country())) {
            throw new InvalidRequestException("Informe um endereço completo.");
        }
        return new CustomerAddress(address.label().trim(), type, address.street().trim(), address.number().trim(),
                address.neighborhood().trim(), digits(address.postalCode()), address.city().trim(),
                address.state().trim().toUpperCase(Locale.ROOT), address.country().trim());
    }

    private static CustomerAddress toAddress(CustomerAddressRequest request) {
        CustomerAddressRequest normalized = normalized(request);
        return new CustomerAddress(normalized.label(), normalized.type(), normalized.street(), normalized.number(),
                normalized.neighborhood(), normalized.postalCode(), normalized.city(), normalized.state(),
                normalized.country());
    }

    private static CustomerAddressRequest normalized(CustomerAddressRequest request) {
        if (request == null || request.type() == null || isBlank(request.label()) || isBlank(request.street())
                || isBlank(request.number()) || isBlank(request.neighborhood())
                || !digits(request.postalCode()).matches("\\d{8}") || isBlank(request.city())
                || isBlank(request.state()) || isBlank(request.country())) {
            throw new InvalidRequestException("Informe um endereço completo.");
        }
        return new CustomerAddressRequest(request.type(), request.label().trim(), request.street().trim(),
                request.number().trim(), request.neighborhood().trim(), digits(request.postalCode()),
                request.city().trim(), request.state().trim().toUpperCase(Locale.ROOT), request.country().trim());
    }

    private static void validateCpf(String cpf) {
        if (!cpf.matches("\\d{11}") || cpf.chars().distinct().count() == 1
                || cpf.charAt(9) - '0' != cpfDigit(cpf, 9) || cpf.charAt(10) - '0' != cpfDigit(cpf, 10)) {
            throw new CustomerValidationException("CPF inválido.");
        }
    }

    private static int cpfDigit(String cpf, int position) {
        int sum = 0;
        for (int index = 0; index < position; index++) {
            sum += (cpf.charAt(index) - '0') * (position + 1 - index);
        }
        int remainder = (sum * 10) % 11;
        return remainder == 10 ? 0 : remainder;
    }

    private static boolean strong(String value) {
        return value != null && value.matches("(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}");
    }

    private static String digits(String value) {
        return value == null ? "" : value.replaceAll("\\D", "");
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
