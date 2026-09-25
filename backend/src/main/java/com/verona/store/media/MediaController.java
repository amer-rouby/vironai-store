package com.verona.store.media;

import com.verona.store.shared.exception.BusinessException;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/v1/admin/media")
@RequiredArgsConstructor
@Tag(name = "Admin · Media")
public class MediaController {

    static final long MAX_BYTES = 5 * 1024 * 1024;

    private final MediaStorage storage;

    public record UploadedImage(String url) {
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public UploadedImage upload(@RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new BusinessException("EMPTY_FILE", "The uploaded file is empty", HttpStatus.BAD_REQUEST);
        }
        if (file.getSize() > MAX_BYTES) {
            throw new BusinessException("FILE_TOO_LARGE", "Images must be 5 MB or smaller", HttpStatus.PAYLOAD_TOO_LARGE);
        }
        byte[] content = file.getBytes();
        ImageType type = ImageType.sniff(content)
                .orElseThrow(() -> new BusinessException("UNSUPPORTED_IMAGE",
                        "Only JPEG, PNG and WebP images are accepted", HttpStatus.UNSUPPORTED_MEDIA_TYPE));
        return new UploadedImage(storage.store(content, type));
    }
}
