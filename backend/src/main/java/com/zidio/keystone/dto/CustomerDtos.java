package com.zidio.keystone.dto;

import jakarta.validation.constraints.NotBlank;

public class CustomerDtos {

    public record CreateCustomerRequest(
            @NotBlank String name,
            String contactEmail
    ) {}

    public record CustomerResponse(
            Long id,
            String name,
            String contactEmail
    ) {}
}
