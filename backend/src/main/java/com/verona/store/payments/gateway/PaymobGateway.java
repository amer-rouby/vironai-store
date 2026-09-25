package com.verona.store.payments.gateway;

import com.verona.store.config.AppProperties;
import com.verona.store.shared.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import tools.jackson.databind.JsonNode;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Paymob "Intention" API + Unified Checkout (Egypt).
 * <ul>
 *   <li>POST {apiBase}/v1/intention/ with {@code Authorization: Token <secret key>}, amounts in piasters.</li>
 *   <li>The response's {@code client_secret} opens {apiBase}/unifiedcheckout/?publicKey=..&clientSecret=..</li>
 *   <li>{@code intention_order_id} is Paymob's order id, echoed back as {@code obj.order.id} in the callback.</li>
 * </ul>
 */
@Slf4j
@Component
public class PaymobGateway implements PaymentGateway {

    private final AppProperties.Paymob config;
    private final String storefrontUrl;
    private final String publicApiUrl;
    private final RestClient http;

    public PaymobGateway(AppProperties properties) {
        this.config = properties.payments().paymob();
        this.storefrontUrl = properties.storefront().url();
        this.publicApiUrl = properties.storefront().publicApiUrl();
        // Boot 4 ships RestClient.Builder auto-configuration in a separate module; a plain builder is enough here.
        this.http = RestClient.builder().baseUrl(config.apiBase()).build();
    }

    @Override
    public String provider() {
        return "PAYMOB";
    }

    @Override
    public boolean configured() {
        return StringUtils.hasText(config.secretKey()) && StringUtils.hasText(config.publicKey())
                && StringUtils.hasText(config.hmacSecret()) && config.integrationIds() != null
                && config.integrationIds().stream().anyMatch(StringUtils::hasText);
    }

    @Override
    public CheckoutSession createCheckout(CheckoutRequest request) {
        if (!configured()) {
            throw new BusinessException("PAYMENT_GATEWAY_NOT_CONFIGURED", "Online payment is not configured",
                    HttpStatus.SERVICE_UNAVAILABLE);
        }
        String[] names = splitName(request.customerName());
        Map<String, Object> billing = new LinkedHashMap<>();
        billing.put("first_name", names[0]);
        billing.put("last_name", names[1]);
        billing.put("email", request.email());
        billing.put("phone_number", request.phone());
        billing.put("city", request.city());
        billing.put("street", request.street());
        billing.put("country", "EG");

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("amount", request.amountCents());
        body.put("currency", request.currency());
        body.put("payment_methods", integrationIds());
        body.put("items", request.lines().stream()
                .map(l -> Map.of("name", l.name(), "amount", l.amountCents(), "quantity", l.quantity()))
                .toList());
        body.put("billing_data", billing);
        body.put("special_reference", request.reference());
        body.put("notification_url", publicApiUrl + "/api/v1/payments/paymob/webhook");
        body.put("redirection_url", storefrontUrl + "/" + request.locale() + "/account/orders/"
                + URLEncoder.encode(request.orderNumber(), StandardCharsets.UTF_8) + "?payment=return");

        try {
            JsonNode response = http.post()
                    .uri("/v1/intention/")
                    .header("Authorization", "Token " + config.secretKey())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);
            String clientSecret = response.path("client_secret").asString("");
            String paymobOrderId = response.path("intention_order_id").asString("");
            if (clientSecret.isEmpty() || paymobOrderId.isEmpty()) {
                throw new IllegalStateException("Paymob response missing client_secret or intention_order_id");
            }
            String url = config.apiBase() + "/unifiedcheckout/?publicKey="
                    + URLEncoder.encode(config.publicKey(), StandardCharsets.UTF_8)
                    + "&clientSecret=" + URLEncoder.encode(clientSecret, StandardCharsets.UTF_8);
            return new CheckoutSession(paymobOrderId, url);
        } catch (RestClientException | IllegalStateException e) {
            log.error("Paymob intention failed for {}: {}", request.reference(), e.getMessage());
            throw new BusinessException("PAYMENT_PROVIDER_ERROR", "Could not start the online payment, try again",
                    HttpStatus.BAD_GATEWAY);
        }
    }

    /** Numeric integration ids are sent as numbers, named methods (e.g. "card") as strings. */
    private List<Object> integrationIds() {
        return config.integrationIds().stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .map(id -> id.chars().allMatch(Character::isDigit) ? (Object) Long.valueOf(id) : id)
                .toList();
    }

    private static String[] splitName(String fullName) {
        String trimmed = fullName == null ? "" : fullName.trim();
        int space = trimmed.indexOf(' ');
        return space < 0 ? new String[]{trimmed, trimmed} : new String[]{trimmed.substring(0, space), trimmed.substring(space + 1)};
    }
}
