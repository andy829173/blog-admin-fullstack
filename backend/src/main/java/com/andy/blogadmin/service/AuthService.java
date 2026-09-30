package com.andy.blogadmin.service;

import com.andy.blogadmin.dto.LoginRequest;
import com.andy.blogadmin.dto.LoginResponse;
import com.andy.blogadmin.entity.User;
import com.andy.blogadmin.exception.UnauthorizedException;
import com.andy.blogadmin.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    // ponytail: token 存記憶體，重啟即失效；之後改 JWT + Spring Security
    private final Map<String, Long> tokens = new ConcurrentHashMap<>();

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .filter(u -> passwordEncoder.matches(request.password(), u.getPassword()))
                .orElseThrow(() -> new UnauthorizedException("Email 或密碼錯誤"));
        String token = UUID.randomUUID().toString();
        tokens.put(token, user.getId());
        return new LoginResponse(token, user.getEmail(), user.getName());
    }

    public void logout(String token) {
        tokens.remove(token);
    }

    public Optional<Long> findUserId(String token) {
        return Optional.ofNullable(token).map(tokens::get);
    }

    public String encode(String rawPassword) {
        return passwordEncoder.encode(rawPassword);
    }
}
