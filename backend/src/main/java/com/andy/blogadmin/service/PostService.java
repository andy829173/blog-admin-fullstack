package com.andy.blogadmin.service;

import com.andy.blogadmin.dto.PageResponse;
import com.andy.blogadmin.dto.PostRequest;
import com.andy.blogadmin.dto.PostResponse;
import com.andy.blogadmin.entity.Post;
import com.andy.blogadmin.exception.NotFoundException;
import com.andy.blogadmin.repository.PostRepository;
import com.andy.blogadmin.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;

    public PostService(PostRepository postRepository, UserRepository userRepository) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<PostResponse> list(String keyword, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return PageResponse.from(postRepository.findByTitleContainingIgnoreCase(keyword, pageable)
                .map(PostResponse::from));
    }

    @Transactional(readOnly = true)
    public PostResponse get(Long id) {
        return PostResponse.from(findPost(id));
    }

    @Transactional
    public PostResponse create(PostRequest request, Long userId) {
        Post post = new Post();
        post.setAuthor(userRepository.findById(userId).orElseThrow(() -> new NotFoundException("使用者不存在")));
        apply(post, request);
        return PostResponse.from(postRepository.save(post));
    }

    @Transactional
    public PostResponse update(Long id, PostRequest request) {
        Post post = findPost(id);
        apply(post, request);
        return PostResponse.from(post);
    }

    @Transactional
    public void delete(Long id) {
        postRepository.delete(findPost(id));
    }

    private Post findPost(Long id) {
        return postRepository.findById(id).orElseThrow(() -> new NotFoundException("文章不存在: " + id));
    }

    private void apply(Post post, PostRequest request) {
        post.setTitle(request.title().trim());
        post.setContent(request.content());
        post.setTags(request.tags() == null ? List.of() : request.tags().stream()
                .map(String::trim).filter(t -> !t.isEmpty()).distinct().toList());
        post.setStatus(request.status());
    }
}
