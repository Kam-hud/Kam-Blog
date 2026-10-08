import { parseFrontmatter, renderMarkdown } from './useMarkdown'

/**
 * 项目数据层。与文章同源：每个项目一个 .md，构建时自动收集。
 * Demo 本体（public/projects/<slug>/）不经过这里，它是真实存在的静态目录。
 */

const modules = import.meta.glob('../content/projects/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

function slugFromPath(path) {
  return path.split('/').pop().replace(/\.md$/, '')
}

function toOrder(value) {
  if (value === undefined || value === '') return undefined
  const num = Number(value)
  return Number.isNaN(num) ? undefined : num
}

const collected = Object.entries(modules).map(([path, raw]) => {
  const { data } = parseFrontmatter(raw)
  const slug = slugFromPath(path)
  return {
    slug,
    raw,
    title: data.title || slug,
    summary: data.summary || '',
    tech: Array.isArray(data.tech) ? data.tech : [],
    cover: data.cover || '',
    demo: data.demo || '',
    repo: data.repo || '',
    notice: data.notice || '',
    order: toOrder(data.order),
  }
})

/** 列表页顺序：先按 order 升序，未标 order 的排在后面，其次按标题 */
export const projects = collected.slice().sort((a, b) => {
  const ao = a.order === undefined ? Number.POSITIVE_INFINITY : a.order
  const bo = b.order === undefined ? Number.POSITIVE_INFINITY : b.order
  if (ao !== bo) return ao - bo
  return a.title.localeCompare(b.title, 'zh-Hans-CN')
})

/** 首页精选：只取标了 order 的项目，数字小者靠前 */
export function featuredProjects(n = 3) {
  return projects.filter((item) => item.order !== undefined).slice(0, n)
}

/** 单项目：返回 { ...meta, html }；不存在返回 null */
export function getProject(slug) {
  const project = projects.find((item) => item.slug === slug)
  if (!project) return null

  const { body } = parseFrontmatter(project.raw)
  const { html } = renderMarkdown(body)

  return { ...project, html }
}

/** 封面缺失时的兜底：由 slug 派生一个稳定的渐变色，避免出现破图 */
export function coverGradient(slug) {
  let hue = 0
  for (const ch of String(slug)) {
    hue = (hue * 31 + ch.charCodeAt(0)) % 360
  }
  return `linear-gradient(135deg, hsl(${hue} 68% 56%), hsl(${(hue + 42) % 360} 68% 44%))`
}
