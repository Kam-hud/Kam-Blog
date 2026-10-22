/**
 * Vercel Serverless 函数：写文章发布代理。
 * 接收前端 POST JSON { title, slug, tags, summary, body, password }，
 * 校验后组装 frontmatter，通过 GitHub Contents API 写入
 * Kam-hud/Kam-Blog 仓库 src/content/posts/{slug}.md（branch: main）。
 *
 * 发布链路可靠性：
 *   - 先 GET 目标文件读取当前 sha（404=新建、200=更新），PUT 携带 sha 防止 422 "sha wasn't supplied"
 *   - 错误细分类：401 / 403 / 404 / 409 / 422 返回可读中文错误并附 hint
 *   - summary 可选：前端传入则使用，否则自动摘要
 *
 * 部署后在 Vercel 环境变量配置：
 *   GITHUB_TOKEN   — GitHub Personal Access Token（需 contents:write 权限）
 *   POST_PASSWORD  — 发布密码；未配置则跳过密码校验（返回提示）
 */

const REPO = 'Kam-hud/Kam-Blog'
const BRANCH = 'main'
const BASE_PATH = 'src/content/posts'
const API_BASE = `https://api.github.com/repos/${REPO}/contents/${BASE_PATH}`

export default async function handler(req, res) {
  // 简单 CORS：允许本站与开发环境调用
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method Not Allowed' })
    return
  }

  let payload = {}
  try {
    payload = JSON.parse(req.body || '{}')
  } catch (_) {
    res.status(400).json({ ok: false, error: '请求体不是合法 JSON' })
    return
  }

  const { title, slug, tags, summary, body, password } = payload
  const titleText = String(title || '').trim()
  const slugText = String(slug || '').trim()
  const bodyText = String(body || '')

  // 长度限制（50KB）
  if (bodyText.length > 51200) {
    res.status(413).json({ ok: false, error: '正文超过 50KB 限制' })
    return
  }
  if (!titleText) {
    res.status(400).json({ ok: false, error: '标题不能为空' })
    return
  }
  if (!slugText || !/^[a-z0-9][a-z0-9-]*$/i.test(slugText)) {
    res.status(400).json({ ok: false, error: 'slug 仅允许字母、数字、连字符且不能为空' })
    return
  }
  if (!bodyText) {
    res.status(400).json({ ok: false, error: '正文不能为空' })
    return
  }

  // 密码校验：POST_PASSWORD 未配置则跳过并提示
  const hint = []
  const expected = process.env.POST_PASSWORD
  if (expected) {
    if (password !== expected) {
      res.status(403).json({ ok: false, error: '发布密码错误' })
      return
    }
  } else {
    hint.push('POST_PASSWORD 未配置，本次跳过密码校验')
  }

  // 组装 frontmatter（summary：前端传入优先，否则自动摘要兜底）
  const date = new Date().toISOString().slice(0, 10)
  const tagList = Array.isArray(tags)
    ? tags
        .map((t) => String(t).trim())
        .filter(Boolean)
        .slice(0, 10)
    : []
  const tagLine = `tags: [${tagList.map((t) => `"${t}"`).join(', ')}]`
  const summaryText =
    typeof summary === 'string' && summary.trim() ? summary.trim() : makeSummary(bodyText) || titleText
  const esc = (s) => String(s).replace(/"/g, '\\"')
  const md = `---\ntitle: "${esc(titleText)}"\ndate: ${date}\n${tagLine}\nsummary: "${esc(summaryText)}"\n---\n\n${bodyText}`

  // GitHub Contents API
  const token = process.env.GITHUB_TOKEN
  if (!token) {
    res.status(500).json({ ok: false, error: '服务器未配置 GITHUB_TOKEN，无法写入仓库', hint: hint.join('；') })
    return
  }

  const filePath = `${BASE_PATH}/${slugText}.md`
  const apiUrl = `${API_BASE}/${encodeURIComponent(slugText)}.md`
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'User-Agent': 'Kam-Blog',
  }

  try {
    // ① GET 前置：读取目标文件当前 sha（404=新建，200=更新）
    let existingSha = null
    const getRes = await fetch(apiUrl, { method: 'GET', headers })
    if (getRes.status === 200) {
      const getData = await getRes.json().catch(() => null)
      existingSha = getData && getData.sha ? getData.sha : null
    } else if (getRes.status !== 404) {
      const getData = await getRes.json().catch(() => null)
      const msg = getData && getData.message ? getData.message : ''
      res.status(502).json({ ok: false, error: classifyGithubError(getRes.status, msg), hint: hint.join('；') })
      return
    }

    // ② PUT 写入（更新场景携带 sha，防止 422）
    const putBody = {
      message: `post: ${titleText}`,
      content: Buffer.from(md, 'utf8').toString('base64'),
      branch: BRANCH,
    }
    if (existingSha) putBody.sha = existingSha

    const putRes = await fetch(apiUrl, { method: 'PUT', headers, body: JSON.stringify(putBody) })
    const putData = await putRes.json().catch(() => null)
    if (!putRes.ok) {
      const msg = putData && putData.message ? putData.message : ''
      res.status(502).json({ ok: false, error: classifyGithubError(putRes.status, msg), hint: hint.join('；') })
      return
    }

    // ③ 成功：返回 commit sha / file / html_url
    const commit = putData && putData.commit ? putData.commit : {}
    const content = putData && putData.content ? putData.content : {}
    res.status(200).json({
      ok: true,
      commit: commit.sha || '',
      file: filePath,
      html_url: content.html_url || commit.html_url || '',
      hint: hint.join('；'),
    })
  } catch (err) {
    res.status(502).json({
      ok: false,
      error: `调用 GitHub API 失败：${err && err.message ? err.message : err}`,
      hint: hint.join('；'),
    })
  }
}

/** GitHub Contents API 错误细分类：返回可读中文错误 */
function classifyGithubError(status, message) {
  const map = {
    401: 'GitHub 认证失败：GITHUB_TOKEN 无效或已过期',
    403: 'GitHub 权限不足或触发限流：请确认 token 具有 contents:write 权限',
    404: 'GitHub 仓库或路径不存在：请确认仓库 Kam-hud/Kam-Blog 与路径 src/content/posts/ 正确',
    409: 'GitHub 分支冲突：main 分支与远端不一致，请稍后重试',
    422: 'GitHub 内容冲突：文件已变更或 sha 未提供（本函数已自动读取最新 sha，重试通常可解决）',
  }
  const base = map[status] || `GitHub API 返回 ${status}`
  return message ? `${base}（${message}）` : base
}

/** 摘要兜底：剥掉常见 Markdown 标记，取正文前 90 字（与前端 usePosts 保持一致） */
function makeSummary(text) {
  const t = String(text || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return t.length > 90 ? `${t.slice(0, 90)}…` : t
}
