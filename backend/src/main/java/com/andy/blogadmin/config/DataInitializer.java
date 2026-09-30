package com.andy.blogadmin.config;

import com.andy.blogadmin.entity.User;
import com.andy.blogadmin.repository.UserRepository;
import com.andy.blogadmin.service.AuthService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

// 啟動時建立測試帳號
@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final AuthService authService;

    public DataInitializer(UserRepository userRepository, AuthService authService) {
        this.userRepository = userRepository;
        this.authService = authService;
    }

    @Override
    public void run(String... args) {
        if (userRepository.findByEmail("admin@example.com").isEmpty()) {
            userRepository.save(new User("admin@example.com", authService.encode("password123"), "Admin"));
        }
    }
}
