package com.verona.store.media;

/**
 * Where uploaded images live. The local implementation serves files from disk; a cloud implementation
 * (Cloudinary, S3) only has to return a public URL, and nothing else in the app changes.
 */
public interface MediaStorage {

    /** Persists the image and returns the URL clients should use to display it. */
    String store(byte[] content, ImageType type);
}
