package com.andy.blogadmin.dto;

import com.andy.blogadmin.entity.PostStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record PostRequest(
        @NotBlank @Size(max = 255) String title,
        @NotBlank String content,
        List<String> tags,
        @NotNull PostStatus status) {
}
