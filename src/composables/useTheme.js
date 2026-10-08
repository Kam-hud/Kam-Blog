import { ref, readonly } from 'vue'

/**
 * 主题单例 composable。
 * 模块级 ref，全站共享同一份状态；读写 localStorage 并同步到 <html data-theme>。
 * 无本地记录时跟随系统 prefers-color-scheme。
 */

const STORAGE_KEY = 'theme'

function readInitialTheme() {
  if (typeof window === 'undefined') return 'light'
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch (e) {
    /* 隐私模式下 localStorage 可能抛错，忽略即可 */
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const theme = ref(readInitialTheme())

function applyTheme(value) {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = value
  }
}

// 模块加载即对齐一次（index.html 的内联脚本已先做过同样的事，这里只是保持同步）
applyTheme(theme.value)

export function useTheme() {
  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    applyTheme(theme.value)
    try {
      window.localStorage.setItem(STORAGE_KEY, theme.value)
    } catch (e) {
      /* 写不进去就算了，本次会话内仍然生效 */
    }
  }

  function setTheme(value) {
    theme.value = value === 'dark' ? 'dark' : 'light'
    applyTheme(theme.value)
    try {
      window.localStorage.setItem(STORAGE_KEY, theme.value)
    } catch (e) {
      /* 同上 */
    }
  }

  return { theme: readonly(theme), toggleTheme, setTheme }
}
