# 个人博客

作品集混合型个人博客（技术为主 + 随笔）。Vue 3 + Vite 单页应用，hash 路由，Markdown 驱动内容，部署在 GitHub Pages。

设计文档见 [docs/superpowers/specs/2026-10-08-personal-blog-design.md](docs/superpowers/specs/2026-10-08-personal-blog-design.md)。

## 快速开始

```bash
npm install
npm run dev      # 本地开发
npm run build    # 构建到 dist/
npm run preview  # 预览构建产物
```

## 技术栈

Vue 3（组合式 API + `<script setup>`）、Vite 5、vue-router 4（hash 模式）、markdown-it、highlight.js。样式为手写 CSS + CSS 变量，不引入 UI 库、不使用 TypeScript、不使用 Pinia。

## 日常维护

| 要做的事 | 改动位置 |
| --- | --- |
| 发一篇文章 | 在 `src/content/posts/` 新建 `YYYY-MM-DD-slug.md` |
| 加一个项目 | 在 `src/content/projects/` 新建 `slug.md` |
| 改导航 / 页脚 | `src/components/SiteNav.vue` / `SiteFooter.vue` |
| 改整体配色 | `src/styles/tokens.css` |
| 改站点名等占位信息 | `src/config.js` |

新增 `.md` 后无需改动任何其他文件：文章列表、首页最新文章、年份分组、目录（TOC）、阅读时长全部自动生成。

### 文章 frontmatter

```yaml
---
title: 文章标题          # 必填
date: 2026-10-08        # 必填，YYYY-MM-DD
summary: 一句话摘要      # 选填，用于列表
tags: [前端, Vue]        # 选填
---
```

### 项目 frontmatter

```yaml
---
title: 项目名
summary: 一句话介绍
tech: [Vue 3, Vite]     # 技术标签
cover: /covers/xx.png   # 选填，缺失时卡片退化为渐变色块
demo: /projects/xx/     # 选填，缺失时不渲染按钮
repo: https://github.com/...  # 选填
order: 1                # 选填，首页精选排序，数字小者靠前
---
```

## 占位项（上线前需替换）

1. **站点名**：`src/config.js` 的 `site.name`（当前为「站点名待定」）。导航、页脚、浏览器标签标题都从这一处读，改一行即全站生效。
2. `src/config.js` 中的 `githubUser`、`aboutName`、`aboutHeadline`、`email`、`avatar`、`resume`。
3. `index.html` 与 `public/404.html` 里的 `<title>` 占位文本。
4. `src/config.js` 中的 Hero 文案（`heroTitle` / `heroSubtitle`）。

## my-music 子站

`public/projects/my-music/` 目前是**占位页**。my-music 构建完成后，把它的 `dist/` 全部内容拷贝到该目录覆盖即可，Vite 会原样复制进构建产物，本站代码无需改动。

对 my-music 侧的要求：

1. `vite.config.js` 设 `base: './'`；
2. 使用 hash 路由或单页无路由，不要用 history 深链。

## 部署

仓库命名为 `<username>.github.io` 时站点根路径为 `/`，与当前 `vite.config.js` 的 `base: '/'` 一致。若改用 `blog` 这类项目仓库，根路径变为 `/blog/`，需把 `base` 同步改为 `'/blog/'`。

```bash
git init
git add .
git commit -m "Initial commit: personal blog"
git remote add origin <仓库地址>
git push -u origin main
```

推送到 `main` 后由 `.github/workflows/deploy.yml` 自动构建并部署。仓库 Settings → Pages → Source 选择 `GitHub Actions`。
