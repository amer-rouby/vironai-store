package com.verona.store.payments.gateway;

import java.util.List;

/**
 * An online payment provider with a hosted checkout. Implementations only create the checkout session;
 * the outcome always arrives through the provider's signed callback, never from the browser.
 */
public interface PaymentGateway {

    /** Stable provider code stored with each payment attempt, e.g. "PAYMOB". */
    String provider();

    /** True when every credential the provider needs is present. */
    boolean configured();

    CheckoutSession createCheckout(CheckoutRequest request);

    record CheckoutRequest(
            String reference,
            String orderNumber,
            long amountCents,
            String currency,
            String customerName,
            String email,
            String phone,
            String city,
            String street,
            String locale,
            List<Line> lines
    ) {
    }

    record Line(String name, long amountCents, int quantity) {
    }

    /** providerOrderId matches the callback to this attempt; redirectUrl is where the shopper pays. */
    record CheckoutSession(String providerOrderId, String redirectUrl) {
    }
}
