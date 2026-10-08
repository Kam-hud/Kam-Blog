import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js/lib/common'

/**
 * Markdown 渲染：渲染 + TOC 生成。
 * 只用 markdown-it 公共语言包（highlight.js/lib/common），够用且体积可控。
 */

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: false,
  highlight(code, lang) {
    const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext'
    let inner
    try {
      inner = hljs.highlight(code, { language, ignoreIllegals: true }).value
    } catch (e) {
      inner = escapeHtml(code)
    }
    const langClass = lang ? ` language-${escapeHtml(lang)}` : ''
    // 返回值以 <pre 开头时，markdown-it 会原样采用，不再二次包裹
    return `<pre class="code-block"><code class="hljs${langClass}">${inner}</code></pre>`
  },
})

/**
 * 极简 frontmatter 解析：只支持 `key: value`、`key: [a, b]` 两种形式，
 * 以及值和键两侧的引号。够本站使用，不额外引入依赖。
 */
export function parseFrontmatter(raw) {
  const text = String(raw).replace(/^\uFEFF/, '')
  const matched = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text)
  if (!matched) return { data: {}, body: text }

  const data = {}
  matched[1].split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const idx = trimmed.indexOf(':')
    if (idx === -1) return
    const key = trimmed.slice(0, idx).trim()
    if (!key) return
    let value = trimmed.slice(idx + 1).trim()
    if (/^\[[\s\S]*\]$/.test(value)) {
      data[key] = value
        .slice(1, -1)
        .split(',')
        .map((item) => unquote(item.trim()))
        .filter(Boolean)
    } else {
      data[key] = unquote(value)
    }
  })

  return { data, body: text.slice(matched[0].length) }
}

function unquote(value) {
  if (value.length >= 2) {
    const first = value[0]
    const last = value[value.length - 1]
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return value.slice(1, -1)
    }
  }
  return value
}

/** 由标题文本生成锚点 id；中文保留，其余非字母数字一律去掉 */
function slugify(text) {
  const slug = String(text)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '')
  return slug || 'section'
}

/**
 * 渲染正文，并顺带产出 TOC。
 * 直接操作 markdown-it 的 token 流：给 h2/h3 补 id 再渲染，
 * 这样目录里的锚点和正文里的 id 天然一致，不会对不上。
 *
 * @returns {{ html: string, toc: Array<{ level: number, text: string, id: string }> }}
 */
export function renderMarkdown(source) {
  const tokens = md.parse(source, {})
  const toc = []
  const used = new Set()

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i]
    if (token.type !== 'heading_open') continue

    const level = Number(token.tag.slice(1))
    if (level !== 2 && level !== 3) continue

    const inline = tokens[i + 1]
    const text = inline && inline.type === 'inline' ? inline.content : ''

    const base = slugify(text)
    let id = base
    let n = 2
    while (used.has(id)) {
      id = `${base}-${n}`
      n += 1
    }
    used.add(id)

    token.attrSet('id', id)
    toc.push({ level, text, id })
  }

  const html = md.renderer.render(tokens, md.options, {})
  return { html, toc }
}
