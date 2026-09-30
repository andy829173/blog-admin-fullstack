package com.andy.blogadmin.config;

import com.andy.blogadmin.exception.UnauthorizedException;
import com.andy.blogadmin.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

// 檢查 Authorization: Bearer <token>，通過後把 userId 放進 request
@Component
public class AuthInterceptor implements HandlerInterceptor {

    public static final String USER_ID = "userId";

    private final AuthService authService;

    public AuthInterceptor(AuthService authService) {
        this.authService = authService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        String token = header != null && header.startsWith("Bearer ") ? header.substring(7) : null;
        Long userId = authService.findUserId(token).orElseThrow(() -> new UnauthorizedException("請先登入"));
        request.setAttribute(USER_ID, userId);
        return true;
    }
}
