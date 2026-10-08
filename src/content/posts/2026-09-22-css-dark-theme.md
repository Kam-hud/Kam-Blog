---
title: CSS 变量的暗色主题：一次切换，全站生效
date: 2026-09-22
summary: 不用预处理器，也不生成两份 CSS。用一层设计令牌把颜色收口，主题切换就退化成了一个属性的事。
tags: [CSS, 主题, 设计令牌]
---

## 常见做法有什么问题

给站点加暗色主题，网上最常见的写法是在 `html` 上加一个类，然后把每个用到颜色的选择器重写一遍：

```css
.card { background: #fff; color: #0f172a; }
html.dark .card { background: #131a2e; color: #e6ebf5; }
```

页面小的时候没问题。选择器一多，就必然出现两种事故：新写的组件忘了补 `.dark` 分支，于是暗色下白得刺眼；或者补的时候颜色抄错了一位，跟旁边的不一致。

## 换一层：先定义令牌

把所有会用到的颜色收进一组 CSS 变量，只在这个文件里出现具体色值：

```css
:root {
  --bg: #ffffff;
  --surface: #f8fafc;
  --border: #e2e8f0;
  --text: #0f172a;
  --text-muted: #64748b;
  --accent: #4f46e5;
}

html[data-theme='dark'] {
  --bg: #0b1020;
  --surface: #131a2e;
  --border: #24304a;
  --text: #e6ebf5;
  --text-muted: #8b98b3;
  --accent: #818cf8;
}
```

组件里一律引用变量，绝不写死色值：

```css
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
}
```

这样切换主题不涉及任何选择器重写，只是同名变量被换了一组值——**浏览器自己会把所有引用重新算一遍**。

## 顺手解决的三件事

### 变量名本身成了设计约束

写下 `--text-muted` 的时候，你被迫回答「这个灰是用来表达次要信息的，还是用来当边框的」。这两件事一旦分开，配色就很难乱。

### 间距和圆角也一起收进去

既然已经开了这个口子，把 `--space-1` 到 `--space-6`、`--radius-card`、`--content-width` 全放进去。之后调整体密度只需改几个数，不用满项目替换 `padding`。

### 主题切换变成三行

```js
function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  document.documentElement.dataset.theme = theme.value
  localStorage.setItem('theme', theme.value)
}
```

## 第一帧白闪怎么处理

纯前端切主题一定会闪：HTML 已经渲染，JS 还没执行，这一帧用的是默认亮色。

解法是把这个判断塞进 `<head>` 里的内联脚本——它在解析 HTML 时同步执行，早于首次绘制：

```html
<script>
  (function () {
    try {
      var saved = localStorage.getItem('theme')
      var dark = saved === 'dark' ||
        (!saved && matchMedia('(prefers-color-scheme: dark)').matches)
      if (dark) document.documentElement.dataset.theme = 'dark'
    } catch (e) {}
  })()
</script>
```

`try/catch` 不是多余的：某些浏览器的隐私模式下，访问 `localStorage` 会直接抛错，不包起来整个页面的脚本都会被带崩。

## 需要注意的边界

- **内联 SVG 的图标要跟着变色。** 用 `currentColor` 填充，颜色就会跟着文字颜色走，不用额外定义一套。
- **代码高亮主题要单独处理。** highlight.js 的主题是写死的色值，不认你的变量。这里直接固定用深色主题，让代码块在亮暗两种模式下都保持深底，反而更统一。
- **过渡别加在根元素上。** 给 `body` 加 `transition: background-color .2s` 就够了；加在 `html` 上有时会让主题切换看起来像整页抖动。

## 小结

用 CSS 变量做主题，核心不是省代码，而是**把「色值」和「语义」分开**。色值只出现在令牌定义里，组件只知道 `--surface`。真到了要调色的时候，你会庆幸自己当初多写了那十几行。
