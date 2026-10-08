<script setup>
import { ref, computed, watch, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import TechTag from '../components/TechTag.vue'
import ArticleBody from '../components/ArticleBody.vue'
import NotFoundView from './NotFoundView.vue'
import { getProject, coverGradient } from '../composables/useProjects'
import { site } from '../config'

const route = useRoute()
const project = computed(() => getProject(route.params.slug))

watchEffect(() => {
  document.title = project.value
    ? `${project.value.title} · ${site.name}`
    : `页面不存在 · ${site.name}`
})

/** 站内路径补上部署根路径，站外链接原样返回 —— 改 base 时这里不用动 */
function resolveUrl(url) {
  if (!url) return ''
  if (/^(https?:)?\/\//.test(url) || url.startsWith('mailto:')) return url
  const base = import.meta.env.BASE_URL || '/'
  return `${base.replace(/\/+$/, '/')}${url.replace(/^\/+/, '')}`
}

const demoUrl = computed(() => resolveUrl(project.value ? project.value.demo : ''))
const repoUrl = computed(() => resolveUrl(project.value ? project.value.repo : ''))
const coverUrl = computed(() => resolveUrl(project.value ? project.value.cover : ''))

const coverFailed = ref(false)
watch(
  () => route.params.slug,
  () => {
    coverFailed.value = false
  },
)
</script>

<template>
  <div v-if="project" class="container">
    <article class="detail">
      <header class="detail__head">
        <h1 class="detail__title">{{ project.title }}</h1>
        <p v-if="project.summary" class="detail__summary">{{ project.summary }}</p>
        <ul v-if="project.tech.length" class="detail__tags">
          <li v-for="tag in project.tech" :key="tag">
            <TechTag :label="tag" />
          </li>
        </ul>
      </header>

      <div class="detail__cover">
        <img
          v-if="coverUrl && !coverFailed"
          :src="coverUrl"
          :alt="`${project.title} 封面截图`"
          @error="coverFailed = true"
        />
        <div
          v-else
          class="detail__cover-fallback"
          :style="{ background: coverGradient(project.slug) }"
        >
          <span>{{ project.title }}</span>
        </div>
      </div>

      <div v-if="demoUrl || repoUrl" class="detail__actions">
        <a v-if="demoUrl" class="btn btn--primary" :href="demoUrl" target="_blank" rel="noopener">
          在线体验 →
        </a>
        <a v-if="repoUrl" class="btn" :href="repoUrl" target="_blank" rel="noopener">源码 ↗</a>
      </div>

      <ArticleBody :html="project.html" />

      <p v-if="project.notice" class="detail__notice">{{ project.notice }}</p>
    </article>
  </div>

  <NotFoundView v-else />
</template>

<style scoped>
.detail {
  max-width: var(--content-width);
  margin: 0 auto;
}

.detail__head {
  margin-bottom: var(--space-5);
}

.detail__title {
  font-size: 1.9rem;
  margin-bottom: var(--space-2);
}

.detail__summary {
  color: var(--text-muted);
  margin-bottom: var(--space-4);
}

.detail__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.detail__cover {
  aspect-ratio: 16 / 9;
  margin-bottom: var(--space-5);
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  background: var(--code-bg);
}

.detail__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail__cover-fallback {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  color: #ffffff;
  font-size: 1.3rem;
  font-weight: 600;
}

.detail__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}

.detail__notice {
  margin-top: var(--space-6);
  padding: var(--space-3) var(--space-4);
  border-left: 3px solid var(--accent);
  border-radius: 0 var(--radius-card) var(--radius-card) 0;
  background: var(--surface);
  color: var(--text-muted);
  font-size: 13.5px;
}
</style>
