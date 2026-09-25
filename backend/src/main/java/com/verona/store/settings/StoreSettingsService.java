package com.verona.store.settings;

import com.verona.store.ordering.domain.PaymentMethod;
import com.verona.store.payments.gateway.PaymentGateways;
import com.verona.store.shared.exception.BusinessException;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

/**
 * Owner-controlled store switches. A payment method is offered to shoppers only when the owner has
 * turned it on AND (for cards) a gateway is configured on the server, so the storefront can never show
 * a payment option that would fail.
 */
@Service
@RequiredArgsConstructor
public class StoreSettingsService {

    private final StoreSettingsRepository repository;
    private final PaymentGateways gateways;

    public record SettingsView(
            boolean cashOnDeliveryEnabled,
            boolean cardPaymentsEnabled,
            String orderNotificationEmail,
            /** Server-side fact the owner cannot change from the UI: is a card gateway set up? */
            boolean cardGatewayConfigured
    ) {
    }

    public record UpdateSettingsRequest(
            boolean cashOnDeliveryEnabled,
            boolean cardPaymentsEnabled,
            @Email @Size(max = 160) String orderNotificationEmail
    ) {
    }

    @Transactional(readOnly = true)
    public SettingsView view() {
        return toView(load());
    }

    @Transactional
    public SettingsView update(UpdateSettingsRequest request) {
        if (request.cardPaymentsEnabled() && gateways.card().isEmpty()) {
            throw new BusinessException("PAYMENT_GATEWAY_NOT_CONFIGURED",
                    "Online payment cannot be enabled until a payment gateway is configured", HttpStatus.CONFLICT);
        }
        if (!request.cashOnDeliveryEnabled() && !request.cardPaymentsEnabled()) {
            throw new BusinessException("NO_PAYMENT_METHOD", "At least one payment method must stay enabled",
                    HttpStatus.CONFLICT);
        }
        StoreSettings settings = load();
        settings.setCashOnDeliveryEnabled(request.cashOnDeliveryEnabled());
        settings.setCardPaymentsEnabled(request.cardPaymentsEnabled());
        settings.setOrderNotificationEmail(StringUtils.hasText(request.orderNotificationEmail())
                ? request.orderNotificationEmail().trim().toLowerCase() : null);
        return toView(repository.saveAndFlush(settings));
    }

    /** What checkout may offer right now. */
    @Transactional(readOnly = true)
    public List<PaymentMethod> availablePaymentMethods() {
        StoreSettings settings = load();
        List<PaymentMethod> methods = new ArrayList<>();
        if (settings.isCashOnDeliveryEnabled()) {
            methods.add(PaymentMethod.CASH_ON_DELIVERY);
        }
        if (settings.isCardPaymentsEnabled() && gateways.card().isPresent()) {
            methods.add(PaymentMethod.CARD);
        }
        return methods;
    }

    @Transactional(readOnly = true)
    public String orderNotificationEmail() {
        return load().getOrderNotificationEmail();
    }

    private StoreSettings load() {
        return repository.findById(StoreSettings.SINGLETON_ID)
                .orElseThrow(() -> new IllegalStateException("store_settings row missing (Flyway V4)"));
    }

    private SettingsView toView(StoreSettings s) {
        return new SettingsView(s.isCashOnDeliveryEnabled(), s.isCardPaymentsEnabled(), s.getOrderNotificationEmail(),
                gateways.card().isPresent());
    }
}
