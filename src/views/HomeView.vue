<script setup>
import { computed } from 'vue'
import ProjectCard from '../components/ProjectCard.vue'
import PostListItem from '../components/PostListItem.vue'
import { latestPosts } from '../composables/usePosts'
import { featuredProjects } from '../composables/useProjects'
import { site } from '../config'

const FEATURED_SLOTS = 3

const featured = featuredProjects(FEATURED_SLOTS)
const latest = latestPosts(5)

// 精选不满 3 个时补虚线占位卡，避免首页看起来像"还没做完"
const placeholderCount = computed(() => {
  if (featured.length >= FEATURED_SLOTS) return 0
  return Math.max(1, FEATURED_SLOTS - featured.length)
})
</script>

<template>
  <div>
    <section class="hero container">
      <h1 class="hero__title">{{ site.heroTitle }}</h1>
      <p class="hero__subtitle">{{ site.heroSubtitle }}</p>
      <div class="hero__actions">
        <RouterLink class="btn btn--primary" to="/projects">看作品</RouterLink>
        <RouterLink class="btn" to="/posts">读文章</RouterLink>
      </div>
    </section>

    <section class="container section">
      <div class="section__head">
        <h2 class="section__title">精选作品</h2>
        <RouterLink class="section__more" to="/projects">全部作品 →</RouterLink>
      </div>

      <div class="grid">
        <ProjectCard v-for="project in featured" :key="project.slug" :project="project" />
        <div v-for="n in placeholderCount" :key="`placeholder-${n}`" class="placeholder">
          + 以后再加
        </div>
      </div>
    </section>

    <section class="container section">
      <div class="section__head">
        <h2 class="section__title">最新文章</h2>
        <RouterLink class="section__more" to="/posts">全部文章 →</RouterLink>
      </div>

      <div class="post-list">
        <PostListItem v-for="post in latest" :key="post.slug" :post="post" />
      </div>

      <p v-if="!latest.length" class="muted">
        还没有文章。在 <code>src/content/posts/</code> 下新建一个 .md 就会出现。
      </p>
    </section>
  </div>
</template>

<style scoped>
.hero {
  padding-top: var(--space-5);
  padding-bottom: var(--space-6);
}

.hero__title {
  font-size: 2.2rem;
  margin-bottom: var(--space-3);
}

.hero__subtitle {
  max-width: var(--content-width);
  margin-bottom: var(--space-5);
  color: var(--text-muted);
  font-size: 1.02rem;
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-5);
}

@media (max-width: 900px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

.placeholder {
  display: grid;
  place-items: center;
  min-height: 220px;
  border: 1px dashed var(--border);
  border-radius: var(--radius-card);
  color: var(--text-muted);
  font-size: 14px;
}

.post-list {
  border-top: 1px solid var(--border);
  padding-top: var(--space-2);
}

@media (max-width: 480px) {
  .hero__title {
    font-size: 1.8rem;
  }
}
</style>
