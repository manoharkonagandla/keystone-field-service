package com.zidio.keystone.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class PartDtos {

    public record CreatePartRequest(
            @NotBlank String name,
            @NotBlank String sku,
            @NotNull BigDecimal unitCost,
            @NotNull Integer stockQty
    ) {}

    public record PartResponse(
            Long id,
            String name,
            String sku,
            BigDecimal unitCost,
            Integer stockQty
    ) {}
}
