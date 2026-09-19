package com.zidio.keystone.controller;

import com.zidio.keystone.dto.SiteDtos.CreateSiteRequest;
import com.zidio.keystone.dto.SiteDtos.SiteResponse;
import com.zidio.keystone.security.CurrentUser;
import com.zidio.keystone.service.SiteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SiteController {

    private final SiteService siteService;
    private final CurrentUser currentUser;

    @PostMapping("/sites")
    @PreAuthorize("hasAnyRole('DISPATCHER','MANAGER')")
    public SiteResponse create(@Valid @RequestBody CreateSiteRequest request) {
        return siteService.create(request);
    }

    @GetMapping("/customers/{customerId}/sites")
    public List<SiteResponse> listByCustomer(@PathVariable Long customerId) {
        String role = currentUser.role();
        if ("CUSTOMER".equals(role) && !currentUser.customerId().equals(customerId)) {
            throw new org.springframework.security.access.AccessDeniedException("Not your organisation");
        }
        return siteService.listByCustomer(customerId);
    }
}
