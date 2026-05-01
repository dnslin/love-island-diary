# M1 项目初始化设计文档

## 1. 背景与目标

### 1.1 背景

本项目「恋爱小岛日记」是一个私密恋爱日记网站，当前仓库仅包含设计文档和 README，尚未建立 Next.js 项目骨架。本 Issue（#1）负责完成所有基础环境搭建。

### 1.2 目标

搭建可运行的 Next.js 14 + TypeScript 项目，接入 animal-island-ui 组件库、配置 Tailwind CSS v4 奶油色主题、加载霞鹜文楷字体，并建立规范的项目目录结构。

## 2. 范围界定

### 2.1 包含范围

- 使用 `pnpm create next-app@latest` 创建 Next.js 14 项目（App Router + TypeScript + Tailwind CSS）
- 配置 Tailwind CSS v4（CSS-first 配置，自定义奶油色系主题）
- 接入 animal-island-ui 组件库
- 加载 HYTiaoTiao 跳跳体作为正文字体
- 配置全局样式（背景色 #FFF9F5、文字色 #5B4B49）
- 建立项目目录结构（src/app、src/components、src/lib、prisma）

### 2.2 不包含范围

- 数据库配置（Issue #2 负责）
- 具体页面实现（后续 Issue 负责）
- Docker 配置（Issue #3 负责）

## 3. 技术方案

### 3.1 迁移与创建流程

1. 将当前目录现有文件（`docs/`、`README.md`、`.gitignore`、`.git/`）暂移到备份目录
2. 执行 `pnpm create next-app@latest .`（选项：App Router + TypeScript + Tailwind CSS + ESLint + `src/` 目录）
3. 恢复原有文件，合并 `.gitignore`
4. 安装 `animal-island-ui`：`pnpm add animal-island-ui`
5. 添加 HYTiaoTiao 跳跳体字体文件到 `src/app/fonts/`
6. 配置 Tailwind v4 主题色和字体
7. 验证：`pnpm dev` 正常启动

### 3.2 Tailwind CSS v4 配置

**`postcss.config.mjs`**：
```js
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
export default config;
```

**`src/app/globals.css`**：
```css
@import "tailwindcss";

@theme {
  --color-cream: #FFF9F5;
  --color-card: #FFFFFF;
  --color-primary: #F7C8D0;
  --color-accent: #E8AEB7;
  --color-text-main: #5B4B49;
  --color-text-sub: #8A7C78;
  --color-border-soft: #F1E4DD;
  --font-display: 'LXGW WenKai', serif;
}
```

### 3.3 字体加载方案

通过 `next/font/local` 本地加载 HYTiaoTiao 跳跳体（657K），避免 FOUC（无样式内容闪烁）。

在 `src/app/layout.tsx` 中配置：
```tsx
import localFont from 'next/font/local';

const hyTiaoTiao = localFont({
  src: './fonts/HYTiaoTiao.ttf',
  variable: '--font-body',
  display: 'swap',
});
```

字体加载失败时回退到系统字体栈：`PingFang SC`、`Microsoft YaHei`、sans-serif。

### 3.4 目录结构

```
├── prisma/                  # 空目录占位（Issue #2 使用）
├── public/                  # 静态资源
├── src/
│   ├── app/
│   │   ├── layout.tsx       # 根布局：字体加载、全局样式
│   │   ├── page.tsx         # 验证页（animal-island-ui Button + 霞鹜文楷标题）
│   │   └── globals.css      # 全局样式 + @theme 主题配置
│   ├── components/          # 空目录占位
│   ├── lib/                 # 空目录占位
│   └── types/               # 空目录占位
├── docs/                    # 恢复原有设计文档
├── postcss.config.mjs       # Tailwind v4 PostCSS 配置
├── next.config.js           # Next.js 配置
├── tsconfig.json            # TypeScript 配置
├── package.json             # 依赖列表
├── pnpm-lock.yaml
├── README.md                # 恢复并更新
└── .gitignore               # 合并（原有 + Next.js 默认）
```

### 3.5 验证页内容

`src/app/page.tsx` 作为验证页，包含：
- 页面标题「恋爱小岛日记」，使用 HYTiaoTiao 跳跳体
- 一个 animal-island-ui 的 Button 组件
- 验证背景色 `#FFF9F5` 和文字色 `#5B4B49`

## 4. 验收标准

### 4.1 功能验收

- [ ] `pnpm dev` 可以正常启动开发服务器
- [ ] animal-island-ui Button 组件可以在页面中正常渲染
- [ ] HYTiaoTiao 跳跳体正确加载，文字显示手写体
- [ ] 页面背景色为 `#FFF9F5`，文字色为 `#5B4B49`
- [ ] Tailwind CSS v4 自定义配置生效（颜色、字体变量可用）

### 4.2 性能验收

- [ ] 首屏无样式闪烁（FOUC）
- [ ] 字体通过本地/异步加载，不阻塞渲染
- [ ] 控制台无 Tailwind v4 相关警告

### 4.3 边界情况

- [ ] 字体加载失败时回退到系统字体栈（`PingFang SC`, `Microsoft YaHei`, sans-serif）

## 5. 决策记录

| 决策 | 结论 | 原因 |
|------|------|------|
| 包管理器 | pnpm | BOSS 偏好，与 README 推荐一致 |
| Tailwind 版本 | v4（CSS-first 配置） | 最新版本，配置更简洁，无需 tailwind.config.ts |
| 字体加载 | 本地 TTF + next/font/local | 避免 FOUC，构建时自动优化子集 |
| 项目创建位置 | 当前目录 | BOSS 明确要求 |
| 现有文件处理 | 暂移备份后恢复 | 保留 Git 历史和设计文档 |
