package com.zidio.keystone.service;

import com.zidio.keystone.domain.User;
import com.zidio.keystone.dto.AuthDtos.LoginRequest;
import com.zidio.keystone.dto.AuthDtos.LoginResponse;
import com.zidio.keystone.repository.UserRepository;
import com.zidio.keystone.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    public LoginResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password()));

        User user = userRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new IllegalStateException("User vanished after authentication"));

        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name(), user.getCustomerId());

        return new LoginResponse(token, user.getId(), user.getName(), user.getEmail(),
                user.getRole().name(), user.getCustomerId());
    }
}
