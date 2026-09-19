package com.zidio.keystone.service;

import com.zidio.keystone.domain.Role;
import com.zidio.keystone.domain.User;
import com.zidio.keystone.dto.UserDtos.UserSummary;
import com.zidio.keystone.exception.ApiException;
import com.zidio.keystone.repository.UserRepository;
import com.zidio.keystone.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final CurrentUser currentUser;

    public List<UserSummary> listByRole(Role role) {
        return userRepository.findAll().stream()
                .filter(u -> role == null || u.getRole() == role)
                .map(this::toSummary)
                .toList();
    }

    public UserSummary me() {
        User user = userRepository.findById(currentUser.id())
                .orElseThrow(() -> ApiException.notFound("User not found"));
        return toSummary(user);
    }

    private UserSummary toSummary(User u) {
        return new UserSummary(u.getId(), u.getName(), u.getEmail(), u.getRole().name(), u.getCustomerId());
    }
}
