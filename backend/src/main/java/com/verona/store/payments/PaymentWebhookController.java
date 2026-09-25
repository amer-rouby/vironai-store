package com.verona.store.payments;

import com.verona.store.payments.PaymentService.CallbackResult;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.JsonNode;

import java.util.Map;

/**
 * Server-to-server callback from Paymob. Public by necessity; trust comes from the HMAC, not the caller.
 * Returns 200 for processed or ignored callbacks so Paymob stops retrying; 401 for a bad signature.
 */
@RestController
@RequestMapping("/api/v1/payments/paymob")
@RequiredArgsConstructor
@Tag(name = "Payments · Paymob callback")
public class PaymentWebhookController {

    private final PaymentService payments;

    @PostMapping("/webhook")
    public Map<String, String> webhook(@RequestBody JsonNode body, @RequestParam(name = "hmac", required = false) String hmac) {
        CallbackResult result = payments.handlePaymobCallback(body, hmac);
        return Map.of("result", result.name());
    }
}
