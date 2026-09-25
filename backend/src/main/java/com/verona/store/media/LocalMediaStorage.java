package com.verona.store.media;

import com.verona.store.config.AppProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.UUID;

/**
 * Stores images on the server's disk and serves them under {@code /media/**}. Default for development
 * and single-server deployments; swap for a cloud implementation via {@code app.media.provider}.
 */
@Slf4j
@Component
@ConditionalOnProperty(prefix = "app.media", name = "provider", havingValue = "local", matchIfMissing = true)
public class LocalMediaStorage implements MediaStorage {

    public static final String URL_PREFIX = "/media/";

    private final Path root;

    public LocalMediaStorage(AppProperties properties) {
        this.root = Path.of(properties.media().localDir()).toAbsolutePath().normalize();
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new UncheckedIOException("Cannot create media directory " + root, e);
        }
        log.info("Local media storage at {}", root);
    }

    @Override
    public String store(byte[] content, ImageType type) {
        // Random server-chosen name: no user input ever reaches the file system path.
        String name = UUID.randomUUID() + "." + type.extension();
        try {
            Files.write(root.resolve(name), content, StandardOpenOption.CREATE_NEW);
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to store image", e);
        }
        return URL_PREFIX + name;
    }

    public Path root() {
        return root;
    }
}
