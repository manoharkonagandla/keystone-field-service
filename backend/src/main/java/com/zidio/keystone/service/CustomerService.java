package com.zidio.keystone.service;

import com.zidio.keystone.domain.Customer;
import com.zidio.keystone.dto.CustomerDtos.CreateCustomerRequest;
import com.zidio.keystone.dto.CustomerDtos.CustomerResponse;
import com.zidio.keystone.exception.ApiException;
import com.zidio.keystone.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;

    @Transactional
    public CustomerResponse create(CreateCustomerRequest request) {
        Customer customer = Customer.builder()
                .name(request.name())
                .contactEmail(request.contactEmail())
                .build();
        customer = customerRepository.save(customer);
        return toResponse(customer);
    }

    public Page<CustomerResponse> list(String search, int page, int size) {
        Page<Customer> result = (search == null || search.isBlank())
                ? customerRepository.findAll(PageRequest.of(page, size))
                : customerRepository.findByNameContainingIgnoreCase(search, PageRequest.of(page, size));
        return result.map(this::toResponse);
    }

    public CustomerResponse getById(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Customer not found: " + id));
        return toResponse(customer);
    }

    private CustomerResponse toResponse(Customer c) {
        return new CustomerResponse(c.getId(), c.getName(), c.getContactEmail());
    }
}
