package com.hida.cohida.customer.service;

import com.hida.cohida.auth.dto.AddressRequest;
import com.hida.cohida.auth.exception.InvalidRequestException;
import com.hida.cohida.customer.domain.Customer;
import com.hida.cohida.customer.domain.CustomerAddress;
import com.hida.cohida.customer.dto.CustomerAddressRequest;
import com.hida.cohida.customer.enums.AddressType;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomerAddressService {
  private final CustomerService customers;

  public CustomerAddressService(CustomerService customers) {
    this.customers = customers;
  }

  @Transactional(readOnly = true)
  public List<CustomerAddress> findAddresses(Long customerId) {
    return customers.findById(customerId).getAddresses();
  }

  @Transactional
  public CustomerAddress addAddress(
      Long customerId, CustomerAddressRequest request) {
    Customer customer = customers.findById(customerId);
    CustomerAddress address = toAddress(request);
    customer.addAddress(address);
    customers.save(customer);
    return address;
  }

  @Transactional
  public CustomerAddress updateAddress(
      Long customerId, Long addressId, CustomerAddressRequest request) {
    Customer customer = customers.findById(customerId);
    CustomerAddress address = customer.address(addressId);
    CustomerAddressRequest normalized = normalized(request);
    address.update(normalized);
    customers.save(customer);
    return address;
  }

  @Transactional
  public void removeAddress(Long customerId, Long addressId) {
    Customer customer = customers.findById(customerId);
    customer.removeAddress(addressId);
    customers.save(customer);
  }

  static CustomerAddress toAddress(
      AddressRequest address, AddressType type) {
    if (address == null
        || isBlank(address.label())
        || isBlank(address.street())
        || isBlank(address.number())
        || isBlank(address.neighborhood())
        || !digits(address.postalCode()).matches("\\d{8}")
        || isBlank(address.city())
        || isBlank(address.state())
        || isBlank(address.country())) {
      throw new InvalidRequestException("Informe um endereço completo.");
    }
    return new CustomerAddress(
        address.label().trim(),
        type,
        address.street().trim(),
        address.number().trim(),
        address.neighborhood().trim(),
        digits(address.postalCode()),
        address.city().trim(),
        address.state().trim().toUpperCase(Locale.ROOT),
        address.country().trim());
  }

  private static CustomerAddress toAddress(CustomerAddressRequest request) {
    CustomerAddressRequest normalized = normalized(request);
    return new CustomerAddress(
        normalized.label(),
        normalized.type(),
        normalized.street(),
        normalized.number(),
        normalized.neighborhood(),
        normalized.postalCode(),
        normalized.city(),
        normalized.state(),
        normalized.country());
  }

  private static CustomerAddressRequest normalized(
      CustomerAddressRequest request) {
    if (request == null
        || request.type() == null
        || isBlank(request.label())
        || isBlank(request.street())
        || isBlank(request.number())
        || isBlank(request.neighborhood())
        || !digits(request.postalCode()).matches("\\d{8}")
        || isBlank(request.city())
        || isBlank(request.state())
        || isBlank(request.country())) {
      throw new InvalidRequestException("Informe um endereço completo.");
    }
    return new CustomerAddressRequest(
        request.type(),
        request.label().trim(),
        request.street().trim(),
        request.number().trim(),
        request.neighborhood().trim(),
        digits(request.postalCode()),
        request.city().trim(),
        request.state().trim().toUpperCase(Locale.ROOT),
        request.country().trim());
  }

  private static String digits(String value) {
    return value == null ? "" : value.replaceAll("\\D", "");
  }

  private static boolean isBlank(String value) {
    return value == null || value.isBlank();
  }
}
