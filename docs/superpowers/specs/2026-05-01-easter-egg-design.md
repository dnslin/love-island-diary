# 彩蛋设计：三连点击 Logo 触发情话弹窗

## 背景

在「恋爱小岛日记」封面页增加一个隐藏彩蛋，通过连续点击 Logo 三次触发一个弹窗，使用打字机效果展示一段情话，增强产品的温柔治愈感。

## 需求

- **触发条件**：在封面页（`/`）连续点击 Logo 三次（任意时间间隔）。
- **弹窗内容**：打字机效果逐字显示文案。
- **技术约束**：使用 `animal-island-ui` 组件库，不引入新依赖。

## 文案

```
你的眼睛真好看，里面有晴雨，日月，山川，江河，云雾，花鸟。
但是我的眼睛更好看，因为里面有你。
```

## 方案

采用 **Modal + 独立 Typewriter 组件**（方案 B）。

- `Modal` 负责弹窗的遮罩、动画、关闭行为。
- `Typewriter` 负责文案的逐字显示，保留换行和样式。

不采用 Modal 内置 `typewriter` 属性的原因是：该属性极大概率仅作用于 `title`，而文案是一段长段落，需要放在 `children` 中并通过独立 `Typewriter` 精确控制。

## 组件设计

### 状态管理

在封面页 `page.tsx` 中维护两个状态：

- `clickCount: number` — 记录当前连续点击次数，达到 3 时触发弹窗并重置为 0。
- `isOpen: boolean` — 控制 Modal 显隐，关闭时重置 `clickCount` 为 0。

### 交互流程

```
用户点击 Logo
  → clickCount + 1
  → clickCount === 3 ?
      → setIsOpen(true)
      → setClickCount(0)
  : 无操作

用户关闭弹窗
  → onClose 回调
  → setIsOpen(false)
  → setClickCount(0)
```

### UI 结构

```tsx
<Image
  src="/logo.svg"
  alt="恋爱小岛日记"
  onClick={handleLogoClick}
  // ...其他属性
/>

<Modal
  open={isOpen}
  onClose={handleClose}
  maskClosable
  closable
  footer={null}
  width={320}
>
  <div className="text-center">
    <Icon name="heart" className="..." />
    <Typewriter speed={80} trigger={isOpen}>
      <p>你的眼睛真好看，里面有晴雨，日月，山川，江河，云雾，花鸟。</p>
      <p>但是我的眼睛更好看，因为里面有你。</p>
    </Typewriter>
  </div>
</Modal>
```

### 样式

- 弹窗宽度固定 320px，适配移动端。
- 文案居中显示，段落间距舒适。
- `Typewriter` 的 `trigger` 传入 `isOpen`，确保每次弹窗打开都重新播放打字机动画。
- 配合 `Icon`（爱心图标）增强视觉层次。

## 技术要点

1. **`Typewriter` 的 `trigger` 用法**：`animal-island-ui` 的 `Typewriter` 组件支持 `trigger` 属性，值变化时重新播放动画。传入 `isOpen` 布尔值可在每次弹窗打开时触发重播。
2. **防止误触**：`clickCount` 在打开弹窗后必须立即重置为 0，避免弹窗关闭后残留计数导致再次快速触发。
3. **关闭弹窗重置**：无论通过关闭按钮还是点击遮罩关闭，都需重置 `clickCount`。

## 文件变更

- `src/app/page.tsx` — 新增点击计数状态、Modal 弹窗和 Typewriter 内容。

## 风险与兜底

- `animal-island-ui` 的 `Icon` 组件图标名称需与 `ICON_LIST` 对齐，若 `heart` 不存在则替换为其他合适图标或移除。
- `Typewriter` 若不支持 `<p>` 等多元素 children，则改用单一段落加 `<br />` 换行。
