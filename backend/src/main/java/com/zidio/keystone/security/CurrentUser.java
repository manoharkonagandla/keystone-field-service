package com.zidio.keystone.security;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class CurrentUser {

    public AppUserPrincipal get() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof AppUserPrincipal p) {
            return p;
        }
        throw new IllegalStateException("No authenticated user in context");
    }

    public Long id() {
        return get().getId();
    }

    public String role() {
        return get().getRole();
    }

    public Long customerId() {
        return get().getCustomerId();
    }
}
