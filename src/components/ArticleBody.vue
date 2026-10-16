<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'

// 正文渲染出口。html 来自构建时收集的本地 Markdown，内容是作者自己写的，非外部输入。
const props = defineProps({
  html: {
    type: String,
    default: '',
  },
})

const bodyEl = ref(null)

// 为正文里每一个代码块挂上独立复制按钮（全站所有用 ArticleBody 渲染的页面自动覆盖）
function attachCopyButtons() {
  const root = bodyEl.value
  if (!root) return
  const blocks = root.querySelectorAll('pre.code-block')
  blocks.forEach((pre) => {
    if (pre.querySelector('.code-copy-btn')) return
    const code = pre.querySelector('code')
    if (!code) return

    pre.classList.add('code-block--with-copy')

    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'code-copy-btn'
    btn.textContent = 'Copy code'
    btn.setAttribute('aria-label', '复制代码')
    btn.addEventListener('click', () => {
      const text = code.innerText || ''
      copyText(text).then(() => {
        btn.textContent = '已复制'
        btn.classList.add('code-copy-btn--done')
        setTimeout(() => {
          btn.textContent = 'Copy code'
          btn.classList.remove('code-copy-btn--done')
        }, 1800)
      })
    })
    pre.appendChild(btn)
  })
}

// 优先 Clipboard API，非安全上下文（file:// 等）降级 textarea + execCommand
function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text).catch(() => legacyCopy(text))
  }
  return legacyCopy(text)
}

function legacyCopy(text) {
  return new Promise((resolve, reject) => {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      resolve()
    } catch (e) {
      reject(e)
    }
  })
}

onMounted(() => attachCopyButtons())

// 路由间复用同一组件实例时（文章→文章、项目→项目），html 变化后重新挂按钮
watch(
  () => props.html,
  () => {
    nextTick(attachCopyButtons)
  },
  { flush: 'post' },
)
</script>

<template>
  <div ref="bodyEl" class="prose" v-html="html"></div>
</template>

<style>
/* 复制按钮相关样式必须是非 scoped：v-html 注入的内容不受 scoped 约束 */
.code-block--with-copy {
  position: relative;
}

.code-copy-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
  padding: 4px 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface);
  color: var(--text-muted);
  font-family: var(--font-display);
  font-size: 12px;
  line-height: 1.4;
  cursor: pointer;
  opacity: 0;
  transition:
    opacity 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;
}

.code-block--with-copy:hover .code-copy-btn,
.code-copy-btn:focus-visible {
  opacity: 1;
}

.code-copy-btn:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.code-copy-btn--done {
  color: var(--accent-2) !important;
  border-color: var(--accent-2) !important;
  opacity: 1 !important;
}

/* 给正文里的代码块多一点呼吸空间，避免按钮贴边 */
.code-block--with-copy pre,
.prose pre.code-block--with-copy {
  padding-top: 18px;
}
</style>
