<script setup>
import { ref, computed, watch } from 'vue'
import TechTag from './TechTag.vue'
import { coverGradient } from '../composables/useProjects'

const props = defineProps({
  project: {
    type: Object,
    required: true,
  },
  // 精选模式：首页主打卡（大卡 + Featured 徽章 + 毛玻璃质感），列表页不传
  featured: {
    type: Boolean,
    default: false,
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
  <RouterLink
    class="pcard"
    :class="{ 'pcard--featured': featured }"
    :to="`/projects/${project.slug}`"
  >
    <div class="pcard__cover">
      <!-- 精选徽章：渐变底 pill，仅首页主打卡显示 -->
      <span v-if="featured" class="pcard__badge">Featured</span>
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
      <h3 class="pcard__title">
        {{ project.title }} <span class="pcard__arrow" aria-hidden="true">→</span>
      </h3>
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
  transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.pcard:hover {
  border-color: var(--accent-2);
  /* accent-2 边框光晕：1px 描边 + 主阴影 + violet 辉光 */
  box-shadow: 0 0 0 1px var(--accent-2), var(--shadow-card),
    0 14px 34px -14px color-mix(in srgb, var(--accent-2) 55%, transparent);
  transform: translateY(-3px);
  text-decoration: none;
}

.pcard__cover {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: var(--code-bg);
}

.pcard__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.35s ease;
}

.pcard:hover .pcard__cover img {
  transform: scale(1.03);
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

.pcard__arrow {
  display: inline-block;
  margin-left: 2px;
  font-weight: 400;
  transition: transform 0.25s ease;
}

.pcard:hover .pcard__arrow {
  transform: translateX(4px);
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

/* ---- Featured 精选模式（首页主打卡） ---- */

.pcard--featured {
  background: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(150%);
  backdrop-filter: blur(var(--glass-blur)) saturate(150%);
  border-color: var(--glass-border);
  box-shadow: var(--glass-shadow);
}

.pcard--featured:hover {
  border-color: var(--accent-2);
  box-shadow: 0 0 0 1px var(--accent-2), var(--glass-shadow),
    0 16px 40px -16px color-mix(in srgb, var(--accent-2) 55%, transparent);
}

.pcard__badge {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 1;
  padding: 5px 12px;
  border-radius: var(--radius-pill);
  background: var(--gradient);
  color: var(--accent-contrast);
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  box-shadow: 0 8px 20px -8px color-mix(in srgb, var(--accent-2) 60%, transparent);
}

.pcard--featured .pcard__title {
  font-size: 1.3rem;
}

.pcard--featured .pcard__summary {
  font-size: 15px;
}
</style>
