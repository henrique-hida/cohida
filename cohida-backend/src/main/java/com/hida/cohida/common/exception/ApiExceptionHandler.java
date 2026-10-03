package com.hida.cohida.common.exception;

import com.hida.cohida.auth.exception.ConflictException;
import com.hida.cohida.auth.exception.InvalidCredentialsException;
import com.hida.cohida.auth.exception.InvalidRequestException;
import com.hida.cohida.coupon.exception.CouponNotFoundException;
import com.hida.cohida.customer.exception.CustomerNotFoundException;
import com.hida.cohida.customer.exception.CustomerValidationException;
import com.hida.cohida.customer.exception.DuplicateCustomerDataException;
import com.hida.cohida.order.exception.OrderNotFoundException;
import com.hida.cohida.paymentcard.exception.PaymentCardNotFoundException;
import com.hida.cohida.product.exception.ProductNotFoundException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<Map<String, Object>> responseStatus(ResponseStatusException exception) {
        String message = exception.getReason() == null ? "Não foi possível concluir a operação." : exception.getReason();
        return error(HttpStatus.valueOf(exception.getStatusCode().value()), message);
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentNotValidException.class})
    ResponseEntity<Map<String, Object>> malformedRequest(Exception exception) {
        return error(HttpStatus.BAD_REQUEST, "A requisição contém dados inválidos.");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<Map<String, Object>> illegalArgument(IllegalArgumentException exception) {
        return error(HttpStatus.BAD_REQUEST, exception.getMessage());
    }

    @ExceptionHandler(InvalidRequestException.class)
    ResponseEntity<Map<String, Object>> invalidRequest(InvalidRequestException exception) {
        return error(HttpStatus.BAD_REQUEST, exception.getMessage());
    }

    @ExceptionHandler(ConflictException.class)
    ResponseEntity<Map<String, Object>> conflict(ConflictException exception) {
        return error(HttpStatus.CONFLICT, exception.getMessage());
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    ResponseEntity<Map<String, Object>> invalidCredentials(InvalidCredentialsException exception) {
        return error(HttpStatus.UNAUTHORIZED, exception.getMessage());
    }

    @ExceptionHandler(CustomerValidationException.class)
    ResponseEntity<Map<String, Object>> customerValidation(CustomerValidationException exception) {
        return error(HttpStatus.BAD_REQUEST, exception.getMessage());
    }

    @ExceptionHandler(DuplicateCustomerDataException.class)
    ResponseEntity<Map<String, Object>> duplicateCustomerData(DuplicateCustomerDataException exception) {
        return error(HttpStatus.CONFLICT, exception.getMessage());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<Map<String, Object>> dataIntegrityViolation(DataIntegrityViolationException exception) {
        return error(HttpStatus.CONFLICT, "Já existe um registro com esses dados.");
    }

    @ExceptionHandler(CustomerNotFoundException.class)
    ResponseEntity<Map<String, Object>> customerNotFound(CustomerNotFoundException exception) {
        return error(HttpStatus.NOT_FOUND, exception.getMessage());
    }

    @ExceptionHandler(PaymentCardNotFoundException.class)
    ResponseEntity<Map<String, Object>> paymentCardNotFound(PaymentCardNotFoundException exception) {
        return error(HttpStatus.NOT_FOUND, exception.getMessage());
    }

    @ExceptionHandler(ProductNotFoundException.class)
    ResponseEntity<Map<String, Object>> productNotFound(ProductNotFoundException exception) {
        return error(HttpStatus.NOT_FOUND, exception.getMessage());
    }

    @ExceptionHandler(CouponNotFoundException.class)
    ResponseEntity<Map<String, Object>> couponNotFound(CouponNotFoundException exception) {
        return error(HttpStatus.NOT_FOUND, exception.getMessage());
    }

    @ExceptionHandler(OrderNotFoundException.class)
    ResponseEntity<Map<String, Object>> orderNotFound(OrderNotFoundException exception) {
        return error(HttpStatus.NOT_FOUND, exception.getMessage());
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<Map<String, Object>> unexpected(Exception exception) {
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "Ocorreu um erro interno. Tente novamente.");
    }

    private ResponseEntity<Map<String, Object>> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("timestamp", Instant.now().toString(),
                "status", status.value(), "message", message));
    }
}
