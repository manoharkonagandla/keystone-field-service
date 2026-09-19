package com.zidio.keystone.service;

import com.zidio.keystone.domain.Site;
import com.zidio.keystone.dto.SiteDtos.CreateSiteRequest;
import com.zidio.keystone.dto.SiteDtos.SiteResponse;
import com.zidio.keystone.exception.ApiException;
import com.zidio.keystone.repository.CustomerRepository;
import com.zidio.keystone.repository.SiteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SiteService {

    private final SiteRepository siteRepository;
    private final CustomerRepository customerRepository;

    @Transactional
    public SiteResponse create(CreateSiteRequest request) {
        if (!customerRepository.existsById(request.customerId())) {
            throw ApiException.badRequest("Customer does not exist: " + request.customerId());
        }
        Site site = Site.builder()
                .customerId(request.customerId())
                .name(request.name())
                .address(request.address())
                .build();
        site = siteRepository.save(site);
        return toResponse(site);
    }

    public List<SiteResponse> listByCustomer(Long customerId) {
        return siteRepository.findByCustomerId(customerId).stream().map(this::toResponse).toList();
    }

    public SiteResponse getById(Long id) {
        Site site = siteRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Site not found: " + id));
        return toResponse(site);
    }

    private SiteResponse toResponse(Site s) {
        return new SiteResponse(s.getId(), s.getCustomerId(), s.getName(), s.getAddress());
    }
}
