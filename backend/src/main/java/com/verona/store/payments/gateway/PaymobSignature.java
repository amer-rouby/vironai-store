package com.verona.store.payments.gateway;

import tools.jackson.databind.JsonNode;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.List;

/**
 * HMAC for Paymob's "transaction processed" callback: the values of these fields, in this exact order,
 * concatenated without separators, HMAC-SHA512 with the account's HMAC secret, lowercase hex.
 * Source: developers.paymob.com, "HMAC Transaction Callback".
 */
public final class PaymobSignature {

    /** Paths into the callback's {@code obj}; order is part of the contract. */
    static final List<String> FIELDS = List.of(
            "amount_cents", "created_at", "currency", "error_occured", "has_parent_transaction", "id",
            "integration_id", "is_3d_secure", "is_auth", "is_capture", "is_refunded", "is_standalone_payment",
            "is_voided", "order.id", "owner", "pending", "source_data.pan", "source_data.sub_type",
            "source_data.type", "success");

    private PaymobSignature() {
    }

    public static String concatenate(JsonNode obj) {
        StringBuilder sb = new StringBuilder();
        for (String path : FIELDS) {
            JsonNode node = obj;
            for (String part : path.split("\\.")) {
                node = node.path(part);
            }
            // Booleans render as "true"/"false", numbers without quotes, strings as-is.
            sb.append(node.isMissingNode() || node.isNull() ? "" : node.asString());
        }
        return sb.toString();
    }

    public static String sign(JsonNode obj, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            return HexFormat.of().formatHex(mac.doFinal(concatenate(obj).getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("HMAC-SHA512 unavailable", e);
        }
    }

    /** Constant-time comparison, so response timing cannot be used to guess a valid signature. */
    public static boolean verify(JsonNode obj, String receivedHmac, String secret) {
        if (receivedHmac == null || receivedHmac.isBlank() || secret == null || secret.isBlank()) {
            return false;
        }
        byte[] expected = sign(obj, secret).getBytes(StandardCharsets.US_ASCII);
        byte[] actual = receivedHmac.trim().toLowerCase().getBytes(StandardCharsets.US_ASCII);
        return MessageDigest.isEqual(expected, actual);
    }
}
