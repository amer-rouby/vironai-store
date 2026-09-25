package com.verona.store.ordering.shipping;

import com.verona.store.config.AppProperties;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.EnumMap;
import java.util.Map;

/**
 * Delivery fee = zone rate, waived once the subtotal reaches the free-shipping threshold.
 * Rates and threshold come from configuration ({@code app.shipping.*}).
 */
@Component
public class ShippingPolicy {

    private final Map<ShippingZone, BigDecimal> rates = new EnumMap<>(ShippingZone.class);
    private final BigDecimal freeThreshold;

    public ShippingPolicy(AppProperties properties) {
        var shipping = properties.shipping();
        rates.putAll(shipping.zoneRates());
        for (ShippingZone zone : ShippingZone.values()) {
            if (!rates.containsKey(zone)) {
                throw new IllegalStateException("Missing shipping rate for zone " + zone);
            }
        }
        this.freeThreshold = shipping.freeThreshold();
    }

    public BigDecimal feeFor(Governorate governorate, BigDecimal subtotal) {
        if (freeThreshold != null && subtotal.compareTo(freeThreshold) >= 0) {
            return BigDecimal.ZERO;
        }
        return rates.get(governorate.zone());
    }

    public BigDecimal freeThreshold() {
        return freeThreshold;
    }
}
