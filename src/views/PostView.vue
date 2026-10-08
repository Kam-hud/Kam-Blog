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

        <ArticleBody :html="post.html" />
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
