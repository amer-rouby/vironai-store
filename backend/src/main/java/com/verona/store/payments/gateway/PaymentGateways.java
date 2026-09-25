package com.verona.store.payments.gateway;

import com.verona.store.config.AppProperties;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.Optional;

/** Picks the card gateway named by {@code app.payments.card-provider}; empty when none is set up. */
@Component
public class PaymentGateways {

    private final PaymentGateway active;

    public PaymentGateways(AppProperties properties, PaymobGateway paymob, FakeGateway fake) {
        String provider = properties.payments().cardProvider();
        this.active = switch (provider == null ? "none" : provider.toLowerCase(Locale.ROOT)) {
            case "paymob" -> paymob;
            case "fake" -> fake;
            default -> null;
        };
    }

    /** The gateway, only when it is selected and fully configured. */
    public Optional<PaymentGateway> card() {
        return Optional.ofNullable(active).filter(PaymentGateway::configured);
    }

    public boolean isFake() {
        return active instanceof FakeGateway;
    }
}
