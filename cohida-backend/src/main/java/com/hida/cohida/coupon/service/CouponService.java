package com.hida.cohida.coupon.service;

import com.hida.cohida.auth.exception.ConflictException;
import com.hida.cohida.auth.exception.InvalidRequestException;
import com.hida.cohida.coupon.domain.Coupon;
import com.hida.cohida.coupon.domain.CouponDiscountType;
import com.hida.cohida.coupon.dto.CouponUpsertRequest;
import com.hida.cohida.coupon.exception.CouponNotFoundException;
import com.hida.cohida.coupon.repository.CouponRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
public class CouponService {
    private final CouponRepository coupons;

    public CouponService(CouponRepository coupons) {
        this.coupons = coupons;
    }

    @Transactional(readOnly = true)
    public List<Coupon> findAll() {
        return coupons.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public Coupon findById(Long id) {
        return coupons.findById(id).orElseThrow(() -> new CouponNotFoundException(id.toString()));
    }

    @Transactional
    public Coupon create(CouponUpsertRequest request) {
        ValidatedCoupon input = validate(request);
        if (coupons.existsByCode(input.code())) {
            throw new ConflictException("Já existe um cupom com o código " + input.code() + ".");
        }
        return coupons.save(input.toCoupon());
    }

    @Transactional
    public Coupon update(Long id, CouponUpsertRequest request) {
        Coupon coupon = findById(id);
        ValidatedCoupon input = validate(request);
        if (coupons.existsByCodeAndIdNot(input.code(), id)) {
            throw new ConflictException("Já existe um cupom com o código " + input.code() + ".");
        }
        input.applyTo(coupon);
        return coupons.save(coupon);
    }

    @Transactional
    public void deactivate(Long id) {
        Coupon coupon = findById(id);
        coupon.deactivate();
        coupons.save(coupon);
    }

    private static ValidatedCoupon validate(CouponUpsertRequest request) {
        if (request == null || isBlank(request.code()) || isBlank(request.description()) || request.discountType() == null
                || request.validFrom() == null || request.expiresAt() == null || !request.expiresAt().isAfter(request.validFrom())
                || (request.minimumOrderValueCents() != null && request.minimumOrderValueCents() < 0)
                || (request.maximumUses() != null && request.maximumUses() <= 0)
                || !request.code().trim().matches("[A-Za-z0-9_-]{3,50}")) {
            throw new InvalidRequestException("Informe código, descrição, período válido e regras de uso válidas para o cupom.");
        }

        if (request.discountType() == CouponDiscountType.FIXED_AMOUNT) {
            if (request.discountCents() == null || request.discountCents() <= 0 || request.discountPercentage() != null
                    || request.maximumDiscountCents() != null) {
                throw new InvalidRequestException("Um desconto fixo exige valor em centavos e não aceita percentual ou teto.");
            }
        } else if (request.discountPercentage() == null || request.discountPercentage().signum() <= 0
                || request.discountPercentage().compareTo(new BigDecimal("100")) > 0 || request.discountCents() != null
                || (request.maximumDiscountCents() != null && request.maximumDiscountCents() <= 0)) {
            throw new InvalidRequestException("Um desconto percentual exige percentual entre 0 e 100 e teto positivo, quando informado.");
        }

        return new ValidatedCoupon(request.code().trim().toUpperCase(Locale.ROOT), request.description().trim(),
                request.discountType(), request.discountCents(), request.discountPercentage(), request.maximumDiscountCents(),
                request.minimumOrderValueCents(), request.validFrom(), request.expiresAt(), request.maximumUses(),
                request.active() == null || request.active());
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private record ValidatedCoupon(String code, String description, CouponDiscountType discountType, Long discountCents,
                                   BigDecimal discountPercentage, Long maximumDiscountCents,
                                   Long minimumOrderValueCents,
                                   LocalDateTime validFrom, LocalDateTime expiresAt, Integer maximumUses,
                                   boolean active) {
        Coupon toCoupon() {
            return new Coupon(code, description, discountType, discountCents, discountPercentage, maximumDiscountCents,
                    minimumOrderValueCents, validFrom, expiresAt, maximumUses, active);
        }

        void applyTo(Coupon coupon) {
            coupon.update(code, description, discountType, discountCents, discountPercentage, maximumDiscountCents,
                    minimumOrderValueCents, validFrom, expiresAt, maximumUses, active);
        }
    }
}
