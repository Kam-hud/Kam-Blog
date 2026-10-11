<script setup>
import { computed, ref } from 'vue'
import ProjectCard from '../components/ProjectCard.vue'
import PostListItem from '../components/PostListItem.vue'
import TagChips from '../components/TagChips.vue'
import { latestPosts, allTags } from '../composables/usePosts'
import { featuredProjects } from '../composables/useProjects'
import { useReveal } from '../composables/useReveal'
import { site } from '../config'

const FEATURED_SLOTS = 3

const featured = featuredProjects(FEATURED_SLOTS)
const latest = latestPosts(5)

// 首页最新文章区的标签筛选（与文章列表页共用 TagChips）
const homeTag = ref('')
const filteredLatest = computed(() =>
  homeTag.value ? latest.filter((p) => p.tags.includes(homeTag.value)) : latest,
)

// 精选不满 3 个时补虚线占位卡，避免首页看起来像"还没做完"
const placeholderCount = computed(() => {
  if (featured.length >= FEATURED_SLOTS) return 0
  return Math.max(1, FEATURED_SLOTS - featured.length)
})

// ---- Hero 头像徽标：优先读 config.avatar，缺失时首字母色块兜底 ----
const avatarFailed = ref(false)
const heroInitial = computed(() => (site.aboutName || site.name || 'K').slice(0, 1))

function resolveUrl(url) {
  if (!url) return ''
  if (/^(https?:)?\/\//.test(url) || url.startsWith('mailto:')) return url
  const base = import.meta.env.BASE_URL || '/'
  return `${base.replace(/\/+$/, '/')}${url.replace(/^\/+/, '')}`
}

// 滚动入场动画：仅作用于带 .reveal 的区块，Hero 首屏不参与
useReveal()
</script>

<template>
  <div>
    <!-- Hero 展示区：网格纹理 + indigo→violet→cyan 径向渐变光晕 -->
    <section class="hero">
      <div class="container hero__inner">
        <div class="hero__content">
          <div class="hero__brand-row">
            <span class="hero__avatar">
              <img
                v-if="site.avatar && !avatarFailed"
                :src="resolveUrl(site.avatar)"
                :alt="`${site.aboutName} 的头像`"
                @error="avatarFailed = true"
              />
              <span v-else aria-hidden="true">{{ heroInitial }}</span>
            </span>
            <h1 class="hero__title">{{ site.heroTitle }}</h1>
          </div>
          <p class="hero__subtitle">{{ site.heroSubtitle }}</p>

          <div class="hero__actions">
            <RouterLink class="btn btn--primary" to="/projects">看作品</RouterLink>
            <RouterLink class="btn" to="/posts">读文章</RouterLink>
          </div>

          <div class="hero__socials">
            <a
              class="hero__social"
              :href="site.github"
              target="_blank"
              rel="noopener"
              aria-label="GitHub"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.25 3.34.95.1-.74.4-1.25.72-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 2.87-.39c.97 0 1.95.13 2.87.39 2.19-1.49 3.15-1.18 3.15-1.18.62 1.58.23 2.75.11 3.04.73.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.66.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.21.67.8.56A11.52 11.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"
                />
              </svg>
              <span>GitHub</span>
            </a>
            <a class="hero__social" :href="`mailto:${site.email}`" aria-label="Email">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"
                />
              </svg>
              <span>Email</span>
            </a>
          </div>
        </div>
      </div>
    </section>

    <section class="container section reveal">
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

    <section class="container section reveal">
      <div class="section__head">
        <h2 class="section__title">最新文章</h2>
        <RouterLink class="section__more" to="/posts">全部文章 →</RouterLink>
      </div>

      <div class="post-list">
        <div class="post-list__filters">
          <TagChips v-model="homeTag" :tags="allTags" />
        </div>
        <PostListItem v-for="post in filteredLatest" :key="post.slug" :post="post" />
      </div>

      <p v-if="!filteredLatest.length" class="muted">
        <template v-if="homeTag">该标签下暂无文章。</template>
        <template v-else>还没有文章。在 <code>src/content/posts/</code> 下新建一个 .md 就会出现。</template>
      </p>
    </section>

    <!-- 关于我：作品 → 文章 → 人 -->
    <section class="container section reveal">
      <div class="section__head">
        <h2 class="section__title">关于我</h2>
      </div>

      <div class="about">
        <span class="about__avatar">
          <img
            v-if="site.avatar && !avatarFailed"
            :src="resolveUrl(site.avatar)"
            :alt="`${site.aboutName} 的头像`"
            @error="avatarFailed = true"
          />
          <span v-else aria-hidden="true">{{ heroInitial }}</span>
        </span>

        <div class="about__body">
          <p class="about__headline">{{ site.aboutHeadline }}</p>
          <div class="about__socials">
            <a class="hero__social" :href="site.github" target="_blank" rel="noopener" aria-label="GitHub">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.25 3.34.95.1-.74.4-1.25.72-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 2.87-.39c.97 0 1.95.13 2.87.39 2.19-1.49 3.15-1.18 3.15-1.18.62 1.58.23 2.75.11 3.04.73.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.66.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.21.67.8.56A11.52 11.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"
                />
              </svg>
              <span>GitHub</span>
            </a>
            <a class="hero__social" :href="`mailto:${site.email}`" aria-label="Email">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"
                />
              </svg>
              <span>Email</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* ===== Hero 展示区 ===== */
.hero {
  position: relative;
  overflow: hidden;
  padding: var(--space-6) 0 calc(var(--space-6) + var(--space-2));
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  background-color: var(--surface);
  /* 网格纹理 + accent→accent-2 径向渐变光晕（颜色随主题令牌） */
  background-image:
    radial-gradient(ellipse 55% 60% at 15% 0%, color-mix(in srgb, var(--accent) 28%, transparent), transparent 62%),
    radial-gradient(ellipse 48% 52% at 84% 8%, color-mix(in srgb, var(--accent-2) 22%, transparent), transparent 60%),
    radial-gradient(ellipse 42% 46% at 55% 100%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 62%),
    linear-gradient(color-mix(in srgb, var(--accent) 14%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in srgb, var(--accent) 14%, transparent) 1px, transparent 1px);
  background-size: auto, auto, auto, 44px 44px, 44px 44px;
}

.hero__content {
  max-width: var(--content-width);
}

.hero__brand-row {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-3);
}

.hero__avatar,
.about__avatar {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 60px;
  height: 60px;
  overflow: hidden;
  border-radius: 50%;
  background: var(--accent);
  color: var(--accent-contrast);
  font-size: 1.45rem;
  font-weight: 700;
  box-shadow: 0 0 0 3px var(--bg), 0 10px 24px -10px color-mix(in srgb, var(--accent) 60%, transparent);
}

.hero__avatar img,
.about__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero__title {
  margin: 0;
  font-size: clamp(2.6rem, 6vw, 4rem);
  line-height: 1.1;
  letter-spacing: -0.02em;
  /* 标题渐变文字：accent → accent-2（渐变令牌落地） */
  background: var(--gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero__subtitle {
  max-width: var(--content-width);
  margin-bottom: var(--space-5);
  font-size: 1.08rem;
  line-height: 1.7;
  /* 渐变文字：正文色 → accent → accent-2 */
  background: linear-gradient(90deg, var(--text) 0%, var(--accent) 55%, var(--accent-2) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.hero__socials {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.hero__social {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  background: var(--bg);
  color: var(--text-muted);
  font-size: 13.5px;
  transition: border-color 0.2s ease, color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.hero__social svg {
  width: 15px;
  height: 15px;
  fill: currentColor;
}

.hero__social:hover {
  color: var(--accent);
  border-color: var(--accent);
  transform: translateY(-1px);
  box-shadow: 0 8px 20px -10px rgba(99, 102, 241, 0.5);
  text-decoration: none;
}

/* ===== 区块 ===== */
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

.post-list__filters {
  margin-bottom: var(--space-3);
}

/* ===== 关于我 ===== */
.about {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  padding: var(--space-5) var(--space-6);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  background: var(--surface);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.about:hover {
  border-color: var(--accent-2);
  box-shadow: 0 0 0 1px var(--accent-2), var(--shadow-card),
    0 12px 28px -14px color-mix(in srgb, var(--accent-2) 45%, transparent);
}

.about__body {
  min-width: 0;
}

.about__headline {
  margin: 0 0 var(--space-3);
  font-size: 1.05rem;
  line-height: 1.6;
}

.about__socials {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

@media (max-width: 480px) {
  .hero__title {
    font-size: 1.8rem;
  }

  .hero__avatar,
  .about__avatar {
    width: 48px;
    height: 48px;
    font-size: 1.2rem;
  }

  .about {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-4);
  }
}
</style>
