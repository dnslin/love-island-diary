# Docker 部署配置实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为「恋爱小岛日记」项目创建完整的 Docker 部署配置，支持一键启动和 SQLite 数据持久化。

**Architecture:** 使用多阶段 Dockerfile（builder + runner）基于 node:20-alpine，配合 docker-compose.yml 的 Volume 挂载实现数据库持久化。builder 阶段安装编译工具并构建 standalone 输出，runner 阶段仅保留运行所需的最小文件集合。

**Tech Stack:** Docker, Docker Compose, Next.js standalone, pnpm, Prisma, SQLite

---

## 文件结构

| 文件 | 操作 | 说明 |
|------|------|------|
| `.dockerignore` | 新建 | 排除不需要进入构建上下文的文件，缩小构建体积 |
| `Dockerfile` | 新建 | 多阶段构建：builder（编译 + 构建）→ runner（精简运行） |
| `docker-compose.yml` | 新建 | 服务编排、端口映射、Volume 挂载、环境变量 |

---

### Task 1: 创建 `.dockerignore`

**Files:**
- Create: `.dockerignore`

**说明：** 排除 node_modules、构建产物、开发数据库、Git 仓库、环境文件等，减小构建上下文体积，避免缓存失效。

- [ ] **Step 1: 创建 `.dockerignore` 文件**

```
# 依赖
node_modules/
.pnpm-store/

# Next.js 构建产物
.next/
out/

# 开发数据库（生产环境通过 Volume 挂载）
prisma/dev.db
prisma/dev.db-journal

# 环境文件（通过 Dockerfile ENV 或 docker-compose 注入）
.env
.env.*

# Git
.git/
.gitignore

# 开发工具配置
.superpowers/
docs/
*.md

# 日志
*.log
npm-debug.log*
pnpm-debug.log*

# 系统文件
.DS_Store
```

- [ ] **Step 2: 验证 `.dockerignore` 生效**

Run:
```bash
docker build -t test-ignore . --no-cache 2>&1 | head -n 5
```

Expected: 构建上下文体积明显小于包含 node_modules 的情况（可通过对比 `docker build .` 前的上下文大小感知）。

- [ ] **Step 3: Commit**

```bash
git add .dockerignore
git commit -m "feat: 添加 .dockerignore，排除构建上下文中的无关文件"
```

---

### Task 2: 创建 `Dockerfile`

**Files:**
- Create: `Dockerfile`

**说明：** 多阶段构建。builder 阶段基于 node:20-alpine，安装 python3/make/g++/gcc（better-sqlite3 原生编译所需），通过 corepack 启用 pnpm，安装全部依赖（含 devDependencies），生成 Prisma Client，执行 Next.js 构建。runner 阶段仅复制 standalone 输出和必要文件，不保留 devDependencies 和编译工具。

- [ ] **Step 1: 创建 `Dockerfile` 文件**

```dockerfile
# ---------- builder 阶段 ----------
FROM node:20-alpine AS builder

# 安装 better-sqlite3 编译所需的构建工具
RUN apk add --no-cache python3 make g++ gcc

WORKDIR /app

# 启用 corepack 以使用 pnpm（Node.js 内置）
RUN corepack enable

# 先复制依赖清单，利用 Docker 缓存层
COPY package.json pnpm-lock.yaml ./
COPY prisma/schema.prisma ./prisma/

# 安装全部依赖（含 devDependencies，因为构建需要 prisma、typescript 等）
RUN pnpm install --frozen-lockfile

# 生成 Prisma Client
RUN npx prisma generate

# 复制剩余源代码
COPY . .

# 构建 Next.js standalone 输出
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# ---------- runner 阶段 ----------
FROM node:20-alpine AS runner

WORKDIR /app

# 设置生产环境变量
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/data/love-diary.db

# 复制 standalone 输出（包含 server.js 和必要依赖）
COPY --from=builder /app/.next/standalone ./

# 复制静态资源（standalone 模式下需手动复制）
COPY --from=builder /app/.next/static ./.next/static

# 复制 public 目录（logo.svg 等静态文件）
COPY --from=builder /app/public ./public

# 复制 Prisma schema（Prisma Client 运行时需要）
COPY --from=builder /app/prisma/schema.prisma ./prisma/schema.prisma

# 暴露端口
EXPOSE 3000

# 启动 standalone 服务器
CMD ["node", "server.js"]
```

- [ ] **Step 2: Commit**

```bash
git add Dockerfile
git commit -m "feat: 添加 Dockerfile，多阶段构建基于 node:20-alpine + pnpm"
```

---

### Task 3: 创建 `docker-compose.yml`

**Files:**
- Create: `docker-compose.yml`

**说明：** 定义 `app` 服务，端口映射 3000:3000，Volume 挂载 `./data:/data`，环境变量覆盖 DATABASE_URL。

- [ ] **Step 1: 创建 `docker-compose.yml` 文件**

```yaml
services:
  app:
    build: .
    container_name: love-island-diary
    ports:
      - "3000:3000"
    volumes:
      - ./data:/data
    environment:
      - DATABASE_URL=file:/data/love-diary.db
    restart: unless-stopped
```

- [ ] **Step 2: Commit**

```bash
git add docker-compose.yml
git commit -m "feat: 添加 docker-compose.yml，支持 Volume 持久化和一键启动"
```

---

### Task 4: 本地构建测试

**Files:**
- 无新建/修改文件（纯验证步骤）

**说明：** 验证 `docker build` 能否成功构建镜像，并检查镜像体积是否满足 < 200MB 的要求。

- [ ] **Step 1: 构建 Docker 镜像**

Run:
```bash
docker build -t love-island-diary .
```

Expected: 构建成功完成，输出最后一行类似 `Successfully tagged love-island-diary:latest`

如果构建失败，根据错误日志排查：
- `better-sqlite3` 编译错误 → 检查 builder 阶段是否安装了 `python3 make g++ gcc`
- `prisma generate` 失败 → 检查 `prisma/schema.prisma` 是否正确复制到 builder 阶段
- `pnpm build` 失败 → 检查 Next.js 配置 `output: 'standalone'` 是否已设置

- [ ] **Step 2: 检查镜像体积**

Run:
```bash
docker images love-island-diary --format "{{.Size}}"
```

Expected: 镜像大小 **< 200MB**（通常应在 120-150MB 范围内）

如果体积超标，检查 runner 阶段是否意外复制了 node_modules（standalone 输出已包含精简后的依赖，无需额外复制）。

- [ ] **Step 3: 检查镜像层**

Run:
```bash
docker history love-island-diary
```

Expected: 可以看到 `builder` 和 `runner` 两个阶段的层，runner 阶段的层体积明显小于 builder。

---

### Task 5: 运行验证与持久化测试

**Files:**
- 无新建/修改文件（纯验证步骤）

**说明：** 验证 `docker-compose up` 能正常启动服务，访问首页，创建日记后重启容器，数据仍然保留。

- [ ] **Step 1: 启动服务**

Run:
```bash
docker-compose up -d
```

Expected: 输出 `Creating love-island-diary ... done`

- [ ] **Step 2: 检查容器状态**

Run:
```bash
docker-compose ps
```

Expected: `love-island-diary` 状态为 `Up`，端口映射 `0.0.0.0:3000->3000/tcp`

- [ ] **Step 3: 访问首页**

打开浏览器访问 `http://localhost:3000`，或执行：

Run:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

Expected: HTTP 状态码 `200`

- [ ] **Step 4: 验证 Volume 挂载**

Run:
```bash
ls -la ./data/
```

Expected: 目录已创建，如果已访问过首页并触发过数据库查询，可能已生成 `love-diary.db` 文件。

如果目录不存在，检查 docker-compose.yml 中的 volumes 配置是否正确。

- [ ] **Step 5: 持久化验证（数据不丢失）**

**前置条件：** 需要先有一条可写入数据的操作（如通过首页触发 Prisma 查询创建数据库文件，或后续 Issue 实现日记创建功能后补充此测试）。

当前验证方式：确认宿主机 `./data/` 目录存在，且容器内 `/data/` 与宿主机同步。

Run:
```bash
# 在容器内创建一个测试文件
docker exec love-island-diary sh -c "echo 'test-data' > /data/test.txt"

# 在宿主机验证文件存在
cat ./data/test.txt
```

Expected: 输出 `test-data`，证明 Volume 挂载正常工作。

清理测试文件：
```bash
rm ./data/test.txt
```

- [ ] **Step 6: 停止并清理**

Run:
```bash
docker-compose down
```

Expected: 容器停止并移除，但 `./data/` 目录及其内容保留在宿主机。

---

## Self-Review Checklist

### 1. Spec 覆盖检查

对照设计文档 `docs/superpowers/specs/2026-05-01-docker-deployment-design.md`：

| 设计文档要求 | 对应任务 |
|-------------|---------|
| Dockerfile 多阶段构建（node:20-alpine + pnpm） | Task 2 |
| docker-compose.yml（端口 3000、Volume 挂载） | Task 3 |
| .dockerignore | Task 1 |
| 镜像体积 < 200MB | Task 4 Step 2 |
| `docker build` 成功 | Task 4 Step 1 |
| `docker-compose up` 一键启动 | Task 5 Step 1 |
| 数据持久化验证 | Task 5 Step 4-5 |
| better-sqlite3 编译处理 | Task 2（builder 阶段安装 python3/make/g++/gcc） |
| Prisma Client 生成 | Task 2（`npx prisma generate`） |
| standalone 静态资源复制 | Task 2（`.next/static` 和 `public/`） |

**无遗漏。**

### 2. Placeholder 扫描

- [x] 无 "TBD" / "TODO" / "implement later"
- [x] 无 "Add appropriate error handling" 等模糊描述
- [x] 每个代码步骤都包含完整代码
- [x] 无 "Similar to Task N" 跨任务引用

### 3. 一致性检查

- [x] `DATABASE_URL=file:/data/love-diary.db` 在 Dockerfile 和 docker-compose.yml 中一致
- [x] 端口 `3000` 在 Dockerfile `EXPOSE` 和 docker-compose.yml `ports` 中一致
- [x] Volume 挂载路径 `./data:/data` 与 DATABASE_URL 中的 `/data` 对应
