package com.hida.cohida.shipping;

import com.hida.cohida.cart.domain.CartItem;
import com.hida.cohida.customer.domain.CustomerAddress;

import java.util.List;

public interface ShippingCalculator {
    long calculate(List<CartItem> items, CustomerAddress address);
}
