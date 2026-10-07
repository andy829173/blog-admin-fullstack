# Blog Admin System

前後端整合的部落格後台：登入、文章列表（搜尋 / 分頁）、新增 / 編輯 / 刪除文章。

## 技術與版本

| 項目 | 版本 |
|------|------|
| 前端 | Angular 19（Standalone Component、Reactive Forms、Signals、OnPush） |
| 後端 | Spring Boot 4.1 / Java 17 / Spring Data JPA / Spring Security（JWT） |
| 資料庫 | PostgreSQL 17（Docker）、Flyway migration |
| 測試 | 後端 JUnit 5 + MockMvc + Testcontainers + JaCoCo；前端 Karma + Jasmine |
| 工具 | Node 22、Maven Wrapper 3.9、Docker Compose |

## 本地執行

```bash
# 1. 啟動資料庫
docker compose up -d db

# 2. 啟動後端（http://localhost:8080，啟動時 Flyway 自動建立 schema）
cd backend
./mvnw spring-boot:run

# 3. 啟動前端（http://localhost:4200，/api 透過 proxy 轉到後端）
cd frontend
npm install
npm start
```

> 若資料庫是舊版（由 Hibernate `ddl-auto` 建立）的資料，Flyway 會拒絕接手，請先 `docker compose down -v` 清掉 volume 再啟動。

## 測試帳號

- Email：`admin@example.com`
- 密碼：`password123`

後端啟動時自動建立（`DataInitializer`）。

## API 文件

Swagger UI：<http://localhost:8080/swagger-ui.html>

先呼叫 `POST /api/auth/login` 取得 token，再點右上角 **Authorize** 貼上即可測試其他 API。

| Method | Path | 說明 |
|--------|------|------|
| POST | `/api/auth/login` | 登入，回傳 JWT |
| GET | `/api/posts?keyword=&page=0&size=10` | 文章列表（依標題搜尋、分頁） |
| GET | `/api/posts/{id}` | 取得單篇文章 |
| POST | `/api/posts` | 新增文章 |
| PUT | `/api/posts/{id}` | 編輯文章 |
| DELETE | `/api/posts/{id}` | 刪除文章 |

除了登入外，所有 API 需帶 `Authorization: Bearer <token>`。
文章欄位：`title`、`content`、`tags`、`status`（`DRAFT` / `PUBLISHED`），`author` 與 `createdAt` 由後端產生。
錯誤統一以 ProblemDetail 格式回傳（400 驗證失敗 / 401 未登入或 token 無效 / 404 找不到）。

## 測試與覆蓋率

```bash
# 後端：需要 Docker（Testcontainers 會自動啟動一個 Postgres）
cd backend
./mvnw verify
# 報表：backend/target/site/jacoco/index.html

# 前端：需要 Chrome
cd frontend
npm run test:ci
# 報表：frontend/coverage/frontend/index.html
```

- 後端：`ApiIntegrationTest` 以真實 Postgres + Flyway 跑完整流程（登入取得 JWT → CRUD、搜尋分頁、401 / 400 / 404、過期 token）。
- 前端：AuthService、interceptor、guard 與三個頁面元件（loading / 錯誤 / 空資料、表單驗證、預填、刪除確認）。

## 專案結構

```
backend/src/main/java/com/andy/blogadmin
├── controller   # REST API
├── service      # 商業邏輯（含 JWT 簽發）
├── repository   # Spring Data JPA
├── entity       # User、Post
├── dto          # Request / Response
├── config       # Spring Security、初始資料
└── exception    # 自訂例外與全域錯誤處理
backend/src/main/resources/db/migration   # Flyway SQL

frontend/src/app
├── core                 # AuthService、interceptor、guard（全域共用）
└── features             # 依功能切分，皆為 Lazy Loading
    ├── login
    └── posts            # 子路由、PostService、post-list、post-form
```

## 設計說明

- **驗證**：Spring Security + `oauth2-resource-server` 驗證 HS256 JWT（subject 為 userId，預設 2 小時過期），不需自寫 filter；密碼以 BCrypt 雜湊。JWT 為無狀態，登出由前端丟棄 token。正式環境請以環境變數 `JWT_SECRET` 覆蓋金鑰。
- **前端整合**：token 存在 `localStorage`，由 interceptor 自動帶入 header；收到 401（包含 token 過期）時清除登入狀態並導回登入頁。
- **Lazy Loading**：登入頁 `loadComponent`、文章模組 `loadChildren`；guard 使用 `canMatch`，未登入時連文章模組的 chunk 都不會下載。
- **OnPush**：所有元件使用 `ChangeDetectionStrategy.OnPush`，畫面狀態以 signal 管理。
- **UX**：送出時按鈕顯示處理中並停用、列表載入中淡化、載入 / 刪除失敗可重試、空資料與查無結果分別提示；連續搜尋 / 換頁時取消上一個請求，避免舊結果覆蓋新結果。
- **Schema**：由 Flyway 管理，Hibernate 設為 `validate`，只檢查 entity 與資料表是否一致。
