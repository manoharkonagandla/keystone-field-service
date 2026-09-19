package com.zidio.keystone.controller;

import com.zidio.keystone.dto.PartDtos.CreatePartRequest;
import com.zidio.keystone.dto.PartDtos.PartResponse;
import com.zidio.keystone.service.PartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/parts")
@RequiredArgsConstructor
public class PartController {

    private final PartService partService;

    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    public PartResponse create(@Valid @RequestBody CreatePartRequest request) {
        return partService.create(request);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('DISPATCHER','MANAGER','TECHNICIAN')")
    public List<PartResponse> list() {
        return partService.list();
    }
}
