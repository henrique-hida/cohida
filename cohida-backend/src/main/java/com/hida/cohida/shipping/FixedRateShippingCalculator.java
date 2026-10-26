package com.hida.cohida.shipping;

import com.hida.cohida.cart.domain.CartItem;
import com.hida.cohida.customer.domain.CustomerAddress;
import org.springframework.stereotype.Component;

import java.util.List;

/** Deterministic group rule until a carrier integration is introduced. */
@Component
public class FixedRateShippingCalculator implements ShippingCalculator {
    @Override
    public long calculate(List<CartItem> items, CustomerAddress address) {
        int quantity = items.stream().mapToInt(CartItem::getQuantity).sum();
        long freight = 1_000L + Math.max(0, quantity - 1) * 200L;
        return "SP".equalsIgnoreCase(address.getState()) ? freight : freight + 1_000L;
    }
}
