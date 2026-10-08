<script setup>
defineProps({
  post: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <RouterLink class="pitem" :to="`/posts/${post.slug}`">
    <span class="pitem__title">{{ post.title }}</span>
    <time class="pitem__date" :datetime="post.date">{{ post.date }}</time>
  </RouterLink>
</template>

<style scoped>
.pitem {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-btn);
  color: var(--text);
}

.pitem:hover {
  background: var(--surface);
  text-decoration: none;
}

.pitem__title {
  font-size: 15.5px;
}

.pitem:hover .pitem__title {
  color: var(--accent);
}

.pitem__date {
  flex: 0 0 auto;
  color: var(--text-muted);
  font-size: 13.5px;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 480px) {
  .pitem {
    padding: var(--space-2) 0;
  }

  .pitem__date {
    font-size: 12.5px;
  }
}
</style>
