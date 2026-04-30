# 恋爱小岛日记

> 一个私密、温柔、治愈的恋爱日记网站

![license](https://img.shields.io/badge/license-MIT-blue.svg)
![tech](https://img.shields.io/badge/Next.js-14-black)
![tech](https://img.shields.io/badge/Prisma-ORM-2D3748)

## 项目简介

**恋爱小岛日记** 是一个面向个人使用的恋爱日记网站，用于记录情侣之间的日常、纪念日、照片和心情。

核心设计理念：
- **私密** — 不开放注册，仅个人使用
- **温柔** — 奶油色系、手写体、轻拟物卡片
- **治愈** — 像翻开一本手账，翻书浏览回忆
- **仪式感** — 纪念日计数、翻书动画、保存反馈

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 14 (App Router) |
| 语言 | TypeScript |
| UI 库 | animal-island-ui |
| 样式 | Tailwind CSS |
| ORM | Prisma |
| 数据库 | SQLite |
| 动画 | Framer Motion |
| 日期 | dayjs |
| 字体 | 霞鹜文楷 (LXGW WenKai) |

## 功能特性

### P0 — 第一版核心功能

- 精美封面页：情侣昵称、在一起天数计数动画
- 翻书式浏览日记：上一篇 / 下一篇 + 3D 翻页动画
- 时间线目录：竖向时间轴快速定位任意日记
- 写日记：日期、标题、心情（5 种）、正文、外链图片 URL
- 心情选择器：弹性动画反馈
- 草稿自动保存：localStorage 防抖保存
- 编辑与删除：复用表单 + 二次确认 Modal
- 首次引导：设置情侣信息后进入
- 移动端优先：安全区适配、键盘友好、单列布局

### P1 — 第二阶段

- 回忆照片墙
- 日历页（回忆索引）
- 访问密码保护

### P2 — 后续增强

- 标签系统
- 按心情筛选
- 搜索日记
- 数据导出

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm (推荐) 或 npm

### 本地开发

```bash
# 1. 克隆项目
git clone https://github.com/dnslin/love-island-diary.git
cd love-island-diary

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，配置可选的访问密码：
# LOVE_DIARY_PASSWORD=your-private-password

# 4. 初始化数据库
npx prisma migrate dev --name init
npx prisma generate

# 5. 启动开发服务器
pnpm dev
```

访问 http://localhost:3000，首次进入会引导填写情侣信息。

### Docker 部署

```bash
# 构建并启动
docker-compose up -d

# 数据库文件会持久化到 ./data/love-diary.db
```

## 项目结构

```
├── prisma/
│   ├── schema.prisma      # 数据模型定义
│   └── dev.db             # SQLite 数据库文件
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── page.tsx       # 封面页
│   │   ├── diary/         # 日记相关路由
│   │   ├── memories/      # 回忆照片墙 (P1)
│   │   ├── calendar/      # 日历页 (P1)
│   │   └── settings/      # 设置页
│   ├── components/        # 业务组件
│   ├── lib/
│   │   ├── prisma.ts      # Prisma Client 单例
│   │   ├── actions.ts     # Server Actions
│   │   └── utils.ts       # 工具函数
│   └── types/             # 类型定义
├── public/                # 静态资源
├── docs/                  # 设计文档
├── Dockerfile
└── docker-compose.yml
```

## 设计风格

- **色彩**：奶油色系 `#FFF9F5` 背景，`#F7C8D0` 主色
- **字体**：标题使用霞鹜文楷，正文使用 Nunito + Noto Sans SC
- **圆角**：卡片 16px，按钮 50px pill 形
- **动画**：轻柔、快速、不喧宾夺主
- **插画**：低饱和度线稿风格，克制使用

## 开发路线

详见 [GitHub Issues](https://github.com/dnslin/love-island-diary/issues) 和 [设计文档](docs/superpowers/specs/2026-04-30-love-diary-design.md)。

## License

MIT
