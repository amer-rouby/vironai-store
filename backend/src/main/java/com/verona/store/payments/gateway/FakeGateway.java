package com.verona.store.payments.gateway;

import com.verona.store.config.AppProperties;
import org.springframework.stereotype.Component;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

/**
 * Local-testing stand-in (card-provider=fake). Sends the shopper straight back to the order page;
 * the outcome is then simulated through {@code FakePaymentController}, which produces a Paymob-format
 * callback signed with the configured HMAC secret and feeds it through the real verification path.
 */
@Component
public class FakeGateway implements PaymentGateway {

    private final String storefrontUrl;
    private final boolean hasHmacSecret;

    public FakeGateway(AppProperties properties) {
        this.storefrontUrl = properties.storefront().url();
        String secret = properties.payments().paymob().hmacSecret();
        this.hasHmacSecret = secret != null && !secret.isBlank();
    }

    @Override
    public String provider() {
        return "PAYMOB";
    }

    @Override
    public boolean configured() {
        return hasHmacSecret;
    }

    @Override
    public CheckoutSession createCheckout(CheckoutRequest request) {
        String providerOrderId = "fake-" + UUID.randomUUID();
        String url = storefrontUrl + "/" + request.locale() + "/account/orders/"
                + URLEncoder.encode(request.orderNumber(), StandardCharsets.UTF_8) + "?payment=return";
        return new CheckoutSession(providerOrderId, url);
    }
}
