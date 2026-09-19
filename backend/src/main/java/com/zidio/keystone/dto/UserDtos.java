package com.zidio.keystone.dto;

public class UserDtos {
    public record UserSummary(Long id, String name, String email, String role, Long customerId) {}
}
