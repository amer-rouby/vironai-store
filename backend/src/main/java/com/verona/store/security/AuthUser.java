package com.verona.store.security;

import com.verona.store.identity.Role;

/**
 * Authenticated principal rebuilt from the JWT on every request (no session, no DB hit).
 */
public record AuthUser(Long id, String email, Role role) {
}
