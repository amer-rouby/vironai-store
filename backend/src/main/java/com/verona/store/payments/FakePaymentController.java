package com.verona.store.payments;

import com.verona.store.config.AppProperties;
import com.verona.store.payments.PaymentService.CallbackResult;
import com.verona.store.payments.gateway.PaymobSignature;
import com.verona.store.shared.exception.NotFoundException;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.node.ObjectNode;

import java.time.Instant;
import java.util.Map;

/**
 * Exists only with card-provider=fake. Simulates the gateway's verdict by building a Paymob-format
 * callback, signing it with the configured secret, and sending it through the real handler, so local
 * tests exercise exactly the production verification and state changes.
 */
@RestController
@RequestMapping("/api/v1/payments/fake")
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.payments", name = "card-provider", havingValue = "fake")
@Tag(name = "Payments · Local simulator")
public class FakePaymentController {

    private final PaymentService payments;
    private final PaymentRepository paymentRepository;
    private final AppProperties properties;
    private final JsonMapper json;

    @PostMapping("/{providerOrderId}")
    public Map<String, String> complete(@PathVariable String providerOrderId,
                                        @RequestParam(defaultValue = "success") String outcome) {
        Payment payment = paymentRepository.findByProviderAndProviderOrderId("PAYMOB", providerOrderId)
                .orElseThrow(() -> new NotFoundException("Payment", providerOrderId));
        boolean success = "success".equalsIgnoreCase(outcome);

        ObjectNode obj = json.createObjectNode();
        obj.put("amount_cents", payment.getAmountCents());
        obj.put("created_at", Instant.now().toString());
        obj.put("currency", payment.getCurrency());
        obj.put("error_occured", false);
        obj.put("has_parent_transaction", false);
        obj.put("id", Math.abs(System.nanoTime() % 1_000_000_000L));
        obj.put("integration_id", 0);
        obj.put("is_3d_secure", true);
        obj.put("is_auth", false);
        obj.put("is_capture", false);
        obj.put("is_refunded", false);
        obj.put("is_standalone_payment", true);
        obj.put("is_voided", false);
        obj.putObject("order").put("id", providerOrderId);
        obj.put("owner", 0);
        obj.put("pending", false);
        obj.putObject("source_data").put("pan", "2346").put("sub_type", "MasterCard").put("type", "card");
        obj.put("success", success);
        if (!success) {
            obj.putObject("data").put("message", "Do not honour");
        }
        ObjectNode body = json.createObjectNode();
        body.put("type", "TRANSACTION");
        body.set("obj", obj);

        String hmac = PaymobSignature.sign(obj, properties.payments().paymob().hmacSecret());
        CallbackResult result = payments.handlePaymobCallback(body, hmac);
        return Map.of("result", result.name());
    }
}
