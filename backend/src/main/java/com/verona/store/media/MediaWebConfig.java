package com.verona.store.media;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.time.Duration;

/** Serves locally stored images. File names are random and never reused, so they cache for a year. */
@Configuration
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.media", name = "provider", havingValue = "local", matchIfMissing = true)
public class MediaWebConfig implements WebMvcConfigurer {

    private final LocalMediaStorage storage;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler(LocalMediaStorage.URL_PREFIX + "**")
                .addResourceLocations(storage.root().toUri().toString())
                .setCacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable());
    }
}
