<script setup>
import { computed } from 'vue'
import { useTheme } from '../composables/useTheme'

const { theme, toggleTheme } = useTheme()

const label = computed(() => (theme.value === 'dark' ? '切换到亮色模式' : '切换到暗色模式'))
</script>

<template>
  <button
    type="button"
    class="theme-toggle"
    :title="label"
    :aria-label="label"
    @click="toggleTheme"
  >
    <!-- 图标用内联 SVG，避免图标字体或图片请求 -->
    <svg v-if="theme === 'dark'" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <circle cx="12" cy="12" r="4.2" fill="currentColor" />
      <g stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none">
        <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7" />
      </g>
    </svg>
    <svg v-else viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M20.2 14.6A8.4 8.4 0 0 1 9.4 3.8a8.5 8.5 0 1 0 10.8 10.8z" fill="currentColor" />
    </svg>
  </button>
</template>

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-btn);
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease;
}

.theme-toggle:hover {
  border-color: var(--accent);
  color: var(--accent);
}
</style>
