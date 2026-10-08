<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  toc: {
    type: Array,
    default: () => [],
  },
})

const WIDE = '(min-width: 900px)'

// 宽屏下目录常驻右栏；窄屏下折叠成可点开的块
const isWide = ref(false)
let mediaQuery = null

// 当前高亮的标题
const activeId = ref('')

let ticking = false

function updateActive() {
  ticking = false
  if (!props.toc.length) {
    activeId.value = ''
    return
  }
  // 已经滚到底部时，末尾的标题可能永远顶不到吸顶导航下方，直接高亮最后一条
  if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
    activeId.value = props.toc[props.toc.length - 1].id
    return
  }
  // 落在吸顶导航下方的最后一个标题即为当前章节
  const offset = 96
  let current = props.toc[0].id
  for (const item of props.toc) {
    const el = document.getElementById(item.id)
    if (!el) continue
    if (el.getBoundingClientRect().top <= offset) {
      current = item.id
    } else {
      break
    }
  }
  activeId.value = current
}

function onScroll() {
  if (ticking) return
  ticking = true
  window.requestAnimationFrame(updateActive)
}

function onMediaChange(event) {
  isWide.value = event.matches
  updateActive()
}

function goTo(id) {
  const el = document.getElementById(id)
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY - 80
  window.scrollTo({ top, behavior: 'smooth' })
  activeId.value = id
}

onMounted(() => {
  mediaQuery = window.matchMedia(WIDE)
  isWide.value = mediaQuery.matches
  mediaQuery.addEventListener('change', onMediaChange)
  window.addEventListener('scroll', onScroll, { passive: true })
  updateActive()
})

onUnmounted(() => {
  if (mediaQuery) mediaQuery.removeEventListener('change', onMediaChange)
  window.removeEventListener('scroll', onScroll)
})

// 同一组件实例在文章间复用时，目录会整体换掉，重新计算高亮
watch(
  () => props.toc,
  () => {
    activeId.value = props.toc.length ? props.toc[0].id : ''
    updateActive()
  },
)
</script>

<template>
  <div v-if="toc.length" class="toc">
    <details class="toc__box" :open="isWide">
      <summary class="toc__summary">目录</summary>
      <nav class="toc__nav" aria-label="文章目录">
        <ul class="toc__list">
          <li
            v-for="item in toc"
            :key="item.id"
            :class="['toc__item', `toc__item--h${item.level}`]"
          >
            <a
              class="toc__link"
              :class="{ 'toc__link--active': item.id === activeId }"
              :href="`#${item.id}`"
              @click.prevent="goTo(item.id)"
            >
              {{ item.text }}
            </a>
          </li>
        </ul>
      </nav>
    </details>
  </div>
</template>

<style scoped>
.toc {
  font-size: 13.5px;
}

/* 窄屏：一个可展开的块 */
.toc__box {
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  background: var(--surface);
  padding: var(--space-3) var(--space-4);
}

.toc__summary {
  cursor: pointer;
  color: var(--text-muted);
  font-weight: 600;
  list-style: none;
}

.toc__summary::-webkit-details-marker {
  display: none;
}

.toc__summary::before {
  content: '▸';
  display: inline-block;
  margin-right: 6px;
  transition: transform 0.15s ease;
}

.toc__box[open] > .toc__summary::before {
  transform: rotate(90deg);
}

.toc__nav {
  margin-top: var(--space-3);
}

.toc__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.toc__item {
  margin: 0 0 2px;
}

.toc__item--h3 {
  padding-left: var(--space-4);
}

.toc__link {
  display: block;
  padding: 4px 8px;
  border-left: 2px solid transparent;
  border-radius: 0 4px 4px 0;
  color: var(--text-muted);
  line-height: 1.5;
}

.toc__link:hover {
  color: var(--text);
  text-decoration: none;
}

.toc__link--active {
  border-left-color: var(--accent);
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 600;
}

/* 宽屏：常驻右栏，取消折叠外观 */
@media (min-width: 900px) {
  .toc__box {
    position: sticky;
    top: calc(var(--nav-height) + var(--space-5));
    padding: 0;
    border: none;
    background: transparent;
  }

  .toc__summary {
    display: none;
  }

  .toc__nav {
    margin-top: 0;
    max-height: calc(100vh - var(--nav-height) - var(--space-6) * 2);
    overflow-y: auto;
  }
}
</style>
