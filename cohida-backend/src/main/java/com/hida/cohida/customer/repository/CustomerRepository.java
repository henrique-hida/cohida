package com.hida.cohida.customer.repository;

import com.hida.cohida.customer.domain.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    @EntityGraph(attributePaths = {"addresses", "account"})
    @Query("""
            select customer from Customer customer
            where customer.id = :id
            """)
    Optional<Customer> findWithDetailsById(@Param("id") Long id);

    @EntityGraph(attributePaths = {"addresses", "account"})
    @Query(
            value = """
                    select customer from Customer customer
                    join customer.account account
                    where customer.deletedAt is null and (
                        lower(customer.name) like lower(concat('%', :search, '%'))
                        or lower(customer.code) like lower(concat('%', :search, '%'))
                        or customer.cpf like concat('%', :search, '%')
                        or customer.phone like concat('%', :search, '%')
                        or lower(account.email) like lower(concat('%', :search, '%'))
                    )
                    """,
            countQuery = """
                    select count(customer) from Customer customer
                    join customer.account account
                    where customer.deletedAt is null and (
                        lower(customer.name) like lower(concat('%', :search, '%'))
                        or lower(customer.code) like lower(concat('%', :search, '%'))
                        or customer.cpf like concat('%', :search, '%')
                        or customer.phone like concat('%', :search, '%')
                        or lower(account.email) like lower(concat('%', :search, '%'))
                    )
                    """
    )
    Page<Customer> findActivePage(@Param("search") String search, Pageable pageable);

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Long id);

    boolean existsByCpf(String cpf);

    boolean existsByCpfAndIdNot(String cpf, Long id);
}
