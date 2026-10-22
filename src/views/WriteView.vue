<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { renderMarkdown } from '../composables/useMarkdown'

// ---- 表单状态 ----
const title = ref('')
const tags = ref('')
const slug = ref('')
const body = ref('')
const password = ref('')

const DRAFT_KEY = 'kam-blog:write-draft'

// slug 自动生成：英文标题转 kebab-case；中文标题退化为 日期+短序号（避免引入拼音依赖库）
function autoSlug(text) {
  const ascii = String(text || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
  if (ascii) return ascii
  const d = new Date()
  const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return `${ymd}-post-${String(Date.now()).slice(-4)}`
}

// 用户手动编辑过 slug 后不再自动覆盖
const slugTouched = ref(false)
watch(title, (val) => {
  if (!slugTouched.value) slug.value = autoSlug(val)
})

// ---- 实时预览（复用站点 markdown 渲染器） ----
const previewHtml = computed(() => {
  const { html } = renderMarkdown(body.value || '')
  return html
})

// ---- 草稿自动保存 / 恢复（localStorage） ----
let saveTimer = null
let skipSave = false // 清空草稿时禁止 watch 回写
function scheduleSave() {
  if (skipSave) {
    // 清空后的短暂窗口：延后保存，确保窗口期内的输入也能最终落盘
    clearTimeout(saveTimer)
    saveTimer = setTimeout(saveDraft, 700)
    return
  }
  clearTimeout(saveTimer)
  saveTimer = setTimeout(saveDraft, 300)
}
function saveDraft() {
  try {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        title: title.value,
        tags: tags.value,
        slug: slug.value,
        body: body.value,
        password: password.value,
        savedAt: Date.now(),
      }),
    )
  } catch (_) {
    /* 存储不可用（隐私模式等）时静默跳过 */
  }
}
watch([title, tags, slug, body, password], scheduleSave)

function restoreDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return false
    const d = JSON.parse(raw)
    if (!d || (!d.title && !d.body)) return false
    title.value = d.title || ''
    tags.value = d.tags || ''
    slug.value = d.slug || ''
    body.value = d.body || ''
    password.value = d.password || ''
    if (d.slug) slugTouched.value = true
    return true
  } catch (_) {
    return false
  }
}

function clearDraft() {
  skipSave = true
  localStorage.removeItem(DRAFT_KEY)
  title.value = ''
  tags.value = ''
  slug.value = ''
  body.value = ''
  password.value = ''
  slugTouched.value = false
  setTimeout(() => {
    skipSave = false
  }, 600)
}

// ---- 发布 ----
const publishing = ref(false)
const publishMsg = ref('') // { type: 'success' | 'error' | 'info', text }
let msgTimer = null
function showMsg(type, text) {
  publishMsg.value = { type, text }
  clearTimeout(msgTimer)
  msgTimer = setTimeout(() => {
    publishMsg.value = ''
  }, 8000)
}

function parseTags() {
  return String(tags.value || '')
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 10)
}

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

function validate() {
  if (!title.value.trim()) return '标题不能为空'
  const s = slug.value.trim()
  if (!s) return 'slug 不能为空'
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(s)) return 'slug 仅允许字母、数字、连字符'
  if (!body.value.trim()) return '正文不能为空'
  if (body.value.length > 51200) return '正文超过 50KB 限制'
  return ''
}

// 组装带 frontmatter 的 Markdown 文件内容
function buildMarkdown() {
  const d = new Date()
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const tagList = parseTags()
  const tagLine = `tags: [${tagList.map((t) => `"${t}"`).join(', ')}]`
  const summary = makeSummary(body.value) || title.value.trim()
  const esc = (s) => String(s).replace(/"/g, '\\"')
  return `---\ntitle: "${esc(title.value.trim())}"\ndate: ${date}\n${tagLine}\nsummary: "${esc(summary)}"\n---\n\n${body.value}`
}

// 本地预览模式降级：把 .md 文件内容以 blob 下载，供手动放回 src/content/posts
function downloadLocal(md) {
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${slug.value.trim()}.md`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

async function publish() {
  const err = validate()
  if (err) {
    showMsg('error', err)
    return
  }
  publishing.value = true
  publishMsg.value = ''
  const payload = {
    title: title.value.trim(),
    slug: slug.value.trim(),
    tags: parseTags(),
    body: body.value,
    password: password.value,
  }

  function finishDowngrade() {
    const md = buildMarkdown()
    downloadLocal(md)
    showMsg('info', '本地预览模式：未检测到 /api/write-post 服务，已生成并下载 .md 文件，可手动放回 src/content/posts')
  }

  try {
    let res
    try {
      res = await fetch('/api/write-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } catch (_) {
      // 网络层失败（函数不存在 / 无后端服务）→ 本地预览模式降级
      finishDowngrade()
      return
    }
    // 本地 dev / preview 无 Vercel 函数：404 或 SPA fallback 返回 HTML → 降级
    if (res.status === 404 || (res.headers.get('content-type') || '').includes('text/html')) {
      finishDowngrade()
      return
    }
    const data = await res.json().catch(() => null)
    if (!res.ok || !data || !data.ok) {
      showMsg('error', (data && data.error) || `发布失败（HTTP ${res.status}）`)
      return
    }
    // 发布成功：清空草稿并提示等待自动部署
    localStorage.removeItem(DRAFT_KEY)
    title.value = ''
    tags.value = ''
    slug.value = ''
    body.value = ''
    password.value = ''
    slugTouched.value = false
    showMsg('success', '已发布，等待自动部署')
  } finally {
    publishing.value = false
  }
}

onMounted(() => {
  if (restoreDraft()) {
    showMsg('info', '已恢复上次未发布的草稿')
  }
})
onBeforeUnmount(() => {
  clearTimeout(saveTimer)
  clearTimeout(msgTimer)
})
</script>

<template>
  <div class="write-page">
    <div class="write-card">
      <header class="write-card__head">
        <h1 class="write-card__title">写文章</h1>
        <p class="write-card__sub">编辑 Markdown 正文，右侧实时预览；发布后提交到 GitHub 仓库，等待自动部署。</p>
      </header>

      <div v-if="publishMsg" class="write-msg" :class="`write-msg--${publishMsg.type}`">
        {{ publishMsg.text }}
      </div>

      <div class="write-layout">
        <!-- 左：编辑表单 -->
        <section class="write-pane write-pane--form">
          <label class="write-field">
            <span class="write-field__label">标题</span>
            <input v-model="title" class="write-input" type="text" placeholder="文章标题" maxlength="120" />
          </label>

          <label class="write-field">
            <span class="write-field__label">标签（逗号分隔）</span>
            <input v-model="tags" class="write-input" type="text" placeholder="vue, vite, 随笔" />
          </label>

          <label class="write-field">
            <span class="write-field__label">Slug（文件名，可编辑）</span>
            <input
              v-model="slug"
              class="write-input write-input--mono"
              type="text"
              placeholder="hello-kam"
              @input="slugTouched = true"
            />
          </label>

          <label class="write-field">
            <span class="write-field__label">发布密码（部署后用于校验，本地可留空）</span>
            <input v-model="password" class="write-input" type="password" placeholder="POST_PASSWORD（Vercel 环境变量）" autocomplete="off" />
          </label>

          <div class="write-field write-field--grow">
            <span class="write-field__label">正文（Markdown）</span>
            <textarea
              v-model="body"
              class="write-textarea"
              placeholder="支持 Markdown 语法：# 标题、**加粗**、`代码`、``` 代码块 ```、- 列表…"
              spellcheck="false"
            ></textarea>
          </div>
        </section>

        <!-- 右：实时预览 -->
        <section class="write-pane write-pane--preview">
          <div class="write-preview" v-html="previewHtml"></div>
        </section>
      </div>

      <footer class="write-card__foot">
        <button class="write-btn write-btn--ghost" type="button" @click="clearDraft">清空草稿</button>
        <button class="write-btn write-btn--primary" type="button" :disabled="publishing" @click="publish">
          {{ publishing ? '发布中…' : '发布文章' }}
        </button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.write-page {
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
  padding: 24px 28px 48px;
  box-sizing: border-box;
}

@media (max-width: 900px) {
  .write-page {
    padding: 56px 14px 32px;
  }
}

.write-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-glass);
  box-shadow: var(--card-shadow);
  padding: var(--space-6);
}

@media (max-width: 900px) {
  .write-card {
    padding: var(--space-5) var(--space-4);
  }
}

.write-card__title {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 6px;
  color: var(--text);
}

.write-card__sub {
  color: var(--text-muted);
  margin: 0 0 var(--space-5);
  font-size: 14px;
}

.write-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-5);
  align-items: stretch;
}

@media (max-width: 900px) {
  .write-layout {
    grid-template-columns: 1fr;
  }
}

.write-pane {
  min-width: 0;
}

.write-field {
  display: block;
  margin-bottom: var(--space-4);
}

.write-field--grow {
  display: flex;
  flex-direction: column;
}

.write-field__label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 6px;
  letter-spacing: 0.02em;
}

.write-input,
.write-textarea {
  width: 100%;
  box-sizing: border-box;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-btn);
  color: var(--text);
  font-family: var(--font-sans);
  font-size: 14px;
  padding: 10px 12px;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.write-input:focus,
.write-textarea:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.write-input--mono {
  font-family: var(--font-mono);
}

.write-textarea {
  min-height: 420px;
  resize: vertical;
  line-height: 1.7;
}

/* 预览面板 */
.write-pane--preview .write-preview {
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  background: var(--bg);
  padding: var(--space-5);
  min-height: 420px;
  max-height: 72vh;
  overflow: auto;
  line-height: 1.75;
  font-size: 15px;
}

.write-preview :deep(h1),
.write-preview :deep(h2),
.write-preview :deep(h3) {
  font-family: var(--font-display);
  color: var(--text);
  line-height: 1.3;
}

.write-preview :deep(h1) { font-size: 26px; }
.write-preview :deep(h2) { font-size: 21px; margin-top: 1.4em; padding-bottom: 6px; border-bottom: 1px solid var(--border); }
.write-preview :deep(h3) { font-size: 17px; }
.write-preview :deep(p) { margin: 0.8em 0; color: var(--text); }
.write-preview :deep(a) { color: var(--accent); }
.write-preview :deep(code) {
  font-family: var(--font-mono);
  background: var(--surface);
  padding: 2px 5px;
  border-radius: 5px;
  font-size: 13px;
}
.write-preview :deep(pre) {
  background: var(--code-bg);
  color: #e2e8f0;
  padding: 14px 16px;
  border-radius: var(--radius-card);
  overflow-x: auto;
}
.write-preview :deep(pre code) {
  background: transparent;
  padding: 0;
}
.write-preview :deep(blockquote) {
  border-left: 3px solid var(--accent);
  margin: 1em 0;
  padding: 2px 14px;
  color: var(--text-muted);
  background: var(--accent-soft);
  border-radius: 0 8px 8px 0;
}
.write-preview :deep(ul),
.write-preview :deep(ol) {
  padding-left: 1.4em;
  color: var(--text);
}
.write-preview :deep(img) {
  max-width: 100%;
  border-radius: 8px;
}
.write-preview :deep(table) {
  border-collapse: collapse;
  margin: 1em 0;
}
.write-preview :deep(th),
.write-preview :deep(td) {
  border: 1px solid var(--border);
  padding: 6px 10px;
}

/* 状态提示 */
.write-msg {
  border-radius: var(--radius-card);
  padding: 10px 14px;
  font-size: 14px;
  margin-bottom: var(--space-5);
}
.write-msg--success {
  background: var(--accent-soft);
  color: var(--accent);
}
.write-msg--error {
  background: #fef2f2;
  color: #dc2626;
}
.write-msg--info {
  background: var(--warm-accent-soft);
  color: var(--warm-accent);
}

/* 底部操作 */
.write-card__foot {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-5);
  padding-top: var(--space-5);
  border-top: 1px solid var(--border);
}
.write-btn {
  border: none;
  border-radius: var(--radius-btn);
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.15s ease, box-shadow 0.15s ease;
}
.write-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.write-btn--primary {
  background: var(--gradient);
  color: var(--accent-contrast);
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.25);
}
.write-btn--primary:hover:not(:disabled) {
  transform: translateY(-1px);
}
.write-btn--ghost {
  background: transparent;
  color: var(--text-muted);
  border: 1px solid var(--border);
}
.write-btn--ghost:hover {
  color: var(--text);
  border-color: var(--text-muted);
}
</style>
