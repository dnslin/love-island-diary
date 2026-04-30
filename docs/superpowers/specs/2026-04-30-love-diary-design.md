# 恋爱小岛日记 — 设计文档

## 1. 项目概述

### 1.1 定位
面向个人使用的私密恋爱日记网站，用于记录情侣之间的日常、纪念日、照片和心情。不开放公共注册，核心目标是打造一个**私密、温柔、治愈、移动端体验优秀**的个人情感记录空间。

### 1.2 设计风格关键词
奶油色系、自然手账风、温柔治愈风、轻拟物卡片感、岛屿 / 日记本 / 相册感。

### 1.3 使用场景
- 每天晚上用手机记录当天发生的事情
- 按时间线回顾两个人的回忆
- 在纪念日查看已经在一起多少天
- 给伴侣/朋友展示回忆时，只展示日记和照片

---

## 2. 技术架构

### 2.1 技术栈

| 层级 | 选型 | 说明 |
|------|------|------|
| 框架 | Next.js 14+ (App Router) | Server Components + Server Actions |
| 语言 | TypeScript | 全栈类型安全 |
| UI 库 | animal-island-ui | 动森风格组件库 |
| 样式 | Tailwind CSS + 组件库样式 | 自定义样式补充 |
| ORM | Prisma | SQLite 操作 |
| 数据库 | SQLite | 个人项目，文件级持久化 |
| 动画 | Framer Motion | 页面过渡、翻书动画、列表动画 |
| 日期 | dayjs | 日期计算与格式化 |
| 字体 | 霞鹜文楷 (LXGW WenKai) | 标题/装饰性文字，Google Fonts / CDN 加载 |
| 部署 | Docker + VPS | standalone 输出，Volume 挂载数据库 |

### 2.2 项目目录结构

```
├── prisma/
│   ├── schema.prisma      # 数据模型
│   └── dev.db             # SQLite 文件（Docker Volume 挂载）
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── page.tsx       # 封面/扉页
│   │   ├── layout.tsx     # 根布局（字体加载、全局样式）
│   │   ├── diary/
│   │   │   ├── page.tsx   # 时间线目录页
│   │   │   ├── new/
│   │   │   │   └── page.tsx   # 新增日记
│   │   │   └── [id]/
│   │   │       ├── page.tsx   # 单篇日记（支持上一篇/下一篇翻页）
│   │   │       └── edit/
│   │   │           └── page.tsx   # 编辑日记
│   │   ├── memories/
│   │   │   └── page.tsx   # 回忆照片墙（P1）
│   │   └── settings/
│   │       └── page.tsx   # 设置页（首次引导 + 日常修改）
│   ├── components/        # 业务组件
│   │   ├── CoverPage.tsx
│   │   ├── DiaryPage.tsx
│   │   ├── DiaryTimeline.tsx
│   │   ├── MoodSelector.tsx
│   │   ├── ImageUrlInput.tsx
│   │   ├── FloatingWriteButton.tsx
│   │   ├── PageFlipWrapper.tsx
│   │   └── EmptyState.tsx
│   ├── lib/
│   │   ├── prisma.ts      # Prisma Client 单例
│   │   ├── actions.ts     # Server Actions（CRUD）
│   │   └── utils.ts       # 工具函数（dayjs 封装、天数计算）
│   └── types/             # 共享类型（从 Prisma 生成）
├── public/                # 静态资源（插画 SVG、字体）
├── Dockerfile
└── docker-compose.yml
```

### 2.3 部署方案

- Docker 镜像基于 `node:20-alpine`
- Next.js 使用 `output: 'standalone'` 模式
- SQLite 数据库文件通过 Docker Volume 挂载到 `/data/love-diary.db`
- 可选 `docker-compose.yml` 一键启动
- 数据库文件和图片目录避免因部署被覆盖

---

## 3. 数据模型

### 3.1 Prisma Schema

```prisma
model DiaryEntry {
  id        String   @id @default(cuid())
  date      DateTime
  title     String
  content   String
  mood      String   @default("sweet")
  weather   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  images    DiaryImage[]
}

model DiaryImage {
  id        String   @id @default(cuid())
  url       String
  entryId   String
  entry     DiaryEntry @relation(fields: [entryId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}

model CoupleProfile {
  id              String   @id @default(cuid())
  personAName     String
  personBName     String
  anniversaryDate DateTime
  siteTitle       String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### 3.2 设计决策

- `CoupleProfile` 只存一条记录。首次访问时检测不存在则重定向到 `/settings`
- `DiaryImage` 与 `DiaryEntry` 一对多，删除日记级联删除图片记录
- `title` 允许为空，UI 层做空值处理（显示"某月某日的日记"等默认标题）
- 图片使用外链 URL，不做本地上传

---

## 4. 页面与路由设计

### 4.1 路由映射

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | 封面 / 扉页 | 网站标题、双方昵称、在一起天数、"翻开日记"按钮 |
| `/diary` | 时间线目录 | 竖向时间轴，快速定位到任意一天的日记 |
| `/diary/new` | 新增日记 | 表单：日期、标题、心情、正文、图片 URL |
| `/diary/[id]` | 单篇日记 | 核心阅读体验，支持"上一篇/下一篇"翻书动画 |
| `/diary/[id]/edit` | 编辑日记 | 复用新增日记表单，预填充数据 |
| `/settings` | 设置页 | 首次引导（必填）+ 日常修改情侣信息 |
| `/memories` | 回忆照片墙 | P1 阶段实现 |
| `/calendar` | 日历页 | P1 阶段实现 |

### 4.2 信息架构原则

- **对外展示**（给别人看的）：封面 → 单篇日记（翻书浏览）→ 回忆照片
- **后台操作**（自己用的）：写日记（浮动按钮）、编辑、设置（右上角齿轮）
- **无底部导航栏**：跳出常规 App 设计，更像一本打开的手账/相册

### 4.3 封面页 (`/`)

- 网站标题（如"恋爱小岛日记"）
- 双方昵称（如"小兔子 & 大灰狼"）
- 在一起天数（计数动画）
- 在一起日期范围（如"2024.07.18 — 至今"）
- 日记总数、回忆数
- "翻开日记"按钮（主 CTA，有浮动呼吸动画）
- 右上角小齿轮（设置入口）

### 4.4 单篇日记页 (`/diary/[id]`)

- 顶部：返回封面 ←、日期、→ 下一篇
- 日记卡片（大圆角、奶油色边框、轻阴影）：
  - 心情标签（带颜色）+ 篇数序号
  - 标题
  - 正文
  - 外链图片（如有）
- 底部："时间线"按钮（跳转目录）、"上一篇/下一篇"按钮
- 日记详情页支持左右滑动手势切换上一篇/下一篇

### 4.5 时间线目录页 (`/diary`)

- 左侧竖线 + 圆点的时间轴
- 每条显示日期 + 标题
- 点击跳转对应日记
- 从单篇日记页通过"时间线"按钮进入

### 4.6 新增/编辑日记页

- 表单字段：日期（默认今天）、标题（可选）、心情选择器（5 种）、正文（必填）、图片 URL 列表（可选，可添加多个外链）
- 保存后跳转到日记详情页，顶部显示保存成功提示
- 支持 `localStorage` 草稿自动保存

### 4.7 设置页 (`/settings`)

- 首次访问时强制进入（`CoupleProfile` 不存在时中间件重定向）
- 字段：双方昵称、在一起日期、网站标题
- 保存后跳转到封面

---

## 5. 交互与动画设计

### 5.1 核心原则

轻、柔、顺、直觉、低负担。动画不是为了"酷"，而是让用户感到页面切换自然、反馈即时、状态变化温柔、有一点仪式感。

### 5.2 动画清单

| 场景 | 动画效果 | 时长 | 实现方式 |
|------|---------|------|---------|
| 封面"翻开日记"按钮 | 缓慢上下浮动 translateY ±3px + 呼吸阴影 | 3000ms infinite | CSS animation |
| 纪念日天数 | 从 0 计数滚动到实际天数 | 1500ms | Framer Motion useSpring |
| 翻书（上一篇/下一篇）| 当前页 rotateY 翻走，新页 rotateY 翻入 | 400ms | Framer Motion AnimatePresence + variants |
| 页面进入 | 淡入 + 上移 8px | 300ms | Framer Motion |
| 卡片列表出现 | stagger 淡入 + 上移，每项延迟 60ms | 300ms | Framer Motion staggerChildren |
| 按钮点击 | 轻微缩放 0.96 | 100ms | Framer Motion whileTap |
| 心情选择 | 弹性放大 spring(stiffness: 300, damping: 15) | 300ms | Framer Motion |
| 保存成功 | 顶部条幅温柔滑入 | 250ms | Framer Motion |
| 弹窗（删除确认）| 淡入 + 轻微缩放 | 250ms | Framer Motion |
| 空状态 | 插画 + 文字淡入，插画轻微摆动 | 400ms | Framer Motion |

### 5.3 手势交互

- 单篇日记页支持左右滑动手势切换上一篇/下一篇（使用 touch 事件或库如 `react-swipeable`）
- 日记卡片点击区域充足
- 删除等危险操作必须二次确认（animal-island-ui Modal）

### 5.4 焦点与反馈

- 输入框聚焦：边框变为 `#ffcc00`（animal-island-ui 焦点黄），柔和不刺眼
- 按钮焦点：outline `#19c8b9`，offset 2px
- 所有可交互元素 hover 时有轻微上浮或阴影变化

---

## 6. UI 设计规范

### 6.1 色彩系统（奶油色系）

| 用途 | 颜色 |
|------|------|
| 页面背景 | `#FFF9F5` |
| 卡片背景 | `#FFFFFF` |
| 主色 | `#F7C8D0` |
| 强调色 | `#E8AEB7` |
| 主文字 | `#5B4B49` |
| 次级文字 | `#8A7C78` |
| 边框 | `#F1E4DD` |
| 开心心情 | `#B8DDA8` |
| 想念心情 | `#AFC9F7` |
| 难过心情 | `#D8C7E8` |

### 6.2 字体

- **标题/装饰**：霞鹜文楷（LXGW WenKai）— 温柔手写感
- **正文**：Nunito + Noto Sans SC + Zen Maru Gothic（animal-island-ui 默认）
- 正文 weight 500，按钮/标题 600-700，数字强调 900

### 6.3 圆角与阴影

- 卡片：`border-radius: 16px`
- 按钮：`border-radius: 50px`（pill 形）
- 阴影轻量柔和：`0 4px 10px rgba(107, 92, 67, 0.08)`

### 6.4 插画使用策略（克制）

- **封面背景**：subtle 岛屿/云朵线稿插画，低饱和度，不抢夺文字焦点
- **空状态**：小动物/信封/日记本线稿插画 + 温柔文案"还没有写下我们的第一篇日记"
- **心情图标**：5 种心情各配一个简单 SVG 图标，选中时微微放大
- **装饰分割线**：animal-island-ui Divider 组件
- 所有插画统一低饱和度线稿风格，不喧宾夺主

### 6.5 禁用 Emoji

全部使用 animal-island-ui Icon 组件或项目自定义 SVG 图标，禁止使用 Emoji。

---

## 7. 移动端适配

### 7.1 适配范围

- 优先适配宽度：360px、375px、390px、414px、430px
- 内容最大宽度 480px，居中显示
- PC 端：1024px+ 时内容居中，两侧留白

### 7.2 触控与输入

- 按钮高度 ≥ 48px（animal-island-ui middle 尺寸）
- 输入框字号 ≥ 16px（防止 iOS 自动放大）
- 写日记时输入框聚焦自动滚动到可视区域
- 底部按钮不被键盘遮挡

### 7.3 安全区

- 底部预留 `env(safe-area-inset-bottom)`
- iPhone 刘海屏适配

### 7.4 性能

- 首页首屏快速加载
- 日记列表支持分页或懒加载
- 动画使用 `transform`/`opacity`  only（GPU 加速）
- 支持 `prefers-reduced-motion`

---

## 8. 功能优先级

### 8.1 P0：第一版必须实现

- [ ] Next.js 项目搭建 + TypeScript
- [ ] 接入 animal-island-ui
- [ ] Prisma + SQLite 配置
- [ ] 封面页（昵称、天数、翻开日记按钮）
- [ ] 单篇日记页（上一篇/下一篇翻书动画）
- [ ] 时间线目录页
- [ ] 新增日记页
- [ ] 编辑日记页
- [ ] 删除日记（二次确认 Modal）
- [ ] 设置页（首次引导 + 日常修改）
- [ ] 移动端适配（无底部导航）
- [ ] 基础响应式布局
- [ ] 外链图片 URL 支持

### 8.2 P1：第二阶段

- [ ] 回忆照片墙 `/memories`
- [ ] 日历页 `/calendar`
- [ ] 访问密码（环境变量 + Cookie）
- [ ] 纪念日展示优化
- [ ] 保存成功动画
- [ ] 空状态插画
- [ ] 更完整的动画系统

### 8.3 P2：后续增强

- [ ] 标签系统
- [ ] 按心情筛选
- [ ] 按月份归档
- [ ] 搜索日记
- [ ] 自动备份
- [ ] 数据导出
- [ ] 主题切换

---

## 9. 数据库与数据流

### 9.1 Server Actions

所有 CRUD 通过 Next.js Server Actions 实现，Prisma Client 直接调用：

- `createDiary(data)` — 创建日记
- `updateDiary(id, data)` — 更新日记
- `deleteDiary(id)` — 删除日记（级联删除图片记录）
- `getDiaryList()` — 获取日记列表（按时间倒序）
- `getDiaryById(id)` — 获取单篇日记
- `getDiaryNeighbors(id)` — 获取上一篇/下一篇 ID
- `getCoupleProfile()` — 获取情侣信息
- `updateCoupleProfile(data)` — 更新情侣信息

### 9.2 首次引导逻辑

- 中间件检测 `CoupleProfile` 是否存在
- 不存在时，所有路由重定向到 `/settings`
- 设置页表单提交后创建记录，跳转到封面

---

## 10. 验收标准

### 10.1 功能

1. 可以创建一篇日记
2. 可以按时间线查看所有日记
3. 可以翻书式浏览单篇日记（上一篇/下一篇）
4. 可以编辑已有日记
5. 可以删除已有日记（二次确认）
6. 首次访问强制设置情侣信息
7. 数据刷新页面后不丢失
8. 支持外链图片 URL

### 10.2 UI

1. 页面整体风格统一（奶油色系、手账感）
2. 移动端操作舒适，无横向滚动
3. 字体层级清晰，标题用手写体
4. 卡片、按钮、输入框样式一致
5. 关键操作有反馈（动画）
6. 无底部导航，更像手账/相册
7. 动画轻柔不影响主要操作
8. 禁用 Emoji，使用图标

### 10.3 数据

1. 日记写入 SQLite
2. 可以按时间倒序查询
3. 编辑操作更新 updatedAt
4. 删除操作移除对应记录和图片记录
5. 数据库文件可被备份

---

## 11. 决策记录

| 决策 | 结论 | 原因 |
|------|------|------|
| 路由模式 | App Router + Server Actions | 最少样板代码，类型安全，适合低并发个人项目 |
| 部署方式 | Docker + VPS | SQLite 需要持久化文件，VPS 最稳定 |
| 底部导航 | 取消 | 更像手账/相册，区分展示层和后台操作 |
| 主导航 | 翻书式（封面 → 单篇日记） | 实体手账的数字化还原，有仪式感 |
| 时间线 | 降级为目录页 | 辅助快速定位，非主导航 |
| 图片 | 外链 URL | 避免本地上传复杂度，P1 再考虑扩展 |
| 设置 | 首次引导 + 可修改 | 必须信息在首次访问时收集 |
| 字体 | 霞鹜文楷 + Nunito/Noto Sans SC | 手写体增加温柔感，正文保持可读性 |
| 图标 | animal-island-ui Icon / 自定义 SVG | 禁用 Emoji |
