package com.verona.store.shared.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * A rule violation the client can act on. {@code code} is a stable key the frontend translates.
 */
@Getter
public class BusinessException extends RuntimeException {

    private final String code;
    private final HttpStatus status;

    public BusinessException(String code, String message) {
        this(code, message, HttpStatus.CONFLICT);
    }

    public BusinessException(String code, String message, HttpStatus status) {
        super(message);
        this.code = code;
        this.status = status;
    }
}
