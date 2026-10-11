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
    <div class="pitem__body">
      <span class="pitem__title">
        {{ post.title }} <span class="pitem__arrow" aria-hidden="true">→</span>
      </span>
      <p class="pitem__summary">{{ post.summary || post.excerpt }}</p>
    </div>
    <div class="pitem__meta">
      <time class="pitem__date" :datetime="post.date">{{ post.date }}</time>
      <span class="pitem__read">约 {{ post.readingMinutes }} 分钟</span>
    </div>
  </RouterLink>
</template>

<style scoped>
.pitem {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  background: var(--bg);
  color: var(--text);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, background-color 0.2s ease;
}

.pitem + .pitem {
  margin-top: var(--space-3);
}

.pitem:hover {
  border-color: var(--accent-2);
  background: var(--surface);
  box-shadow: 0 0 0 1px var(--accent-2), var(--shadow-card),
    0 12px 28px -14px color-mix(in srgb, var(--accent-2) 50%, transparent);
  transform: translateY(-2px);
  text-decoration: none;
}

.pitem__body {
  min-width: 0;
  flex: 1 1 auto;
}

.pitem__title {
  font-size: 1rem;
  font-weight: 600;
}

.pitem__arrow {
  display: inline-block;
  margin-left: 3px;
  font-weight: 400;
  transition: transform 0.2s ease;
}

.pitem:hover .pitem__title {
  color: var(--accent-2);
}

.pitem:hover .pitem__arrow {
  transform: translateX(4px);
}

.pitem__summary {
  margin: var(--space-1) 0 0;
  color: var(--text-muted);
  font-size: 13.5px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.pitem__meta {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-1);
  padding-top: 2px;
}

.pitem__date {
  padding: 2px 10px;
  border-radius: var(--radius-pill);
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.pitem:hover .pitem__date {
  background: var(--accent-2-soft);
  color: var(--accent-2);
}

.pitem__read {
  color: var(--text-muted);
  font-size: 12.5px;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 480px) {
  .pitem {
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
  }

  .pitem__meta {
    flex-direction: row;
    align-items: center;
  }
}
</style>
