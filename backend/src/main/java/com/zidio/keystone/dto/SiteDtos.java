package com.zidio.keystone.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class SiteDtos {

    public record CreateSiteRequest(
            @NotNull Long customerId,
            @NotBlank String name,
            String address
    ) {}

    public record SiteResponse(
            Long id,
            Long customerId,
            String name,
            String address
    ) {}
}
