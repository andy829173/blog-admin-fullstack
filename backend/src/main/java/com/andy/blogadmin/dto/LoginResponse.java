package com.andy.blogadmin.dto;

public record LoginResponse(String token, String email, String name) {
}
