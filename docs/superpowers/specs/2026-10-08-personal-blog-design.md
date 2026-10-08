# 个人博客网站 · 设计文档

- 日期：2026-10-08
- 状态：已评审通过。技术栈经用户确认，由「手写 HTML/CSS/JS 静态站」变更为「Vite + Vue 3 组件化单页应用」
- 项目根（约定）：本文件所在目录上溯 4 级，即 `blog/`

---

## 1. 背景与目标

用户需要一个个人博客网站，定位为**作品集混合型**：首页同时承载个人介绍、项目作品与文章列表。使用者具备编程能力，拥有 GitHub 账号，**没有自有域名和服务器**，托管走 GitHub Pages 免费方案。

内容规模预期为**十几篇、偶尔更新**。核心诉求从"零构建"调整为**"便于后续修改"**，因此采用 Vue 组件化。

成功标准：

1. 首页能一眼看清"我是谁、我做过什么、我写了什么"。
2. **新增一篇文章 = 只新建一个 `.md` 文件**，不修改任何其他文件。
3. **修改导航、页脚、卡片样式 = 只改一个组件**，全站生效。
4. 部署在 GitHub Pages 上，无需服务器与域名。
5. 手机、平板、桌面三档宽度均可正常阅读与操作。

## 2. 技术选型

| 项 | 选择 | 理由 |
|---|---|---|
| 框架 | Vue 3（组合式 API，`<script setup>`） | 组件化，改动单点化 |
| 构建 | Vite 5 + `@vitejs/plugin-vue` | 官方标配，启动与构建都快 |
| 路由 | vue-router 4，**hash 模式** | GitHub Pages 无服务端 rewrite，hash 是唯一不需要 hack 的方案 |
| 内容 | Markdown + `import.meta.glob` 批量导入 | 加 `.md` 即自动成篇，消灭手动维护列表 |
| Markdown 渲染 | markdown-it | 轻、可插拔、能拿到 token 流用于生成 TOC |
| 代码高亮 | highlight.js | 与 markdown-it 一行接上 |
| 语言 | JavaScript（不用 TypeScript） | 个人站，减少心智负担 |
| 样式 | 手写 CSS + CSS 变量 | 视觉令牌完全可控，不引入 UI 库 |

**依赖清单（共 6 个包）**

- dependencies：`vue`、`vue-router`、`markdown-it`、`highlight.js`
- devDependencies：`vite`、`@vitejs/plugin-vue`

## 3. 范围

### 做

Vue 3 组件化单页应用；hash 路由；Markdown 驱动文章与项目内容；暗色/亮色切换；代码高亮；文章目录 TOC；作品区；关于我；404；响应式；GitHub Actions 自动部署。

### 不做（明确排除）

SSR / SSG（Nuxt、VitePress 等）、CMS、站内搜索、评论、访问统计、多语言、标签系统、文章分页、TypeScript、Pinia、UI 组件库、单元测试。

排除理由：内容量十几篇时，浏览器 Ctrl+F 可替代搜索；读者规模不足以支撑评论维护成本；状态只有"主题"一项，用 composable 即可，引入 Pinia 是纯负担。

## 4. 信息架构与路由

采用 hash 模式，URL 中 `#` 之后的部分不参与服务器请求，因此刷新任意页面都不会 404，GitHub Pages 无需任何配置。

| 页面 | 路由 | 组件 |
|---|---|---|
| 首页 | `/#/` | `HomeView` |
| 作品列表 | `/#/projects` | `ProjectsView` |
| 项目详情 | `/#/projects/:slug` | `ProjectDetailView` |
| 文章列表 | `/#/posts` | `PostsView` |
| 文章 | `/#/posts/:slug` | `PostView` |
| 关于 | `/#/about` | `AboutView` |
| 404 | `/#/:pathMatch(.*)*` | `NotFoundView` |

**Demo 本体不走路由**：它是真实存在的静态目录 `/projects/<slug>/`，由 Vue 详情页上的按钮以新标签页方式打开。这与 my-music 的接入方式一致。

**slug 规则**：文章与项目均取 Markdown 文件名去掉 `.md`。文章文件名格式 `YYYY-MM-DD-<英文短横线 slug>.md`，例如 `2026-10-08-why-vue.md`。

## 5. 目录结构

```
blog/
├── index.html                     唯一入口，含防白闪内联脚本
├── package.json
├── vite.config.js                 base: '/'，plugins: [vue()]
├── .gitignore                     node_modules / dist
├── .github/
│   └── workflows/deploy.yml       push main 自动构建并部署
├── public/                        原样拷贝，不经 Vite 处理
│   ├── 404.html                   兜底：跳到 /#/
│   └── projects/
│       └── my-music/              my-music 构建产物
└── src/
    ├── main.js                    挂载 App、注册 router
    ├── App.vue                    SiteNav + RouterView + SiteFooter
    ├── router/index.js            集中式路由表
    ├── styles/
    │   ├── tokens.css             设计令牌（亮/暗两套）
    │   └── base.css               重置、排版、通用工具类
    ├── components/
    │   ├── SiteNav.vue
    │   ├── SiteFooter.vue
    │   ├── ThemeToggle.vue
    │   ├── ProjectCard.vue
    │   ├── PostListItem.vue
    │   ├── TechTag.vue
    │   ├── ArticleBody.vue
    │   ├── ArticleToc.vue
    │   └── BackToTop.vue
    ├── views/
    │   ├── HomeView.vue
    │   ├── ProjectsView.vue
    │   ├── ProjectDetailView.vue
    │   ├── PostsView.vue
    │   ├── PostView.vue
    │   ├── AboutView.vue
    │   └── NotFoundView.vue
    ├── composables/
    │   ├── useTheme.js            主题单例
    │   ├── useMarkdown.js         渲染 + TOC + 阅读时长
    │   ├── usePosts.js            文章收集与查询
    │   └── useProjects.js         项目收集与查询
    └── content/
        ├── posts/                 每篇一个 .md
        └── projects/              每个项目一个 .md
```

## 6. 视觉设计

风格方向：现代科技。白底 + 单一高饱和强调色 + 圆角卡片 + 柔和阴影。

### 设计令牌（`src/styles/tokens.css`）

| 令牌 | 亮色 | 暗色 |
|---|---|---|
| 页面底色 | `#ffffff` | `#0b1020` |
| 卡片/浮层底色 | `#f8fafc` | `#131a2e` |
| 描边 | `#e2e8f0` | `#24304a` |
| 主文字 | `#0f172a` | `#e6ebf5` |
| 次文字 | `#64748b` | `#8b98b3` |
| 强调色 | `#4f46e5` | `#818cf8` |
| 强调色底色 | `#eef2ff` | `#1e1b4b` |
| 代码块底 | `#0b1020` | `#0b1020` |

全部以 CSS 自定义属性定义在 `:root`，暗色通过 `html[data-theme="dark"]` 覆盖同名变量。组件一律引用变量，不写死颜色。

### 尺度

- 圆角：卡片 10px、按钮 8px、标签 999px
- 间距阶梯：4 / 8 / 12 / 16 / 24 / 40 px
- 正文：16px（≤480px 时 15px），行高 1.75
- 容器宽：正文页 720px，列表页 1080px，页面左右留白 ≥20px
- 字体：`system-ui, -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif`；代码用 `ui-monospace, Consolas, monospace`。不引入 web font。

## 7. 内容数据层

这是引入构建工具后最大的收益点，把"手动维护列表"彻底消灭。

### 6.1 文章 `src/content/posts/*.md`

frontmatter 字段：`title`（必填）、`date`（必填，`YYYY-MM-DD`）、`summary`（选填，用于列表摘要）、`tags`（选填，字符串数组）。

收集方式：

```js
const modules = import.meta.glob('../content/posts/*.md', { query: '?raw', import: 'default', eager: true })
```

`usePosts.js` 对外导出：

- `posts`：全部文章，按 `date` 倒序
- `latestPosts(n)`：最新 n 篇，供首页使用
- `getPost(slug)`：单篇，返回 `{ meta, html, toc, readingMinutes }`

### 6.2 项目 `src/content/projects/*.md`

frontmatter 字段：`title`、`summary`、`tech`（字符串数组）、`cover`（图片路径，选填）、`demo`（Demo 链接，选填）、`repo`（仓库链接，选填）、`order`（首页精选排序，选填，数字小者靠前）。

`useProjects.js` 导出 `projects`、`featuredProjects(n)`、`getProject(slug)`。

封面图缺失时，`ProjectCard` 退化为 CSS 渐变色块，不出现破图。Demo 与仓库链接缺失时，对应按钮不渲染，不产生死链。

### 6.3 Markdown 渲染 `useMarkdown.js`

- `markdown-it` 配置：`html: true`、`linkify: true`、`typographer: false`
- 代码高亮：把 highlight.js 接到 markdown-it 的 `highlight` 选项
- **TOC 生成**：遍历 markdown-it 的 token 流，收集 `h2` / `h3`，取其文本并生成 `id` 写回 attrs，同时产出 `[{ level, text, id }]` 数组。这样锚点与文章正文天然对得上。
- **阅读时长**：统计正文字符数，按每 400 字 1 分钟估算，向上取整，最少 1 分钟。

## 8. 组件职责

| 组件 | 职责 |
|---|---|
| `App.vue` | 布局骨架：导航 / 路由出口 / 页脚，Nav 与 Footer 全站只此一处 |
| `SiteNav.vue` | 站点名 + 三个 `RouterLink` + `ThemeToggle`；当前路由自动高亮 |
| `SiteFooter.vue` | 版权行（年份自动填充）+ GitHub 链接 |
| `ThemeToggle.vue` | 明暗切换按钮，调用 `useTheme` |
| `ProjectCard.vue` | 作品卡片：封面 / 名称 / 一句话 / 技术标签 |
| `PostListItem.vue` | 文章列表行：标题（整行可点）+ 日期 |
| `TechTag.vue` | 技术标签小胶囊 |
| `ArticleBody.vue` | 渲染 Markdown 产出的 HTML，并为代码块挂高亮 |
| `ArticleToc.vue` | 目录：≥900px 固定右栏；<900px 折叠到正文顶部 |
| `BackToTop.vue` | 回到顶部，滚动超过一屏后出现 |

## 9. 主题机制

`useTheme.js` 是一个模块级单例 composable：内部 `ref` 保存 `'light' | 'dark'`，读写 `localStorage.theme`，并同步到 `document.documentElement.dataset.theme`。无记录时跟随 `prefers-color-scheme`。

**防白闪**：`index.html` 的 `<head>` 内、所有 CSS 之前放约 4 行内联脚本，执行同一段读取逻辑。这是为了暗色用户刷新时不出现白屏闪烁，是 Vue 应用里唯一必须内联的脚本。

## 10. 页面规格

### 10.1 首页 `/#/`

导航 → Hero → 精选作品 → 最新文章 → 页脚。

- Hero：主标题「写代码，也写字。」，副标题「全栈工程师。这里放我做过的东西，和一些想清楚了的废话。」，两个按钮「看作品」「读文章」。文案后续由用户自行替换。
- 精选作品：取 `featuredProjects(3)`，不足 3 个时补一张虚线占位卡「+ 以后再加」。
- 最新文章：取 `latestPosts(5)`，右下角「全部文章 →」。

### 10.2 作品列表 `/#/projects`

标题与一句说明 → `ProjectCard` 网格 → 页脚。桌面 2 列，<760px 时 1 列。

### 10.3 项目详情 `/#/projects/:slug`

标题 → 技术标签 → 封面截图 → 两个按钮（「在线体验 →」新标签打开 `/projects/<slug>/`；「源码 ↗」新标签打开仓库）→ 正文三段（项目背景 / 做了什么 / 难点与取舍）→ 依赖声明。

**依赖声明必填于 my-music**：Demo 依赖第三方公开接口，若无法打开多半是接口失效。

### 10.4 文章列表 `/#/posts`

按年份分组的时间倒序列表，每行一个 `PostListItem`。不做分页、不做标签过滤。

### 10.5 文章 `/#/posts/:slug`

两栏：左栏标题 / 日期 / 阅读时长 / 正文（`ArticleBody`），右栏 `ArticleToc`。文章不存在时渲染 `NotFoundView` 的等价内容。

### 10.6 关于 `/#/about`

头像 + 姓名 + 一句话身份 → 若干段简介 → 链接：GitHub、邮箱、简历 PDF（放 `public/resume.pdf`；未提供时该按钮不渲染）。

### 10.7 404 `/#/:pathMatch(.*)*`

大字 `404` → 说明一句「可能链接写错了，也可能我删了。」→「回首页」按钮。

`public/404.html` 另作兜底：访问到非 hash 的不存在路径时，跳回 `/#/`。

## 11. 维护流程

**新增一篇文章**：在 `src/content/posts/` 新建 `YYYY-MM-DD-slug.md`，写好 frontmatter 与正文。**完成。** 文章列表、首页最新、年份分组、TOC、阅读时长全部自动生成。

**新增一个项目**：在 `src/content/projects/` 新建 `slug.md`；若有 Demo，把构建产物放进 `public/projects/slug/`。完成。

**改导航或页脚**：只改 `SiteNav.vue` / `SiteFooter.vue`。

**改整体配色**：只改 `tokens.css` 里的变量。

## 12. 部署

- **仓库命名**：`<username>.github.io`。站点根路径为 `/`，`vite.config.js` 中 `base: '/'`。若改用 `blog` 这类项目仓库，根路径变为 `/blog/`，`base` 需同步改为 `'/blog/'`，其余不变。
- **本地开发**：`npm install` → `npm run dev`，浏览器访问本地地址。
- **本地预览构建产物**：`npm run build` → `npm run preview`。
- **CI 部署**：`.github/workflows/deploy.yml`，触发条件为 push 到 `main`；步骤为 `npm ci` → `npm run build` → `actions/upload-pages-artifact` → `actions/deploy-pages`。仓库 Settings → Pages → Source 选 `GitHub Actions`。
- **首次上线**：`git init` → 提交 → GitHub 新建 public 仓库 `<username>.github.io` → `git remote add origin` → `git push -u origin main` → 等待 Actions 跑完 → 访问 `https://<username>.github.io/`。
- **`<username>` 为部署时由用户提供的 GitHub 用户名**，是本设计唯一外部输入项。

### my-music 接入的硬性要求

1. my-music 的 `vite.config.js` 中设 `base: './'`（相对模式）。这样产物既能在本地 `file://` 下预览，也能正确部署在 `/projects/my-music/` 子目录。
2. my-music 内部不得使用 history 路由的深链——GitHub Pages 没有服务端 rewrite，刷新即 404。必须用 hash 路由或单页无路由。
3. 构建后把 `dist/` 的**全部内容**拷进 `public/projects/my-music/`，覆盖旧内容。Vite 会把它原样拷贝进最终产物，不需要任何额外配置。
4. Demo 依赖网易云公开接口，属外部依赖，可能失效。详情页必须保留第 10.3 节的提示。

## 13. 降级与错误处理

| 场景 | 表现 |
|---|---|
| 访客禁用 JS | 页面无法渲染（SPA 的固有代价，已列入第 14 节）。`index.html` 内加 `<noscript>` 提示 |
| 文章 slug 不存在 | 渲染 404 视图，不白屏 |
| 封面图缺失 | 卡片退化为 CSS 渐变色块；正文图片用 `alt` 文字兜底 |
| 第三方接口失效 | Demo 页面变为空壳，详情页的提示文字已提前说明 |
| 非 hash 的不存在路径 | 由 `public/404.html` 跳回 `/#/` |

## 14. 已接受的代价

相比原手写静态方案，本次技术栈变更带来三项代价，均已确认接受：

1. **多一个构建步骤**：本地改动后需要 `npm run dev` 预览，不再能双击 HTML 直接看；上线依赖构建产物。
2. **无 JS 不可用**：SPA 无法做渐进增强，这是哈希路由方案的固有属性。
3. **首屏体积增加约 30KB**（gzip 后 Vue runtime 量级），对个人站点的加载体验影响可忽略。

换来的是：改动单点化、内容与展示解耦、文章列表自动化。

## 15. 验收清单

1. `npm install` 与 `npm run build` 均无报错
2. `npm run dev` 下七个路由逐一可达，浏览器控制台无报错
3. `npm run preview` 下（即构建产物）同样全部可达
4. 375 / 768 / 1440 三档宽度下均无横向滚动条
5. 暗色切换生效、刷新后保持，且刷新瞬间不出现白屏闪烁
6. 文章页 TOC 锚点跳转准确，滚动时高亮跟随；<900px 时目录折叠可用
7. 代码块有高亮、可横向滚动，不撑破布局
8. 首页 → 作品列表 → 项目详情 → 在线 Demo 的链路全部可达
9. 新增一个 `.md` 文件后，文章列表与首页最新文章自动出现该篇，无需改动其他文件
10. 直接刷新 `/#/posts/<slug>` 不出现 404
11. 部署到 GitHub Pages 后，站点根路径为 `/` 的形态下所有资源与路由正确
