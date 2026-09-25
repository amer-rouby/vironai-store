package com.verona.store.payments;

import com.verona.store.shared.crud.BaseRepository;

import java.util.Optional;

public interface PaymentRepository extends BaseRepository<Payment> {

    Optional<Payment> findByProviderAndProviderOrderId(String provider, String providerOrderId);
}
