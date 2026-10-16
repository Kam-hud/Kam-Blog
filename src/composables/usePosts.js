import { parseFrontmatter, renderMarkdown } from './useMarkdown'

/**
 * 文章数据层。
 * 靠 import.meta.glob 在构建时把所有 .md 收进一个模块表，
 * 因此"新增一篇文章 = 新建一个 .md 文件"，列表 / 首页最新 / 年份分组全部自动生成。
 */

const modules = import.meta.glob('../content/posts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

function slugFromPath(path) {
  return path.split('/').pop().replace(/\.md$/, '')
}

const collected = Object.entries(modules).map(([path, raw]) => {
  const { data, body } = parseFrontmatter(raw)
  const slug = slugFromPath(path)
  return {
    slug,
    raw,
    title: data.title || slug,
    date: data.date || '',
    summary: data.summary || '',
    excerpt: makeExcerpt(body),
    readingMinutes: estimateReadingMinutes(body),
    tags: Array.isArray(data.tags) ? data.tags : [],
  }
})

/** 全部文章，按日期倒序（date 为 YYYY-MM-DD，字典序即时间序） */
export const posts = collected.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

/** 全部标签：去重后按出现次数降序（次数相同按名称升序），供筛选 chips 使用 */
export const allTags = (() => {
  const counts = new Map()
  posts.forEach((post) => {
    post.tags.forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1))
  })
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
    .map(([tag]) => tag)
})()

/** 最新 n 篇，供首页使用 */
export function latestPosts(n = 5) {
  return posts.slice(0, n)
}

/** 按年份分组，供文章列表页使用；年份倒序，组内时间倒序。可传入已过滤的列表 */
export function postsByYear(source = posts) {
  const groups = new Map()
  source.forEach((post) => {
    const year = (post.date || '').slice(0, 4) || '未标注年份'
    if (!groups.has(year)) groups.set(year, [])
    groups.get(year).push(post)
  })
  return Array.from(groups, ([year, list]) => ({ year, posts: list }))
}

/** 摘要兜底：剥掉常见 Markdown 标记，取正文前 90 字 */
function makeExcerpt(body) {
  const text = String(body)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > 90 ? `${text.slice(0, 90)}…` : text
}

/** 阅读时长：正文非空白字符数，每 400 字 1 分钟，向上取整，最少 1 分钟 */
function estimateReadingMinutes(text) {
  const count = String(text).replace(/\s+/g, '').length
  return Math.max(1, Math.ceil(count / 400))
}

/** 按标签关键词匹配文章：任一关键词命中 tags 即入选（如生活分享匹配 ['随笔','生活']） */
export function postsByTags(keywords = [], limit = Infinity) {
  if (!Array.isArray(keywords) || keywords.length === 0) return []
  const set = new Set(keywords.map((k) => String(k).trim()).filter(Boolean))
  if (set.size === 0) return []
  const matched = posts.filter((post) => post.tags.some((tag) => set.has(tag)))
  return limit === Infinity ? matched : matched.slice(0, limit)
}

/** 单篇：返回 { ...meta, html, toc, readingMinutes }；不存在返回 null */
export function getPost(slug) {
  const post = posts.find((item) => item.slug === slug)
  if (!post) return null

  const { body } = parseFrontmatter(post.raw)
  const { html, toc } = renderMarkdown(body)

  return {
    ...post,
    html,
    toc,
    readingMinutes: estimateReadingMinutes(body),
  }
}
