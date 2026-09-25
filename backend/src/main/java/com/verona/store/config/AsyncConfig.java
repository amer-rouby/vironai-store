package com.verona.store.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/** Background work: e-mail delivery (@Async) and the unpaid-order expiry job (@Scheduled). */
@Configuration
@EnableAsync
@EnableScheduling
public class AsyncConfig {
}
