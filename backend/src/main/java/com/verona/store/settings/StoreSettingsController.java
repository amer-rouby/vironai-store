package com.verona.store.settings;

import com.verona.store.settings.StoreSettingsService.SettingsView;
import com.verona.store.settings.StoreSettingsService.UpdateSettingsRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/settings")
@RequiredArgsConstructor
@Tag(name = "Admin · Settings")
public class StoreSettingsController {

    private final StoreSettingsService settings;

    @GetMapping
    public SettingsView get() {
        return settings.view();
    }

    @PutMapping
    public SettingsView update(@Valid @RequestBody UpdateSettingsRequest request) {
        return settings.update(request);
    }
}
