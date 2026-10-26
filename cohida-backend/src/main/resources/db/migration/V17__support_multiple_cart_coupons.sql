CREATE TABLE cohida.cart_coupons (
    cart_id BIGINT NOT NULL REFERENCES cohida.carts (id) ON DELETE CASCADE,
    coupon_id BIGINT NOT NULL REFERENCES cohida.coupons (id),
    PRIMARY KEY (cart_id, coupon_id)
);

INSERT INTO cohida.cart_coupons (cart_id, coupon_id)
SELECT id, coupon_id FROM cohida.carts WHERE coupon_id IS NOT NULL;
