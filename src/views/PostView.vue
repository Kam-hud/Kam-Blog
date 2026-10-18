<script setup>
import { computed, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import ArticleBody from '../components/ArticleBody.vue'
import ArticleToc from '../components/ArticleToc.vue'

import NotFoundView from './NotFoundView.vue'
import { getPost } from '../composables/usePosts'
import { site } from '../config'

const route = useRoute()
const post = computed(() => getPost(route.params.slug))

watchEffect(() => {
  document.title = post.value ? `${post.value.title} · ${site.name}` : `页面不存在 · ${site.name}`
})
</script>

<template>
  <div v-if="post" class="container">
    <div class="layout">
      <article class="article">
        <header class="article__head">
          <h1 class="article__title">{{ post.title }}</h1>
          <div class="article__meta">
            <time :datetime="post.date">{{ post.date }}</time>
            <span class="article__dot">·</span>
            <span>约 {{ post.readingMinutes }} 分钟</span>
            <template v-if="post.tags.length">
              <span class="article__dot">·</span>
              <span>{{ post.tags.join(' / ') }}</span>
            </template>
          </div>
        </header>

        <p v-if="post.summary" class="article__summary">{{ post.summary }}</p>

        <ArticleBody :html="post.html" />

        <div v-if="post.toc.length" class="article__foot-toc">
          <h2 class="article__foot-toc-title">文章目录</h2>
          <ul class="article__foot-toc-list">
            <li
              v-for="item in post.toc"
              :key="item.id"
              :class="`article__foot-toc-item--h${item.level}`"
            >
              <a :href="`#${item.id}`" @click.prevent="goToId(item.id)">{{ item.text }}</a>
            </li>
          </ul>
        </div>

      </article>

      <!-- 窄屏折叠在正文上方，宽屏常驻右侧 -->
      <ArticleToc class="article__toc" :toc="post.toc" />
    </div>
  </div>

  <NotFoundView v-else />
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: minmax(0, var(--content-width)) 200px;
  gap: var(--space-6);
  justify-content: center;
  align-items: start;
}

.article {
  min-width: 0;
}

.article__head {
  margin-bottom: var(--space-5);
}

.article__title {
  font-size: 1.9rem;
  margin-bottom: var(--space-3);
}

.article__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
  font-size: 13.5px;
}

.article__dot {
  color: var(--border);
}

.article__summary {
  margin: 0 0 var(--space-5);
  padding: var(--space-3) var(--space-4);
  border-left: 3px solid var(--accent);
  border-radius: 0 var(--radius-card) var(--radius-card) 0;
  background: var(--surface);
  color: var(--text-muted);
  font-size: 14.5px;
  line-height: 1.7;
}

.article__foot-toc {
  margin-top: var(--space-6);
  padding: var(--space-4) var(--space-5);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  background: var(--surface);
}

.article__foot-toc-title {
  margin: 0 0 var(--space-3);
  color: var(--text-muted);
  font-size: 1rem;
  font-weight: 600;
}

.article__foot-toc-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.article__foot-toc-list li {
  margin: 0 0 2px;
}

.article__foot-toc-list a {
  display: block;
  padding: 4px 8px;
  border-radius: 6px;
  color: var(--text-muted);
  line-height: 1.6;
}

.article__foot-toc-list a:hover {
  color: var(--accent);
  background: var(--accent-soft);
  text-decoration: none;
}

.article__foot-toc-item--h3 {
  padding-left: var(--space-4);
}

.article__toc {
  min-width: 0;
}

@media (max-width: 899px) {
  .layout {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-5);
  }

  .article__toc {
    order: -1;
  }
}
</style>
