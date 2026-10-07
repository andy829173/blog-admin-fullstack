package com.andy.blogadmin.controller;

import com.andy.blogadmin.dto.LoginRequest;
import com.andy.blogadmin.dto.LoginResponse;
import com.andy.blogadmin.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

// JWT 為無狀態，登出由前端丟棄 token 即可
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }
}
