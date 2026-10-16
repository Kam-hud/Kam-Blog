<script setup>
import { computed, ref } from 'vue'
import PostListItem from '../components/PostListItem.vue'
import TagChips from '../components/TagChips.vue'
import { posts, postsByYear, allTags } from '../composables/usePosts'
import { useReveal } from '../composables/useReveal'

const BASE_URL = import.meta.env.BASE_URL || '/'

// 站内搜索：读取构建期生成的静态索引（dist/search-index.json），
// 前端对标题 / 摘要 / 标签做模糊过滤；索引加载失败时回退到构建期内存数据（同源同字段）。
const searchIndex = ref([])
fetch(`${BASE_URL}search-index.json`)
  .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
  .then((data) => (searchIndex.value = data))
  .catch(() => {})

const selectedTag = ref('')
const keyword = ref('')

const source = computed(() => (searchIndex.value.length ? searchIndex.value : posts))

const filtered = computed(() => {
  let list = source.value
  if (selectedTag.value) list = list.filter((p) => p.tags.includes(selectedTag.value))
  const kw = keyword.value.trim().toLowerCase()
  if (kw) {
    list = list.filter((p) => {
      const haystack = [p.title, p.summary, p.excerpt, ...(p.tags || [])].join(' ').toLowerCase()
      return haystack.includes(kw)
    })
  }
  return list
})

const viewMode = ref('year')

const groupModes = [
  { value: 'category', label: '分类' },
  { value: 'day', label: '日' },
  { value: 'week', label: '周' },
  { value: 'month', label: '月' },
  { value: 'year', label: '年' },
]

// 周分组：按自然周（周一为起点）取周一日期作为组标签
function weekStart(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  const day = (dt.getDay() + 6) % 7 // 周一=0
  dt.setDate(dt.getDate() - day)
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${dt.getFullYear()}-${mm}-${dd}`
}

const groups = computed(() => {
  const list = filtered.value
  // 分类聚合：一篇可命中多个标签，无标签归入"未分类"
  if (viewMode.value === 'category') {
    const map = new Map()
    list.forEach((p) => {
      const tags = p.tags.length ? p.tags : ['未分类']
      tags.forEach((tag) => {
        if (!map.has(tag)) map.set(tag, [])
        map.get(tag).push(p)
      })
    })
    return Array.from(map, ([label, posts]) => ({ label, posts })).sort((a, b) =>
      a.label.localeCompare(b.label, 'zh-Hans-CN'),
    )
  }
  // 日 / 周 / 月：统一按日期字符串推导组标签
  if (viewMode.value !== 'year') {
    const map = new Map()
    list.forEach((p) => {
      let label = '未标注日期'
      if (p.date) {
        if (viewMode.value === 'day') label = p.date
        else if (viewMode.value === 'week') label = `${weekStart(p.date)} 周`
        else label = `${p.date.slice(0, 4)}年${Number(p.date.slice(5, 7))}月`
      }
      if (!map.has(label)) map.set(label, [])
      map.get(label).push(p)
    })
    return Array.from(map, ([label, posts]) => ({ label, posts }))
  }
  return postsByYear(list).map((g) => ({ label: g.year, posts: g.posts }))
})

const statusText = computed(() => {
  const kw = keyword.value.trim()
  if (kw) return `找到 ${filtered.value.length} 篇与「${kw}」相关的文章`
  if (selectedTag.value) return `标签「${selectedTag.value}」下的文章（${filtered.value.length} 篇）`
  return ''
})

useReveal()
</script>

<template>
  <div class="container">
    <div class="page-head">
      <h1 class="page-head__title">文章</h1>
      <p class="page-head__desc">技术笔记为主，偶尔夹一点随笔。</p>
    </div>

    <div class="filter-bar reveal">
      <input
        v-model="keyword"
        class="search-input"
        type="search"
        placeholder="搜索标题、摘要或标签…"
        aria-label="站内搜索"
      />
      <TagChips v-model="selectedTag" :tags="allTags" />
      <p v-if="statusText" class="filter-bar__status">{{ statusText }}</p>
    </div>

    <div class="group-tabs reveal" role="tablist" aria-label="文章分组方式">
      <button
        v-for="mode in groupModes"
        :key="mode.value"
        type="button"
        role="tab"
        class="group-tabs__tab"
        :class="{ 'group-tabs__tab--active': viewMode === mode.value }"
        @click="viewMode = mode.value"
      >
        {{ mode.label }}
      </button>
    </div>

    <template v-if="filtered.length">
      <section v-for="group in groups" :key="group.label" class="year">
        <h2 class="year__label">
          {{ group.label }}
          <span class="year__count">{{ group.posts.length }} 篇</span>
        </h2>
        <div class="year__list">
          <PostListItem v-for="post in group.posts" :key="post.slug" :post="post" />
        </div>
      </section>
    </template>

    <p v-else class="muted">
      <template v-if="statusText">没有匹配的文章，换个关键词或标签试试。</template>
      <template v-else>还没有文章。在 <code>src/content/posts/</code> 下新建一个 .md 就会出现。</template>
    </p>
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-5);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  background: var(--surface);
}

.search-input {
  flex: 1 1 220px;
  min-width: 200px;
  padding: 8px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  background: var(--bg);
  color: var(--text);
  font-size: 14px;
  font-family: var(--font-display);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-2);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-2) 18%, transparent);
}

.search-input::placeholder {
  color: var(--text-muted);
}

.filter-bar__status {
  flex: 1 1 100%;
  margin: 0;
  color: var(--text-muted);
  font-size: 13px;
}

.group-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-5);
}

.group-tabs__tab {
  padding: 5px 18px;
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--text-muted);
  font-size: 13.5px;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;
}

.group-tabs__tab:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.group-tabs__tab--active {
  color: var(--accent-contrast);
  background: var(--accent);
  border-color: var(--accent);
}

.year {
  margin-bottom: var(--space-6);
}

.year__label {
  margin-bottom: var(--space-3);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.year__list {
  display: flex;
  flex-direction: column;
}
</style>
