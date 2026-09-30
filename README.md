# Blog Admin System

前後端整合的部落格後台：登入、文章列表（搜尋 / 分頁）、新增 / 編輯 / 刪除文章。

## 技術與版本

| 項目 | 版本 |
|------|------|
| 前端 | Angular 19（Standalone Component、Reactive Forms） |
| 後端 | Spring Boot 4.1 / Java 17 / Spring Data JPA |
| 資料庫 | PostgreSQL 17（Docker） |
| 工具 | Node 22、Maven Wrapper 3.9、Docker Compose |

## 本地執行

```bash
# 1. 啟動資料庫
docker compose up -d db

# 2. 啟動後端（http://localhost:8080）
cd backend
./mvnw spring-boot:run

# 3. 啟動前端（http://localhost:4200，/api 透過 proxy 轉到後端）
cd frontend
npm install
npm start
```

## 測試帳號

- Email：`admin@example.com`
- 密碼：`password123`

後端啟動時自動建立（`DataInitializer`）。

## API

除了登入外，所有 API 需帶 `Authorization: Bearer <token>`。

| Method | Path | 說明 |
|--------|------|------|
| POST | `/api/auth/login` | 登入，回傳 token |
| POST | `/api/auth/logout` | 登出 |
| GET | `/api/posts?keyword=&page=0&size=10` | 文章列表（依標題搜尋、分頁） |
| GET | `/api/posts/{id}` | 取得單篇文章 |
| POST | `/api/posts` | 新增文章 |
| PUT | `/api/posts/{id}` | 編輯文章 |
| DELETE | `/api/posts/{id}` | 刪除文章 |

文章欄位：`title`、`content`、`tags`、`status`（`DRAFT` / `PUBLISHED`），`author` 與 `createdAt` 由後端產生。
錯誤統一以 ProblemDetail 格式回傳（400 驗證失敗 / 401 未登入 / 404 找不到）。

## 專案結構

```
backend/src/main/java/com/andy/blogadmin
├── controller   # REST API
├── service      # 商業邏輯
├── repository   # Spring Data JPA
├── entity       # User、Post
├── dto          # Request / Response
├── config       # 登入攔截器、初始資料
└── exception    # 自訂例外與全域錯誤處理

frontend/src/app
├── core         # AuthService、PostService、interceptor、guard
└── pages        # login、post-list、post-form
```

## 設計說明

- 登入成功後後端產生 token，前端存在 `localStorage`，由 interceptor 自動帶入 header；收到 401 時清除登入狀態並導回登入頁。
- 密碼以 BCrypt 雜湊儲存。
- 文章作者取自目前登入的使用者。
