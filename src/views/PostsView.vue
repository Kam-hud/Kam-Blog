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

const groups = computed(() => postsByYear(filtered.value))

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

    <template v-if="filtered.length">
      <section v-for="group in groups" :key="group.year" class="year">
        <h2 class="year__label">{{ group.year }}</h2>
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
