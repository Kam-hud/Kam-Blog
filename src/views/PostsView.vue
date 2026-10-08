<script setup>
import PostListItem from '../components/PostListItem.vue'
import { posts, postsByYear } from '../composables/usePosts'

const groups = postsByYear()
</script>

<template>
  <div class="container">
    <div class="page-head">
      <h1 class="page-head__title">文章</h1>
      <p class="page-head__desc">技术笔记为主，偶尔夹一点随笔。</p>
    </div>

    <template v-if="posts.length">
      <section v-for="group in groups" :key="group.year" class="year">
        <h2 class="year__label">{{ group.year }}</h2>
        <div class="year__list">
          <PostListItem v-for="post in group.posts" :key="post.slug" :post="post" />
        </div>
      </section>
    </template>

    <p v-else class="muted">
      还没有文章。在 <code>src/content/posts/</code> 下新建一个 .md 就会出现。
    </p>
  </div>
</template>

<style scoped>
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
