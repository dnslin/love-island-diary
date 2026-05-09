# ---------- builder 阶段 ----------
FROM node:22-alpine AS builder

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
FROM node:22-alpine AS runner

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
