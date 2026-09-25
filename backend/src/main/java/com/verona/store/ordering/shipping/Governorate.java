package com.verona.store.ordering.shipping;

/**
 * Egypt's 27 governorates, each assigned to a delivery zone. Labels live in the frontend messages.
 */
public enum Governorate {
    CAIRO(ShippingZone.GREATER_CAIRO),
    GIZA(ShippingZone.GREATER_CAIRO),
    QALYUBIA(ShippingZone.GREATER_CAIRO),

    ALEXANDRIA(ShippingZone.DELTA_CANAL),
    BEHEIRA(ShippingZone.DELTA_CANAL),
    DAKAHLIA(ShippingZone.DELTA_CANAL),
    DAMIETTA(ShippingZone.DELTA_CANAL),
    GHARBIA(ShippingZone.DELTA_CANAL),
    KAFR_EL_SHEIKH(ShippingZone.DELTA_CANAL),
    MONUFIA(ShippingZone.DELTA_CANAL),
    SHARQIA(ShippingZone.DELTA_CANAL),
    PORT_SAID(ShippingZone.DELTA_CANAL),
    ISMAILIA(ShippingZone.DELTA_CANAL),
    SUEZ(ShippingZone.DELTA_CANAL),

    FAYOUM(ShippingZone.UPPER_EGYPT),
    BENI_SUEF(ShippingZone.UPPER_EGYPT),
    MINYA(ShippingZone.UPPER_EGYPT),
    ASSIUT(ShippingZone.UPPER_EGYPT),
    SOHAG(ShippingZone.UPPER_EGYPT),
    QENA(ShippingZone.UPPER_EGYPT),
    LUXOR(ShippingZone.UPPER_EGYPT),
    ASWAN(ShippingZone.UPPER_EGYPT),

    MATROUH(ShippingZone.REMOTE),
    RED_SEA(ShippingZone.REMOTE),
    NEW_VALLEY(ShippingZone.REMOTE),
    NORTH_SINAI(ShippingZone.REMOTE),
    SOUTH_SINAI(ShippingZone.REMOTE);

    private final ShippingZone zone;

    Governorate(ShippingZone zone) {
        this.zone = zone;
    }

    public ShippingZone zone() {
        return zone;
    }
}
