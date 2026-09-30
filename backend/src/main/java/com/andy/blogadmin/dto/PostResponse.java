package com.andy.blogadmin.dto;

import com.andy.blogadmin.entity.Post;
import com.andy.blogadmin.entity.PostStatus;

import java.time.Instant;
import java.util.List;

public record PostResponse(
        Long id,
        String title,
        String content,
        List<String> tags,
        PostStatus status,
        String author,
        Instant createdAt) {

    public static PostResponse from(Post post) {
        return new PostResponse(post.getId(), post.getTitle(), post.getContent(), List.copyOf(post.getTags()),
                post.getStatus(), post.getAuthor().getName(), post.getCreatedAt());
    }
}
