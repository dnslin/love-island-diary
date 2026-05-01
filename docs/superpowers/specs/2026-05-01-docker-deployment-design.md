# Docker 部署配置设计文档

## 1. 背景与目标

### 1.1 背景

项目「恋爱小岛日记」已完成 M1 初始化（Next.js 16 + TypeScript + Prisma + SQLite），需要在 VPS 上通过 Docker 部署。SQLite 数据库文件需要持久化存储，避免重新部署时数据丢失。

### 1.2 目标

提供完整的 Docker 部署方案，实现一键启动，确保数据库文件通过 Volume 挂载持久化。

## 2. 范围界定

### 2.1 包含范围

- `Dockerfile`（基于 `node:20-alpine`，使用 Next.js standalone 输出，pnpm 包管理器）
- `docker-compose.yml`（包含 Volume 挂载配置）
- `.dockerignore`
- 部署文档说明

### 2.2 不包含范围

- CI/CD 流水线
- 自动备份脚本（P2）
- Nginx 反向代理配置（由用户自行配置）

## 3. 技术方案

### 3.1 架构概述

采用**多阶段构建**，分为 `builder` 和 `runner` 两个阶段：

**builder 阶段**（`node:20-alpine`）

| 步骤 | 说明 |
|------|------|
| 安装构建工具 | `python3`, `make`, `g++`, `gcc`（better-sqlite3 原生模块编译所需） |
| 启用 pnpm | `corepack enable`（Node.js 内置，无需额外安装） |
| 安装依赖 | `pnpm install --frozen-lockfile`（含 devDependencies） |
| 生成 Prisma Client | `npx prisma generate` |
| 构建应用 | `pnpm build`（生成 `.next/standalone` 输出） |

**runner 阶段**（`node:20-alpine`，精简镜像）

| 复制内容 | 来源 | 目标 |
|----------|------|------|
| standalone 输出 | `/app/.next/standalone/` | `/app/` |
| 静态资源 | `/app/.next/static/` | `/app/.next/static/` |
| public 目录 | `/app/public/` | `/app/public/` |
| Prisma schema | `/app/prisma/schema.prisma` | `/app/prisma/schema.prisma` |

运行时环境变量：

- `NODE_ENV=production`
- `DATABASE_URL=file:/data/love-diary.db`

启动命令：`node server.js`

### 3.2 docker-compose.yml

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/data
    environment:
      - DATABASE_URL=file:/data/love-diary.db
```

- **端口映射**：宿主机 `3000` → 容器 `3000`
- **Volume 挂载**：宿主机 `./data` → 容器 `/data`
- **环境变量**：覆盖 Dockerfile 中的默认值

### 3.3 数据持久化策略

- 容器首次启动时，宿主机 `./data` 目录由 Docker 自动创建
- SQLite 数据库文件 `/data/love-diary.db` 由 Prisma Client 在首次写入时自动创建
- 重新部署（`docker-compose down && docker-compose up --build`）时，宿主机 `./data/love-diary.db` 保持不变
- 挂载到 `/data` 而非 `/app` 是为了语义清晰，避免与应用代码混在一起

### 3.4 .dockerignore

忽略以下文件，避免复制进构建上下文：

- `node_modules/`
- `.next/`
- `prisma/dev.db`
- `.env*`（环境文件，通过 Dockerfile ENV 或 docker-compose environment 注入）
- `.git/`
- `.superpowers/`
- `docs/`

### 3.5 关键决策说明

| 决策项 | 结论 | 原因 |
|--------|------|------|
| 包管理器 | pnpm | 项目已有 `pnpm-lock.yaml`，通过 `corepack enable` 启用，无需额外安装 |
| 多阶段构建 | 是 | 满足镜像体积 < 200MB 的硬性要求 |
| 基础镜像 | `node:20-alpine` | Issue #3 指定，体积小且满足 Node.js >= 18 引擎要求 |
| DATABASE_URL 设置 | Dockerfile ENV + docker-compose 覆盖 | 不将 `.env` 复制进镜像，避免生产环境配置泄露 |
| root 运行 | 是（当前版本） | 单用户 VPS 场景下属主为 root 通常可接受，非 root 优化不在当前范围 |

## 4. 边界情况与风险处理

| 风险点 | 处理方案 |
|--------|----------|
| better-sqlite3 在 Alpine 上编译失败 | builder 阶段安装 `python3 make g++ gcc`，确保完整编译环境 |
| Prisma Client 运行时找不到 schema | runner 阶段显式复制 `prisma/schema.prisma` |
| `public/` 静态资源未服务 | standalone 模式不自动包含 public，需显式复制 |
| `.next/static/` 未复制 | standalone 输出不包含静态文件，需显式 `COPY --from=builder` |
| 镜像体积超标 | 多阶段构建 + Alpine 基础镜像，预估 120-150MB |

## 5. 验收标准

### 5.1 功能验收

- [ ] `docker build` 成功构建镜像
- [ ] `docker-compose up` 可以一键启动服务
- [ ] 容器内 SQLite 数据库文件挂载到宿主机 `./data/love-diary.db`
- [ ] 重新部署后数据不丢失
- [ ] 端口映射为 `3000`

### 5.2 性能验收

- [ ] 镜像体积 < 200MB

### 5.3 集成测试

- [ ] `docker-compose up` 后可以通过 `http://localhost:3000` 访问
- [ ] 创建一条日记后停止容器，重新启动，数据仍然存在
