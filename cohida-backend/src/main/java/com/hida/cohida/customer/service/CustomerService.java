package com.hida.cohida.customer.service;

import com.hida.cohida.account.repository.AccountRepository;
import com.hida.cohida.auth.dto.AddressRequest;
import com.hida.cohida.auth.exception.InvalidRequestException;
import com.hida.cohida.auth.validation.PasswordPolicy;
import com.hida.cohida.auth.session.RefreshSessionRepository;
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
import org.springframework.data.domain.Sort;
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
  private final RefreshSessionRepository sessions;

  public CustomerService(
      CustomerRepository customers,
      AccountRepository accounts,
      PasswordEncoder passwordEncoder, RefreshSessionRepository sessions) {
    this.customers = customers;
    this.accounts = accounts;
    this.passwordEncoder = passwordEncoder;
    this.sessions = sessions;
  }

  @Transactional
  public Customer create(Customer customer) {
    return save(customer);
  }

  @Transactional(readOnly = true)
  public Customer findById(Long id) {
    return customers
        .findWithDetailsById(id)
        .orElseThrow(() -> new CustomerNotFoundException(id));
  }

  @Transactional(readOnly = true)
  public Page<Customer> findPage(
      String search, String status, String sort, int page, int size) {
    if (page < 0 || size < 1 || size > 100) {
      throw new IllegalArgumentException(
          "A página deve ser não negativa e "
              + "o tamanho deve estar entre 1 e 100.");
    }
    String normalizedStatus =
        status == null ? "ACTIVE" : status.trim().toUpperCase(Locale.ROOT);
    if (!List.of("ACTIVE", "INACTIVE", "ALL").contains(normalizedStatus)) {
      throw new IllegalArgumentException(
          "O status deve ser ACTIVE, INACTIVE ou ALL.");
    }
    Sort.Direction direction =
        Sort.Direction.fromOptionalString(sort)
            .orElseThrow(
                () ->
                    new IllegalArgumentException(
                        "A ordenação deve ser ASC ou DESC."));
    return customers.findPage(
        search == null ? "" : search.trim(),
        normalizedStatus,
        PageRequest.of(
            page,
            size,
            Sort.by(direction, "name").and(Sort.by(Sort.Direction.ASC, "id"))));
  }

  @Transactional
  public Customer update(Long id, CustomerUpdateRequest request) {
    if (request == null
        || request.billingAddress() == null
        || request.deliveryAddress() == null) {
      throw new InvalidRequestException(
          "Preencha os dados obrigatórios do cliente.");
    }
    Customer customer = findById(id);
    updateProfile(
        customer,
        request.name(),
        request.birthDate(),
        request.phone(),
        request.email());
    customer.replaceAddresses(
        CustomerAddressService.toAddress(
            request.billingAddress(), AddressType.BILLING),
        CustomerAddressService.toAddress(
            request.deliveryAddress(), AddressType.DELIVERY));
    return save(customer);
  }

  @Transactional
  public Customer updateProfile(Long id, CustomerProfileUpdateRequest request) {
    if (request == null) {
      throw new InvalidRequestException(
          "Preencha os dados obrigatórios do cliente.");
    }
    Customer customer = findById(id);
    updateProfile(
        customer,
        request.name(),
        request.birthDate(),
        request.phone(),
        request.email());
    return save(customer);
  }

  @Transactional
  public void changePassword(Long id, PasswordUpdateRequest request) {
    Customer customer = findById(id);
    if (request == null
        || !passwordEncoder.matches(
            request.currentPassword(), customer.getAccount().getPasswordHash())
        || !PasswordPolicy.isStrong(request.newPassword())
        || !request.newPassword().equals(request.newPasswordConfirmation())) {
      throw new InvalidRequestException(
          "Solicitação de alteração de senha inválida.");
    }
    customer
        .getAccount()
        .changePassword(passwordEncoder.encode(request.newPassword()));
    save(customer);
    sessions.revokeAccount(
        customer.getAccount().getId(),
        java.time.LocalDateTime.now(java.time.ZoneOffset.UTC));
  }

  @Transactional
  public void deactivate(Long id) {
    Customer customer = findById(id);
    customer.deactivate();
    customers.save(customer);
    sessions.revokeAccount(
        customer.getAccount().getId(),
        java.time.LocalDateTime.now(java.time.ZoneOffset.UTC));
  }

  Customer save(Customer customer) {
    validate(customer);
    assertUnique(customer);
    return customers.save(customer);
  }

  private static void updateProfile(
      Customer customer,
      String name,
      java.time.LocalDate birthDate,
      String phone,
      String email) {
    if (isBlank(name)
        || birthDate == null
        || isBlank(email)
        || !digits(phone).matches("\\d{10,11}")) {
      throw new InvalidRequestException(
          "Preencha os dados obrigatórios do cliente.");
    }
    customer.updateProfile(
        name.trim(),
        birthDate,
        digits(phone),
        email.trim().toLowerCase(Locale.ROOT));
  }

  private void validate(Customer customer) {
    if (customer == null
        || isBlank(customer.getCode())
        || isBlank(customer.getName())
        || customer.getBirthDate() == null
        || isBlank(customer.getCpf())
        || isBlank(customer.getPhone())
        || customer.getAccount() == null) {
      throw new CustomerValidationException(
          "Preencha os dados obrigatórios do cliente.");
    }
    customer.normalize();
    validateCpf(customer.getCpf());
    customer.ensureRequiredAddressTypes();
  }

  private void assertUnique(Customer customer) {
    Long customerId = customer.getId();
    if (customerId == null
        ? customers.existsByCode(customer.getCode())
        : customers.existsByCodeAndIdNot(customer.getCode(), customerId)) {
      throw new DuplicateCustomerDataException(
          "Código de cliente já cadastrado.");
    }
    if (customerId == null
        ? customers.existsByCpf(customer.getCpf())
        : customers.existsByCpfAndIdNot(customer.getCpf(), customerId)) {
      throw new DuplicateCustomerDataException("CPF já cadastrado.");
    }
    Long accountId = customer.getAccount().getId();
    if (accountId == null
        ? accounts.existsByEmailIgnoreCase(customer.getAccount().getEmail())
        : accounts.existsByEmailIgnoreCaseAndIdNot(
            customer.getAccount().getEmail(), accountId)) {
      throw new DuplicateCustomerDataException("E-mail já cadastrado.");
    }
  }

  private static void validateCpf(String cpf) {
    if (!cpf.matches("\\d{11}")
        || cpf.chars().distinct().count() == 1
        || cpf.charAt(9) - '0' != cpfDigit(cpf, 9)
        || cpf.charAt(10) - '0' != cpfDigit(cpf, 10)) {
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

  private static String digits(String value) {
    return value == null ? "" : value.replaceAll("\\D", "");
  }

  private static boolean isBlank(String value) {
    return value == null || value.isBlank();
  }
}
