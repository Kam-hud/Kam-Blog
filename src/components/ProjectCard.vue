<script setup>
import { ref, computed, watch } from 'vue'
import TechTag from './TechTag.vue'
import { coverGradient } from '../composables/useProjects'

const props = defineProps({
  project: {
    type: Object,
    required: true,
  },
})

const coverFailed = ref(false)
watch(
  () => props.project.cover,
  () => {
    coverFailed.value = false
  },
)

const showCover = computed(() => Boolean(props.project.cover) && !coverFailed.value)
</script>

<template>
  <RouterLink class="pcard" :to="`/projects/${project.slug}`">
    <div class="pcard__cover">
      <img
        v-if="showCover"
        :src="project.cover"
        :alt="`${project.title} 封面`"
        loading="lazy"
        @error="coverFailed = true"
      />
      <!-- 封面缺失或加载失败时退化为渐变色块，保证不出现破图 -->
      <div
        v-else
        class="pcard__cover-fallback"
        :style="{ background: coverGradient(project.slug) }"
      >
        <span>{{ project.title }}</span>
      </div>
    </div>

    <div class="pcard__body">
      <h3 class="pcard__title">{{ project.title }}</h3>
      <p class="pcard__summary">{{ project.summary }}</p>
      <ul v-if="project.tech.length" class="pcard__tags">
        <li v-for="tag in project.tech" :key="tag">
          <TechTag :label="tag" />
        </li>
      </ul>
    </div>
  </RouterLink>
</template>

<style scoped>
.pcard {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  background: var(--surface);
  color: var(--text);
  transition: border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
}

.pcard:hover {
  border-color: var(--accent);
  box-shadow: var(--shadow-card);
  transform: translateY(-2px);
  text-decoration: none;
}

.pcard__cover {
  aspect-ratio: 16 / 9;
  background: var(--code-bg);
}

.pcard__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pcard__cover-fallback {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  padding: var(--space-4);
  color: #ffffff;
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.pcard__body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  padding: var(--space-5);
}

.pcard__title {
  margin-bottom: var(--space-2);
  font-size: 1.1rem;
}

.pcard__summary {
  flex: 1 1 auto;
  margin-bottom: var(--space-4);
  color: var(--text-muted);
  font-size: 14.5px;
}

.pcard__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
