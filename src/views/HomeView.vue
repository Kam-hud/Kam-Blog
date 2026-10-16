<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import ProjectCard from '../components/ProjectCard.vue'
import PostListItem from '../components/PostListItem.vue'
import { latestPosts } from '../composables/usePosts'
import { featuredProjects } from '../composables/useProjects'
import { useReveal } from '../composables/useReveal'
import { site } from '../config'

const FEATURED_SLOTS = 3

const featured = featuredProjects(FEATURED_SLOTS)
const latest = latestPosts(5)

// 精选不满 3 个时补虚线占位卡，避免首页看起来像"还没做完"
const placeholderCount = computed(() => {
  if (featured.length >= FEATURED_SLOTS) return 0
  return Math.max(1, FEATURED_SLOTS - featured.length)
})

// ---- 头像徽标：优先读 config.avatar，缺失时首字母色块兜底 ----
const avatarFailed = ref(false)
const heroInitial = computed(() => (site.aboutName || site.name || 'K').slice(0, 1))

function resolveUrl(url) {
  if (!url) return ''
  if (/^(https?:)?\/\//.test(url) || url.startsWith('mailto:')) return url
  const base = import.meta.env.BASE_URL || '/'
  return `${base.replace(/\/+$/, '/')}${url.replace(/^\/+/, '')}`
}

// YYYY-MM-DD → 显示用日期（保留原始格式展示）
function formatDate(date) {
  return date ? date.slice(0, 10) : ''
}

// ---- 实时时钟：数字时钟 + 日期 + 动态问候语（按本地时间段切换） ----
const now = ref(new Date())
let clockTimer = null
const pad = (n) => String(n).padStart(2, '0')
const clockText = computed(() => `${pad(now.value.getHours())}:${pad(now.value.getMinutes())}`)
const clockSeconds = computed(() => pad(now.value.getSeconds()))
const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const dateText = computed(
  () => `${now.value.getMonth() + 1}月${now.value.getDate()}日 ${weekDays[now.value.getDay()]}`,
)
const greeting = computed(() => {
  const h = now.value.getHours()
  if (h < 6) return site.greeting.night
  if (h < 12) return site.greeting.morning
  if (h < 18) return site.greeting.afternoon
  return site.greeting.evening
})

// ---- 左侧垂直导航：全部为路由项（近期文章 / 我的项目 / 关于网站），点击跳转子页面 ----
const navItems = computed(() => site.navItems || [])
const route = useRoute()
const activeNav = computed(() => {
  const matched = navItems.value.find(
    (i) => i.to && (route.path === i.to || route.path.startsWith(`${i.to}/`)),
  )
  return matched ? matched.to : ''
})

// ---- GitHub 贡献图：本地确定性生成 53 周 × 7 天热力矩阵（视觉占位，后续可换真实数据） ----
const ghCells = (() => {
  let seed = 42
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
  const cells = []
  for (let w = 0; w < 53; w++) {
    const col = []
    for (let d = 0; d < 7; d++) {
      const r = rand()
      col.push(r < 0.34 ? 0 : r < 0.6 ? 1 : r < 0.8 ? 2 : r < 0.94 ? 3 : 4)
    }
    cells.push(col)
  }
  return cells
})()

// ---- 底部卡片数据：最新文章 / 近期项目 ----
const latestTop = computed(() => latest[0] || null)
const featuredTop = computed(() => featured[0] || null)

// ---- 图片卡：展示头像大图（无头像时用首字母渐变占位），点击灯箱查看大图 ----
const lightboxOpen = ref(false)
function openLightbox() {
  lightboxOpen.value = true
}
function closeLightbox() {
  lightboxOpen.value = false
}
function onLightboxKey(e) {
  if (e.key === 'Escape') closeLightbox()
}

// ---- 写文章按钮：config.writeUrl 已配置则跳转后台，否则提示待配置（不猜测个人链接） ----
const writeToast = ref('')
let writeToastTimer = null
function onWriteClick() {
  const url = site.writeUrl
  if (url) {
    window.open(resolveUrl(url), '_blank', 'noopener')
    return
  }
  writeToast.value = '写文章入口待配置：在 src/config.js 的 site.writeUrl 填入后台地址后生效'
  clearTimeout(writeToastTimer)
  writeToastTimer = setTimeout(() => {
    writeToast.value = ''
  }, 3200)
}

// ---- 播放器：config.player.src 为空则占位禁用（不产生死链） ----
const playerState = reactive({ playing: false, current: 0, duration: 0 })
const audioEl = ref(null)
const playerReady = computed(() => Boolean(site.player?.src))

function togglePlay() {
  const audio = audioEl.value
  if (!audio || !playerReady.value) return
  if (audio.paused) {
    audio.play()
  } else {
    audio.pause()
  }
}

function onAudioTime() {
  const audio = audioEl.value
  if (!audio) return
  playerState.current = audio.currentTime
  playerState.duration = audio.duration || 0
}

function onAudioEnded() {
  playerState.playing = false
  playerState.current = 0
}

function seekAudio(e) {
  const audio = audioEl.value
  if (!audio || !audio.duration) return
  const rect = e.currentTarget.getBoundingClientRect()
  const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
  audio.currentTime = ratio * audio.duration
}

function formatTime(sec) {
  if (!Number.isFinite(sec) || sec <= 0) return '0:00'
  return `${Math.floor(sec / 60)}:${pad(Math.floor(sec % 60))}`
}

const progressStyle = computed(() => {
  const ratio = playerState.duration ? playerState.current / playerState.duration : 0
  return { width: `${Math.min(100, ratio * 100)}%` }
})

// ---- 社交链接解析：空 href 时按图标派生（GitHub / Email），其余原样 ----
const socialLinks = computed(() =>
  (site.socials || []).map((item) => {
    let href = item.href || ''
    if (!href && item.icon === 'github') href = site.github
    if (!href && item.icon === 'email') href = `mailto:${site.email}`
    return { ...item, href }
  }),
)

// ---- 内联图标：侧栏 / 社交 / 播放器共用 ----
const iconPaths = {
  project: 'M3 3h8v8H3V3zm10 0h8v5h-8V3zM13 10h8v11h-8V10zM3 13h8v8H3v-8z',
  post: 'M6 3h8l6 6v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm7 1.5V9h4.5L13 4.5zM7 12v2h10v-2H7zm0 4v2h7v-2H7z',
  share: 'M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 7.7l5.4-.8L12 2z',
  about: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-7h2v7zm0-9h-2V6h2v2z',
  link: 'M10.6 13.4a4.98 4.98 0 0 0 7.07 0l3.54-3.54a5 5 0 0 0-7.07-7.07l-1.72 1.71.1.1a5 5 0 0 1 .1 7.07l-1.71 1.72.89.01zm3.8-2.8a4.98 4.98 0 0 0-7.07 0L2.79 14.14a5 5 0 0 0 7.07 7.07l1.71-1.71-.1-.1a5 5 0 0 1-.1-7.07l1.71-1.72-.89-.01z',
  github: 'M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.25 3.34.95.1-.74.4-1.25.72-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 2.87-.39c.97 0 1.95.13 2.87.39 2.19-1.49 3.15-1.18 3.15-1.18.62 1.58.23 2.75.11 3.04.73.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.66.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.21.67.8.56A11.52 11.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z',
  email: 'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z',
  play: 'M8 5v14l11-7z',
  pause: 'M6 5h4v14H6zM14 5h4v14h-4z',
}
const iconPath = (name) => iconPaths[name] || iconPaths.link

// 滚动入场动画：仅作用于带 .reveal 的区块，Hero 首屏不参与
useReveal()

onMounted(() => {
  clockTimer = setInterval(() => {
    now.value = new Date()
  }, 1000)
  window.addEventListener('keydown', onLightboxKey)
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
  window.removeEventListener('keydown', onLightboxKey)
  clearTimeout(writeToastTimer)
})
</script>

<template>
  <div class="home-page">
    <div class="container home-layout">
      <!-- ① 左侧垂直导航：站点名 + GENERAL 分组 + 路由菜单（点击跳转子页面） -->
      <aside class="side-nav glass-card reveal">
        <div class="side-nav__brand">
          <span class="side-nav__avatar">
            <img
              v-if="site.avatar && !avatarFailed"
              :src="resolveUrl(site.avatar)"
              :alt="`${site.aboutName} 的头像`"
              @error="avatarFailed = true"
            />
            <span v-else aria-hidden="true">{{ heroInitial }}</span>
          </span>
          <div class="side-nav__id">
            <strong class="side-nav__name">{{ site.name }}</strong>
            <span class="side-nav__role">Developer</span>
          </div>
        </div>

        <span class="side-nav__group">GENERAL</span>

        <nav class="side-nav__menu">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="side-nav__link"
            :class="{ 'side-nav__link--active': activeNav === item.to }"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="iconPath(item.icon)" /></svg>
            <span>{{ item.label }}</span>
          </RouterLink>
        </nav>
      </aside>

      <!-- 主区域：卡片自由错落摆放（flex 流式 + 各卡宽度/错位不同，不重叠） -->
      <div class="home-main">
        <div class="home-cards">
          <!-- 图片卡：问候卡上方，点击灯箱查看大图 -->
          <article
            class="image-card glass-card reveal"
            role="button"
            tabindex="0"
            aria-label="查看大图"
            @click="openLightbox"
            @keydown.enter="openLightbox"
          >
            <img
              v-if="site.avatar && !avatarFailed"
              :src="resolveUrl(site.avatar)"
              :alt="`${site.aboutName} 的头像大图`"
              @error="avatarFailed = true"
            />
            <div v-else class="image-card__placeholder">
              <span class="image-card__initial" aria-hidden="true">{{ heroInitial }}</span>
              <span class="image-card__hint">查看大图</span>
            </div>
            <span class="image-card__badge">PHOTO</span>
          </article>

          <!-- 问候卡：头像 + 动态问候 + 标题副标题（内容居中） -->
          <section class="intro-card glass-card reveal">
            <span class="intro-card__avatar">
              <img
                v-if="site.avatar && !avatarFailed"
                :src="resolveUrl(site.avatar)"
                :alt="`${site.aboutName} 的头像`"
                @error="avatarFailed = true"
              />
              <span v-else aria-hidden="true">{{ heroInitial }}</span>
            </span>
            <p class="intro-card__greeting">{{ greeting }}</p>
            <h2 class="intro-card__title">{{ site.heroTitle }}</h2>
            <p class="intro-card__subtitle">{{ site.heroSubtitle }}</p>
            <div class="intro-card__actions">
              <RouterLink class="btn btn--primary" to="/projects">看作品</RouterLink>
              <RouterLink class="btn" to="/posts">读文章</RouterLink>
            </div>
            <div class="intro-card__socials">
              <a
                v-for="s in socialLinks"
                :key="s.label"
                class="hero__social"
                :href="s.href"
                target="_blank"
                rel="noopener"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="iconPath(s.icon)" /></svg>
                {{ s.label }}
              </a>
            </div>
          </section>

          <!-- 时间卡：上方写文章按钮 + 实时数字时钟 + 日期 -->
          <section class="clock-card glass-card reveal">
            <button class="btn btn--primary write-btn" type="button" @click="onWriteClick">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="iconPath('post')" /></svg>
              写文章
            </button>
            <span class="clock-card__label">LOCAL TIME</span>
            <div class="clock-card__time">
              <span class="clock-card__digit">{{ clockText }}</span>
              <span class="clock-card__sec">{{ clockSeconds }}</span>
            </div>
            <span class="clock-card__date">{{ dateText }}</span>
          </section>

          <!-- GitHub 贡献图卡 -->
          <section class="gh-card glass-card reveal">
            <div class="gh-card__head">
              <span class="gh-card__title">Contributions</span>
              <span class="gh-card__sub">过去一年 · {{ site.githubUser }}</span>
            </div>
            <div class="gh-card__grid" aria-hidden="true">
              <template v-for="(col, wi) in ghCells" :key="wi">
                <span
                  v-for="(v, di) in col"
                  :key="di"
                  class="gh-card__cell"
                  :class="`gh-card__cell--${v}`"
                ></span>
              </template>
            </div>
            <a class="gh-card__user" :href="site.github" target="_blank" rel="noopener">{{ site.githubUser }}</a>
          </section>

          <!-- 最新文章 -->
          <section class="dash-card glass-card reveal">
            <span class="dash__label">最新文章</span>
            <template v-if="latestTop">
              <RouterLink :to="`/posts/${latestTop.slug}`" class="dash__link">
                <h3 class="dash__title">{{ latestTop.title }}</h3>
                <p class="dash__text">{{ latestTop.excerpt }}</p>
                <span class="dash__date">{{ formatDate(latestTop.date) }}</span>
              </RouterLink>
            </template>
            <p v-else class="dash__text">还没有文章，去 <code>src/content/posts/</code> 写一篇吧。</p>
          </section>

          <!-- 近期项目 -->
          <section class="dash-card glass-card reveal">
            <span class="dash__label">近期项目</span>
            <template v-if="featuredTop">
              <RouterLink :to="`/projects/${featuredTop.slug}`" class="dash__link">
                <h3 class="dash__title">{{ featuredTop.title }}</h3>
                <p class="dash__text">{{ featuredTop.summary }}</p>
                <span class="dash__date">{{ featuredTop.tech.join(' · ') }}</span>
              </RouterLink>
            </template>
            <p v-else class="dash__text">还没有项目，去 <code>src/content/projects/</code> 建一个吧。</p>
          </section>

          <!-- 播放器 -->
          <section class="dash-card glass-card reveal">
            <span class="dash__label">播放器</span>
            <div class="player">
              <p class="player__song">{{ site.player?.title || '示例曲目' }}</p>
              <div class="player__controls">
                <button class="player__btn" :disabled="!playerReady" :aria-label="playerState.playing ? '暂停' : '播放'" @click="togglePlay">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="playerState.playing ? iconPath('pause') : iconPath('play')" /></svg>
                </button>
                <div class="player__bar" @click="seekAudio">
                  <div class="player__bar-fill" :style="progressStyle"></div>
                </div>
                <span class="player__time">{{ formatTime(playerState.current) }} / {{ formatTime(playerState.duration) }}</span>
              </div>
              <p class="player__hint">{{ playerReady ? '播放中，可在 config.player 更换曲目' : '示例曲目占位，配置 config.player.src 后启用' }}</p>
            </div>
            <audio
              ref="audioEl"
              :src="site.player?.src"
              @timeupdate="onAudioTime"
              @ended="onAudioEnded"
              @play="playerState.playing = true"
              @pause="playerState.playing = false"
            ></audio>
          </section>

          <!-- 社交 -->
          <section class="dash-card glass-card reveal">
            <span class="dash__label">社交</span>
            <div class="dash__socials">
              <a
                v-for="s in socialLinks"
                :key="s.label"
                class="dash__social"
                :href="s.href"
                target="_blank"
                rel="noopener"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="iconPath(s.icon)" /></svg>
                {{ s.label }}
              </a>
            </div>
          </section>
        </div>

        <!-- 灯箱：点击遮罩 / 关闭按钮 / Esc 关闭 -->
        <div
          v-if="lightboxOpen"
          class="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="图片大图预览"
          @click.self="closeLightbox"
        >
          <button class="lightbox__close" type="button" aria-label="关闭大图" @click="closeLightbox">×</button>
          <img
            v-if="site.avatar && !avatarFailed"
            :src="resolveUrl(site.avatar)"
            :alt="`${site.aboutName} 的头像大图`"
            class="lightbox__img"
          />
          <div v-else class="lightbox__placeholder">
            <span class="lightbox__initial" aria-hidden="true">{{ heroInitial }}</span>
            <span class="lightbox__hint">暂无头像图片，可在 config.avatar 配置</span>
          </div>
        </div>

        <!-- 写文章待配置提示 -->
        <div v-if="writeToast" class="write-toast" role="status">{{ writeToast }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ===== 全页暖色渐变背景：浅灰白底 + 底部暖橙→淡黄渐变（自下而上），叠加顶部光晕 ===== */
.home-page {
  min-height: 100vh;
  background:
    radial-gradient(ellipse 60% 45% at 82% 0%, color-mix(in srgb, var(--accent-2) 14%, transparent), transparent 60%),
    radial-gradient(ellipse 55% 40% at 10% 6%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 58%),
    linear-gradient(to top, var(--page-grad-start) 0%, var(--page-grad-mid) 42%, var(--page-grad-end) 78%);
}

/* ===== 页面骨架：左导航（sticky）+ 主区域，整体水平居中 ===== */
.home-layout {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: var(--space-6);
  max-width: 1440px;
  margin: 0 auto;
  padding-top: var(--space-5);
}

/* 主区域：内容居中 */
.home-main {
  flex: 1 1 auto;
  min-width: 0;
  max-width: 1080px;
  margin: 0 auto;
}

/* ===== 左侧垂直导航 ===== */
.side-nav {
  position: sticky;
  /* 首页无顶部横向导航（参考站 anxforever.cn），sticky 直接吸顶 */
  top: 20px;
  flex: 0 0 auto;
  width: 280px;
  padding: var(--space-6);
  border-radius: var(--radius-glass);
}

.side-nav__brand {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.side-nav__avatar {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  overflow: hidden;
  border-radius: 50%;
  background: var(--gradient);
  color: var(--accent-contrast);
  font-weight: 700;
  font-size: 1.25rem;
}

.side-nav__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.side-nav__id {
  min-width: 0;
}

.side-nav__name {
  display: block;
  font-family: var(--font-display);
  font-size: 17px;
  line-height: 1.3;
}

.side-nav__role {
  display: block;
  color: var(--text-muted);
  font-size: 13px;
  letter-spacing: 0.04em;
}

.side-nav__group {
  display: inline-block;
  margin-bottom: var(--space-4);
  padding: 3px 12px;
  border-radius: var(--radius-pill);
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.12em;
}

.side-nav__menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.side-nav__link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--radius-btn);
  color: var(--text-muted);
  font-size: 16px;
  transition: color 0.15s ease, background-color 0.15s ease;
}

.side-nav__link svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

.side-nav__link:hover {
  color: var(--accent);
  background: var(--accent-soft);
  text-decoration: none;
}

.side-nav__link--active {
  color: var(--accent);
  background: var(--accent-soft);
  font-weight: 600;
}

/* ===== 主区域卡片流：无规则自由错落 ===== */
.home-cards {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: center;
  gap: var(--space-5);
  padding-bottom: var(--space-6);
}

/* 图片卡：独占一行位于问候卡上方，点击灯箱查看大图 */
.image-card {
  position: relative;
  flex: 0 0 100%;
  width: 100%;
  height: 240px;
  margin: 0;
  overflow: hidden;
  padding: 0;
  border-radius: var(--radius-glass);
  cursor: zoom-in;
}

.image-card img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.image-card:hover img {
  transform: scale(1.04);
}

.image-card__placeholder {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  background: var(--gradient);
  color: var(--accent-contrast);
  font-family: var(--font-display);
}

.image-card__initial {
  font-size: 3.4rem;
  font-weight: 700;
}

.image-card__hint {
  position: absolute;
  bottom: 12px;
  font-size: 13px;
  letter-spacing: 0.08em;
}

.image-card__badge {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 3px 10px;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.85);
  color: var(--accent);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
}

/* 问候卡：头像 + 动态问候 + 标题副标题（内容居中） */
.intro-card {
  flex: 0 1 560px;
  padding: var(--space-6);
  border-radius: var(--radius-glass);
  text-align: center;
}

.intro-card__avatar {
  display: grid;
  place-items: center;
  width: 88px;
  height: 88px;
  margin: 0 auto;
  overflow: hidden;
  border-radius: 50%;
  background: var(--gradient);
  color: var(--accent-contrast);
  font-size: 2rem;
  font-weight: 700;
  box-shadow:
    0 0 0 4px var(--bg),
    0 0 0 6px color-mix(in srgb, var(--warm-accent) 55%, transparent),
    0 16px 34px -14px color-mix(in srgb, var(--accent) 55%, transparent);
}

.intro-card__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.intro-card__greeting {
  margin: var(--space-5) 0 0;
  color: var(--warm-accent);
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.intro-card__title {
  margin: var(--space-2) 0 var(--space-3);
  font-size: clamp(2rem, 5vw, 2.9rem);
  line-height: 1.15;
  letter-spacing: -0.02em;
  background: var(--gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.intro-card__subtitle {
  margin-bottom: var(--space-4);
  color: var(--text-muted);
  font-size: 1.02rem;
  line-height: 1.7;
}

.intro-card__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-3);
}

.intro-card__socials {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-2);
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

/* 写文章按钮（时钟卡上方） */
.write-btn {
  position: absolute;
  top: -46px;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.write-btn svg {
  width: 15px;
  height: 15px;
  fill: currentColor;
}

/* ===== 灯箱：图片大图预览 ===== */
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  padding: var(--space-5);
  background: rgba(20, 16, 12, 0.72);
  backdrop-filter: blur(6px);
  animation: lightbox-in 0.2s ease;
}

.lightbox__img {
  max-width: min(92vw, 720px);
  max-height: 84vh;
  border-radius: var(--radius-glass);
  box-shadow: 0 24px 70px -18px rgba(0, 0, 0, 0.55);
  object-fit: contain;
}

.lightbox__placeholder {
  display: grid;
  place-items: center;
  gap: var(--space-3);
  width: min(92vw, 560px);
  height: 320px;
  border-radius: var(--radius-glass);
  background: var(--gradient);
  color: var(--accent-contrast);
  font-family: var(--font-display);
}

.lightbox__initial {
  font-size: 4rem;
  font-weight: 700;
}

.lightbox__hint {
  font-size: 14px;
  letter-spacing: 0.06em;
}

.lightbox__close {
  position: absolute;
  top: 18px;
  right: 22px;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  transition: background-color 0.15s ease, transform 0.15s ease;
}

.lightbox__close:hover {
  background: rgba(255, 255, 255, 0.28);
  transform: rotate(90deg);
}

@keyframes lightbox-in {
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}

/* ===== 写文章待配置提示 ===== */
.write-toast {
  position: fixed;
  left: 50%;
  bottom: 28px;
  transform: translateX(-50%);
  z-index: 90;
  padding: 10px 18px;
  border-radius: var(--radius-pill);
  background: var(--text);
  color: var(--bg);
  font-size: 13.5px;
  box-shadow: 0 12px 30px -10px rgba(0, 0, 0, 0.35);
  animation: toast-in 0.2s ease;
}

@keyframes toast-in {
  from { opacity: 0; transform: translate(-50%, 8px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}

/* ===== 时间卡 ===== */
.clock-card {
  position: relative;
  flex: 0 1 300px;
  margin-top: 72px;
  margin-right: 6px;
  padding: var(--space-5);
  border-radius: var(--radius-glass);
  text-align: center;
}

.clock-card__label {
  color: var(--text-muted);
  font-size: 11px;
  letter-spacing: 0.16em;
}

.clock-card__time {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 6px;
  margin: var(--space-2) 0;
}

.clock-card__digit {
  font-family: var(--font-display);
  font-size: 2.6rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  line-height: 1;
}

.clock-card__sec {
  font-family: var(--font-display);
  color: var(--text-muted);
  font-size: 1rem;
  font-variant-numeric: tabular-nums;
}

.clock-card__date {
  color: var(--text-muted);
  font-size: 13px;
}

/* ===== GitHub 贡献图卡 ===== */
.gh-card {
  flex: 0 1 420px;
  margin-top: 14px;
  margin-left: 26px;
  padding: var(--space-5);
  border-radius: var(--radius-glass);
}

.gh-card__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.gh-card__title {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 700;
}

.gh-card__sub {
  color: var(--text-muted);
  font-size: 12.5px;
}

.gh-card__grid {
  display: grid;
  grid-template-columns: repeat(53, minmax(2px, 1fr));
  gap: 3px;
  overflow: hidden;
}

.gh-card__cell {
  aspect-ratio: 1;
  border-radius: 2px;
  background: var(--gh-cell-0);
}

.gh-card__cell--1 { background: var(--gh-cell-1); }
.gh-card__cell--2 { background: var(--gh-cell-2); }
.gh-card__cell--3 { background: var(--gh-cell-3); }
.gh-card__cell--4 { background: var(--gh-cell-4); }

.gh-card__user {
  display: block;
  margin-top: var(--space-3);
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 12.5px;
  text-align: right;
}

/* ===== 精选项目：Featured 大卡 + 侧边精选卡 ===== */
.featured-grid {
  display: grid;
  grid-template-columns: 1.35fr 1fr;
  gap: var(--space-5);
  align-items: stretch;
}

.featured-grid__side {
  display: grid;
  gap: var(--space-5);
  align-content: stretch;
}

@media (max-width: 900px) {
  .featured-grid {
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

/* ===== 最新文章 ===== */
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
  border-radius: var(--radius-glass);
  background: var(--surface);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.about:hover {
  border-color: var(--accent-2);
  box-shadow: 0 0 0 1px var(--accent-2), var(--shadow-card),
    0 12px 28px -14px color-mix(in srgb, var(--accent-2) 45%, transparent);
}

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

.about__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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

/* ===== 底部卡片流：最新文章 / 近期项目 / 播放器 / 社交（错落摆放） ===== */
.dash-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  flex: 0 1 340px;
  padding: var(--space-5);
  border-radius: var(--radius-glass);
}

.dash-card:nth-child(5) {
  flex: 0 1 380px;
  margin-top: 42px;
  margin-left: 24px;
}

.dash-card:nth-child(6) {
  flex: 0 1 320px;
  margin-top: 18px;
  margin-right: 18px;
}

.dash-card:nth-child(7) {
  flex: 0 1 360px;
  margin-top: 66px;
  margin-left: 12px;
}

.dash-card:nth-child(8) {
  flex: 0 1 300px;
  margin-top: 8px;
  margin-right: 30px;
}

.dash__label {
  color: var(--warm-accent);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1em;
}

.dash__title {
  margin: 0 0 var(--space-2);
  font-size: 1.02rem;
}

.dash__text {
  margin: 0;
  color: var(--text-muted);
  font-size: 13.5px;
  line-height: 1.6;
}

.dash__date {
  color: var(--text-muted);
  font-size: 12px;
}

.dash__link:hover {
  text-decoration: none;
}

.dash__link:hover .dash__title {
  color: var(--accent-2);
}

/* 播放器 */
.player {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.player__song {
  margin: 0;
  font-weight: 600;
  color: var(--text);
  font-size: 14px;
  line-height: 1.4;
}

.player__controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.player__btn {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border: 1px solid var(--border);
  border-radius: 50%;
  background: var(--gradient);
  color: var(--accent-contrast);
  cursor: pointer;
  transition: filter 0.15s ease, transform 0.15s ease;
}

.player__btn:hover:not(:disabled) {
  filter: brightness(1.08);
  transform: scale(1.04);
}

.player__btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.player__btn svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

.player__bar {
  flex: 1 1 auto;
  height: 6px;
  border-radius: 999px;
  background: var(--border);
  cursor: pointer;
  overflow: hidden;
}

.player__bar-fill {
  height: 100%;
  border-radius: 999px;
  background: var(--gradient);
}

.player__time {
  flex: 0 0 auto;
  color: var(--text-muted);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.player__hint {
  margin: 0;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.5;
}

/* 社交 */
.dash__socials {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.dash__social {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  background: var(--bg);
  color: var(--text-muted);
  font-size: 13px;
  transition: border-color 0.15s ease, color 0.15s ease, transform 0.15s ease;
}

.dash__social svg {
  width: 14px;
  height: 14px;
  fill: currentColor;
}

.dash__social:hover {
  color: var(--accent);
  border-color: var(--accent);
  transform: translateY(-1px);
  text-decoration: none;
}

/* ===== 响应式 ===== */
@media (max-width: 1080px) {
  .home-layout {
    flex-direction: column;
    align-items: stretch;
  }

  .home-main {
    max-width: 100%;
  }

  .side-nav {
    position: static;
    width: auto;
    max-width: 420px;
  }

  .side-nav__menu {
    flex-direction: row;
    flex-wrap: wrap;
  }
}

@media (max-width: 760px) {
  .image-card,
  .intro-card,
  .clock-card,
  .gh-card,
  .dash-card {
    flex-basis: 100%;
    margin-top: 0;
    margin-left: 0;
    margin-right: 0;
  }
}

@media (max-width: 480px) {
  .intro-card {
    padding: var(--space-4);
  }

  .intro-card__avatar {
    width: 64px;
    height: 64px;
    font-size: 1.5rem;
  }

  .about {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-4);
  }
}
</style>
