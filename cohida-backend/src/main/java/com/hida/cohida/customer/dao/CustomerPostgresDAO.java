package com.hida.cohida.customer;

import com.hida.cohida.common.IDAO;
import jakarta.persistence.EntityManager;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class CustomerDAO implements IDAO<Customer> {
    private final EntityManager entityManager;

    public CustomerDAO(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Override
    @Transactional
    public Customer save(Customer customer) {
        if (customer.getId() == null) {
            entityManager.persist(customer);
            return customer;
        }
        return entityManager.merge(customer);
    }

    @Override
    @Transactional
    public Customer update(Customer customer) {
        return entityManager.merge(customer);
    }

    @Override
    @Transactional
    public void delete(Customer customer) {
        Customer managedCustomer = entityManager.contains(customer)
                ? customer
                : entityManager.find(Customer.class, customer.getId());
        if (managedCustomer != null) {
            managedCustomer.deactivate();
        }
    }

    @Override
    public List<Customer> findAll(Customer filters) {
        return entityManager.createQuery("""
                        select distinct customer
                        from Customer customer
                        left join fetch customer.addresses
                        where customer.deletedAt is null
                        order by customer.name
                        """, Customer.class)
                .getResultList();
    }

    public Optional<Customer> findById(Long id) {
        return entityManager.createQuery("""
                        select distinct customer
                        from Customer customer
                        left join fetch customer.addresses
                        where customer.id = :id
                        """, Customer.class)
                .setParameter("id", id)
                .getResultStream()
                .findFirst();
    }

    public List<Customer> findPage(String search, int page, int size) {
        String pattern = "%" + (search == null ? "" : search.trim().toLowerCase()) + "%";
        return entityManager.createQuery("""
                        select distinct customer from Customer customer
                        join customer.account account
                        left join fetch customer.addresses
                        where customer.deletedAt is null and (
                            lower(customer.name) like :pattern or lower(customer.code) like :pattern
                            or customer.cpf like :pattern or customer.phone like :pattern
                            or lower(account.email) like :pattern)
                        order by customer.name
                        """, Customer.class)
                .setParameter("pattern", pattern)
                .setFirstResult(page * size)
                .setMaxResults(size)
                .getResultList();
    }

    public long countPage(String search) {
        String pattern = "%" + (search == null ? "" : search.trim().toLowerCase()) + "%";
        return entityManager.createQuery("""
                        select count(customer) from Customer customer join customer.account account
                        where customer.deletedAt is null and (
                            lower(customer.name) like :pattern or lower(customer.code) like :pattern
                            or customer.cpf like :pattern or customer.phone like :pattern
                            or lower(account.email) like :pattern)
                        """, Long.class).setParameter("pattern", pattern).getSingleResult();
    }

    public Optional<Customer> findByEmail(String email) {
        return entityManager.createQuery("""
                        select customer
                        from Customer customer
                        join fetch customer.account account
                        where lower(account.email) = lower(:email)
                        """, Customer.class)
                .setParameter("email", email)
                .getResultStream()
                .findFirst();
    }

    public boolean existsByCode(String code) {
        return exists("select count(customer) from Customer customer where customer.code = :value", code, null);
    }

    public boolean existsByCpf(String cpf) {
        return exists("select count(customer) from Customer customer where customer.cpf = :value", cpf, null);
    }

    public boolean existsByEmail(String email) {
        return exists("""
                select count(customer)
                from Customer customer join customer.account account
                where lower(account.email) = lower(:value)
                """, email, null);
    }

    public boolean existsOtherCustomerByCode(Long customerId, String code) {
        return exists("select count(customer) from Customer customer where customer.code = :value", code, customerId);
    }

    public boolean existsOtherCustomerByCpf(Long customerId, String cpf) {
        return exists("select count(customer) from Customer customer where customer.cpf = :value", cpf, customerId);
    }

    public boolean existsOtherCustomerByEmail(Long customerId, String email) {
        return exists("""
                select count(customer)
                from Customer customer join customer.account account
                where lower(account.email) = lower(:value)
                """, email, customerId);
    }

    private boolean exists(String query, String value, Long excludedCustomerId) {
        if (excludedCustomerId != null) {
            query += " and customer.id <> :excludedCustomerId";
        }
        var typedQuery = entityManager.createQuery(query, Long.class).setParameter("value", value);
        if (excludedCustomerId != null) {
            typedQuery.setParameter("excludedCustomerId", excludedCustomerId);
        }
        Long count = typedQuery.getSingleResult();
        return count > 0;
    }

}
