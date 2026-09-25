package com.verona.store.identity;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public final class AuthDtos {

    private AuthDtos() {
    }

    public record RegisterRequest(
            @NotBlank @Size(max = 120) String fullName,
            @NotBlank @Email @Size(max = 160) String email,
            @Pattern(regexp = "^\\+?[0-9]{8,15}$", message = "invalid phone number") String phone,
            @NotBlank @Size(min = 8, max = 72) String password,
            /** Storefront language at sign-up; drives e-mail language. */
            @Pattern(regexp = "^(ar|en)$") String locale
    ) {
    }

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {
    }

    public record UserView(Long id, String email, String fullName, String phone, Role role) {

        static UserView of(User user) {
            return new UserView(user.getId(), user.getEmail(), user.getFullName(), user.getPhone(), user.getRole());
        }
    }

    public record AuthResponse(String accessToken, Instant expiresAt, UserView user) {
    }
}
