package com.verona.store.ordering.api;

import com.verona.store.ordering.api.OrderDtos.Quote;
import com.verona.store.ordering.api.OrderDtos.QuoteRequest;
import com.verona.store.ordering.application.CheckoutService;
import com.verona.store.ordering.domain.PaymentMethod;
import com.verona.store.ordering.shipping.ShippingPolicy;
import com.verona.store.settings.StoreSettingsService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/checkout")
@RequiredArgsConstructor
@Tag(name = "Storefront · Checkout")
public class CheckoutController {

    private final CheckoutService checkout;
    private final StoreSettingsService settings;
    private final ShippingPolicy shipping;

    public record CheckoutOptions(List<PaymentMethod> paymentMethods, BigDecimal freeShippingThreshold) {
    }

    /** Payment methods the owner has enabled (and that are actually usable right now). */
    @GetMapping("/options")
    public CheckoutOptions options() {
        return new CheckoutOptions(settings.availablePaymentMethods(), shipping.freeThreshold());
    }

    /** Re-prices a bag against live prices and stock. Public: guests see their bag validated too. */
    @PostMapping("/quote")
    public Quote quote(@Valid @RequestBody QuoteRequest request) {
        return checkout.quote(request.items(), request.governorate());
    }
}
