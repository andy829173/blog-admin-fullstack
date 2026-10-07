package com.andy.blogadmin;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.time.Instant;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

// 跑真的 Postgres（Testcontainers）+ Flyway migration，從登入取得 JWT 一路打到文章 CRUD
@SpringBootTest
@AutoConfigureMockMvc
class ApiIntegrationTest {

    @TestConfiguration(proxyBeanMethods = false)
    static class Containers {
        @Bean
        @ServiceConnection
        PostgreSQLContainer postgres() {
            return new PostgreSQLContainer("postgres:17");
        }
    }

    @Autowired
    MockMvc mvc;

    @Autowired
    JwtEncoder jwtEncoder;

    String token;

    @BeforeEach
    void login() throws Exception {
        String body = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"admin@example.com","password":"password123"}"""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Admin"))
                .andReturn().getResponse().getContentAsString();
        token = JsonPath.read(body, "$.token");
    }

    @Test
    void loginWithWrongPasswordReturns401() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"admin@example.com","password":"wrong"}"""))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.detail").value("Email 或密碼錯誤"));
    }

    @Test
    void loginWithInvalidEmailReturns400() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"not-an-email","password":"x"}"""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value(containsString("email")));
    }

    @Test
    void postsWithoutTokenReturns401() throws Exception {
        mvc.perform(get("/api/posts"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.detail").value("請先登入"));
    }

    @Test
    void expiredTokenReturns401() throws Exception {
        Instant past = Instant.now().minusSeconds(3600);
        JwtClaimsSet claims = JwtClaimsSet.builder().subject("1").issuedAt(past.minusSeconds(60)).expiresAt(past).build();
        String expired = jwtEncoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims))
                .getTokenValue();

        mvc.perform(get("/api/posts").header(HttpHeaders.AUTHORIZATION, "Bearer " + expired))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void postCrudFlow() throws Exception {
        // 新增：作者取自 JWT，標籤去空白、去重複
        String created = mvc.perform(authed(post("/api/posts")).contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":" CrudFlow 文章 ","content":"內容","tags":[" java ","java",""],"status":"DRAFT"}"""))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("CrudFlow 文章"))
                .andExpect(jsonPath("$.author").value("Admin"))
                .andExpect(jsonPath("$.tags", contains("java")))
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andReturn().getResponse().getContentAsString();
        int id = JsonPath.read(created, "$.id");

        // 搜尋（不分大小寫）+ 分頁
        mvc.perform(authed(get("/api/posts")).param("keyword", "crudflow").param("size", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.size").value(5))
                .andExpect(jsonPath("$.content[0].id").value(id));

        mvc.perform(authed(put("/api/posts/" + id)).contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"已更新","content":"新內容","tags":["spring"],"status":"PUBLISHED"}"""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"));

        mvc.perform(authed(get("/api/posts/" + id)))
                .andExpect(jsonPath("$.title").value("已更新"))
                .andExpect(jsonPath("$.tags", contains("spring")));

        mvc.perform(authed(delete("/api/posts/" + id))).andExpect(status().isNoContent());

        mvc.perform(authed(get("/api/posts/" + id)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("文章不存在: " + id));
    }

    @Test
    void createWithMissingFieldsReturns400() throws Exception {
        mvc.perform(authed(post("/api/posts")).contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"","content":"x"}"""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail", allOf(containsString("title"), containsString("status"))));
    }

    @Test
    void malformedJsonReturnsProblemDetail() throws Exception {
        mvc.perform(authed(post("/api/posts")).contentType(MediaType.APPLICATION_JSON).content("{bad"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON));
    }

    @Test
    void invalidPageSizeReturnsProblemDetail() throws Exception {
        mvc.perform(authed(get("/api/posts")).param("size", "0"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON));
    }

    @Test
    void updateMissingPostReturns404() throws Exception {
        mvc.perform(authed(put("/api/posts/999999")).contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"t","content":"c","status":"DRAFT"}"""))
                .andExpect(status().isNotFound());
    }

    private MockHttpServletRequestBuilder authed(MockHttpServletRequestBuilder request) {
        return request.header(HttpHeaders.AUTHORIZATION, "Bearer " + token);
    }
}
