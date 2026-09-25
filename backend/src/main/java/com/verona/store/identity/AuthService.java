package com.verona.store.identity;

import com.verona.store.identity.AuthDtos.AuthResponse;
import com.verona.store.identity.AuthDtos.LoginRequest;
import com.verona.store.identity.AuthDtos.RegisterRequest;
import com.verona.store.identity.AuthDtos.UserView;
import com.verona.store.security.JwtService;
import com.verona.store.shared.exception.BusinessException;
import com.verona.store.shared.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalize(request.email());
        if (users.existsByEmailIgnoreCase(email)) {
            throw new BusinessException("EMAIL_TAKEN", "An account with this email already exists");
        }
        User user = new User();
        user.setEmail(email);
        user.setFullName(request.fullName().trim());
        user.setPhone(request.phone());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(Role.CUSTOMER);
        user.setPreferredLocale(request.locale() == null ? "ar" : request.locale());
        return issue(users.save(user));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = users.findByEmailIgnoreCase(normalize(request.email()))
                .filter(User::isEnabled)
                .filter(u -> passwordEncoder.matches(request.password(), u.getPasswordHash()))
                .orElseThrow(() -> new BusinessException("INVALID_CREDENTIALS", "Email or password is incorrect",
                        HttpStatus.UNAUTHORIZED));
        return issue(user);
    }

    @Transactional(readOnly = true)
    public UserView me(Long userId) {
        // A disabled account keeps a still-valid JWT until it expires; refusing it here signs the UI out at once.
        User user = users.findById(userId).orElseThrow(() -> new NotFoundException("User", userId));
        if (!user.isEnabled()) {
            throw new BusinessException("ACCOUNT_DISABLED", "This account has been disabled", HttpStatus.UNAUTHORIZED);
        }
        return UserView.of(user);
    }

    private AuthResponse issue(User user) {
        var token = jwtService.issue(user.getId(), user.getEmail(), user.getRole());
        return new AuthResponse(token.value(), token.expiresAt(), UserView.of(user));
    }

    private static String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
