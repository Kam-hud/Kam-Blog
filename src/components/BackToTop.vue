<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// 下滑超过一屏后出现
const visible = ref(false)
let ticking = false

function update() {
  ticking = false
  visible.value = window.scrollY > window.innerHeight
}

function onScroll() {
  if (ticking) return
  ticking = true
  window.requestAnimationFrame(update)
}

function toTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  update()
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <button v-show="visible" type="button" class="back-to-top" aria-label="回到顶部" @click="toTop">
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M12 5.5l6 6-1.4 1.4L13 9.3V19h-2V9.3l-3.6 3.6L6 11.5z"
        fill="currentColor"
      />
    </svg>
    <span>回到顶部</span>
  </button>
</template>

<style scoped>
.back-to-top {
  position: fixed;
  right: 20px;
  bottom: 24px;
  z-index: 30;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  background: var(--surface);
  color: var(--text-muted);
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
  box-shadow: var(--shadow-card);
  transition: border-color 0.15s ease, color 0.15s ease;
}

.back-to-top:hover {
  border-color: var(--accent);
  color: var(--accent);
}

@media (max-width: 480px) {
  .back-to-top {
    right: 12px;
    bottom: 16px;
  }

  .back-to-top span {
    display: none;
  }
}
</style>
