package com.hida.cohida.order.repository;

import com.hida.cohida.order.domain.SaleOrder;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<SaleOrder, Long> {
    @Query(value = """
            with item_shares as (
                select o.id as order_id, o.created_at, i.id as item_id, i.variant_id,
                       i.unit_price_cents * i.quantity as gross,
                       least(o.discount_cents, o.subtotal_cents) as discount,
                       case when o.subtotal_cents > 0 then
                           cast(i.unit_price_cents as numeric) * i.quantity * least(o.discount_cents, o.subtotal_cents) / o.subtotal_cents
                       else 0 end as share
                from orders o join order_items i on i.order_id = o.id
                where o.status = 'ENTREGUE' and o.created_at >= :from and o.created_at < :until
            ), allocated as (
                select *, floor(share) as base_discount,
                       row_number() over (partition by order_id order by (share - floor(share)) desc, item_id) as remainder_rank,
                       discount - sum(floor(share)) over (partition by order_id) as remainder
                from item_shares
            )
            select extract(year from a.created_at), extract(month from a.created_at), pc.category,
                   sum(a.gross - a.base_discount - case when a.remainder_rank <= a.remainder then 1 else 0 end),
                   count(distinct a.order_id)
            from allocated a
            join product_variants v on v.id = a.variant_id
            join product_categories pc on pc.product_id = v.product_id
            where pc.category in (:categories)
            group by extract(year from a.created_at), extract(month from a.created_at), pc.category
            """, nativeQuery = true)
    List<Object[]> aggregateDeliveredSalesByCategory(@Param("from") LocalDateTime from,
                                                      @Param("until") LocalDateTime until,
                                                      @Param("categories") List<String> categories);

    @EntityGraph(attributePaths = {"items", "issuedCoupon"})
    List<SaleOrder> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    @EntityGraph(attributePaths = {"items", "issuedCoupon"})
    Optional<SaleOrder> findByIdAndCustomerId(Long id, Long customerId);

    @EntityGraph(attributePaths = {"items", "issuedCoupon"})
    List<SaleOrder> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"items", "issuedCoupon"})
    Optional<SaleOrder> findById(Long id);

    @Modifying
    @Query("update SaleOrder order set order.createdAt = :createdAt where order.id = :id")
    void updateCreatedAt(@Param("id") Long id, @Param("createdAt") LocalDateTime createdAt);
}
