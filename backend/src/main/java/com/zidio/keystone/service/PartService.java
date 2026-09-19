package com.zidio.keystone.service;

import com.zidio.keystone.domain.Part;
import com.zidio.keystone.dto.PartDtos.CreatePartRequest;
import com.zidio.keystone.dto.PartDtos.PartResponse;
import com.zidio.keystone.exception.ApiException;
import com.zidio.keystone.repository.PartRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PartService {

    private final PartRepository partRepository;

    @Transactional
    public PartResponse create(CreatePartRequest request) {
        Part part = Part.builder()
                .name(request.name())
                .sku(request.sku())
                .unitCost(request.unitCost())
                .stockQty(request.stockQty())
                .build();
        part = partRepository.save(part);
        return toResponse(part);
    }

    public List<PartResponse> list() {
        return partRepository.findAll().stream().map(this::toResponse).toList();
    }

    private PartResponse toResponse(Part p) {
        return new PartResponse(p.getId(), p.getName(), p.getSku(), p.getUnitCost(), p.getStockQty());
    }

    Part getEntityOrThrow(Long id) {
        return partRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Part not found: " + id));
    }
}
