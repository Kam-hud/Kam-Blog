/**
 * 站点静态数据生成器（构建期运行，由 vite.config.js 的 siteDataPlugin 调用）。
 *
 * 产出（写入构建输出目录，默认 dist）：
 *   - search-index.json：站内搜索前端索引（slug / title / date / summary / tags / excerpt）
 *   - feed.xml：Atom 订阅源（title / link / updated / summary / category / 文章条目）
 *
 * 也可独立运行：node scripts/generate-site-data.mjs <outDir>
 * dev 模式由 siteDataPlugin 的 configureServer 中间件实时提供两份数据，保证本地预览可用。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const POSTS_DIR = path.join(ROOT, 'src', 'content', 'posts')
const SITE_URL = 'https://kam-hud.github.io/Kam-Blog/'
const SITE_NAME = 'Kam-Blog'
const SITE_DESC = '个人博客：做过的东西，和想清楚了的废话。'
const SITE_AUTHOR = 'Kam-hud'

/** 极简 frontmatter 解析：仅处理本博客用到的标量（title/date/summary）与行内数组（tags） */
function parseFrontmatter(raw) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw)
  const data = {}
  if (!match) return { data, body: raw }
  const lineRe = /^([A-Za-z_][\w-]*):\s*(.*)$/gm
  let m
  while ((m = lineRe.exec(match[1]))) {
    let value = m[2].trim()
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean)
    } else {
      value = value.replace(/^['"]|['"]$/g, '')
    }
    data[m[1]] = value
  }
  const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '')
  return { data, body }
}

function slugFromPath(p) {
  return path.basename(p, '.md')
}

/** 与前端 usePosts.js 的 makeExcerpt 保持一致的摘要算法（正文前 90 字） */
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

/** 'YYYY-MM-DD' -> Atom 时间格式；缺失时用当前时间（构建期） */
function isoDate(dateStr) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? `${dateStr}T00:00:00Z` : new Date().toISOString()
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function collectPosts() {
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const raw = fs.readFileSync(path.join(POSTS_DIR, f), 'utf8')
      const { data, body } = parseFrontmatter(raw)
      const slug = slugFromPath(f)
      return {
        slug,
        title: data.title || slug,
        date: data.date || '',
        summary: data.summary || '',
        tags: Array.isArray(data.tags) ? data.tags : [],
        excerpt: makeExcerpt(body),
      }
    })
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

function buildIndex(posts) {
  return posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    date: p.date,
    summary: p.summary,
    tags: p.tags,
    excerpt: p.excerpt,
  }))
}

function buildFeed(posts) {
  const updated = isoDate(posts[0] ? posts[0].date : '')
  const entries = posts
    .map((p) => {
      const url = `${SITE_URL}#/posts/${p.slug}`
      const cats = (p.tags || [])
        .map((t) => `      <category term="${escapeXml(t)}"/>`)
        .join('\n')
      return `    <entry>
      <title>${escapeXml(p.title)}</title>
      <link href="${url}"/>
      <id>${url}</id>
      <updated>${isoDate(p.date)}</updated>
      <summary>${escapeXml(p.summary || p.excerpt)}</summary>
${cats}
    </entry>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(SITE_NAME)}</title>
  <subtitle>${escapeXml(SITE_DESC)}</subtitle>
  <link href="${SITE_URL}"/>
  <link rel="self" href="${SITE_URL}feed.xml"/>
  <id>${SITE_URL}</id>
  <updated>${updated}</updated>
  <author>
    <name>${escapeXml(SITE_AUTHOR)}</name>
  </author>
  <generator>Kam-Blog site-data build</generator>
${entries}
</feed>
`
}

export function generateSiteData(outDir = 'dist') {
  const posts = collectPosts()
  const out = path.resolve(ROOT, outDir)
  fs.mkdirSync(out, { recursive: true })
  fs.writeFileSync(path.join(out, 'search-index.json'), JSON.stringify(buildIndex(posts), null, 2), 'utf8')
  fs.writeFileSync(path.join(out, 'feed.xml'), buildFeed(posts), 'utf8')
  console.log(`[site-data] search-index.json (${posts.length} posts) + feed.xml -> ${out}`)
}

/** vite 插件：build 的 closeBundle 生成静态数据；dev 的中间件实时提供，保证本地预览 */
export function siteDataPlugin() {
  return {
    name: 'kam-blog-site-data',
    closeBundle() {
      generateSiteData()
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url || '').split('?')[0]
        if (url.endsWith('/search-index.json')) {
          const posts = collectPosts()
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify(buildIndex(posts)))
          return
        }
        if (url.endsWith('/feed.xml')) {
          const posts = collectPosts()
          res.setHeader('Content-Type', 'application/atom+xml; charset=utf-8')
          res.end(buildFeed(posts))
          return
        }
        next()
      })
    },
  }
}
