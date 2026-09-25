package com.verona.store.notifications;

import com.verona.store.config.AppProperties;
import com.verona.store.ordering.domain.OrderStatusChanged;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Sends e-mails only after the order change has committed, on a background thread: a slow or failing
 * mail server can never delay checkout or roll back an order.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrderNotificationListener {

    private final OrderMailer mailer;
    private final AppProperties properties;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void on(OrderStatusChanged event) {
        if (!properties.mail().enabled()) {
            return;
        }
        try {
            mailer.send(event.orderId(), event.status());
        } catch (RuntimeException e) {
            log.warn("E-mail for order {} ({}) not sent: {}", event.orderId(), event.status(), e.getMessage());
        }
    }
}
