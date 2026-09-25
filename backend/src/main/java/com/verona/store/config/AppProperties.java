package com.verona.store.config;

import com.verona.store.ordering.shipping.ShippingZone;
import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Validated
@ConfigurationProperties(prefix = "app")
public record AppProperties(Security security, BootstrapAdmin bootstrapAdmin, Shipping shipping, Media media,
                            Payments payments, Mail mail, Storefront storefront) {

    /** Public URLs the backend puts in e-mails and gateway redirects. */
    public record Storefront(String url, String publicApiUrl) {
    }

    /**
     * cardProvider: "none" (default), "paymob", or "fake" (local testing only). Secrets come from the
     * environment; whether customers see the option is the owner switch in store settings.
     */
    public record Payments(String cardProvider, Duration paymentWindow, Paymob paymob) {
    }

    public record Paymob(String apiBase, String secretKey, String publicKey, String hmacSecret,
                         List<String> integrationIds) {
    }

    public record Mail(boolean enabled, String from) {
    }

    /** provider: "local" (disk, served under /media/**). A cloud provider plugs in as another MediaStorage. */
    public record Media(String provider, String localDir) {
    }

    public record Shipping(BigDecimal freeThreshold, Map<ShippingZone, BigDecimal> zoneRates) {
    }

    public record Security(Jwt jwt, List<String> corsAllowedOrigins) {
    }

    public record Jwt(@NotBlank String secret, Duration expiration) {
    }

    public record BootstrapAdmin(String email, String password, String fullName) {
    }
}
