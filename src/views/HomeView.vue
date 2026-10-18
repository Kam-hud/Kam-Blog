<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { latestPosts } from '../composables/usePosts'
import { featuredProjects } from '../composables/useProjects'
import { useReveal } from '../composables/useReveal'
import { site } from '../config'

const FEATURED_SLOTS = 3

const featured = featuredProjects(FEATURED_SLOTS)
const latest = latestPosts(5)

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

// ---- 底部卡片数据：最新文章 / 近期项目 ----
const latestTop = computed(() => latest[0] || null)
const featuredTop = computed(() => featured[0] || null)

// ---- 图片卡：展示头像大图（无头像时用首字母渐变占位），点击进入图片子页 /gallery 查看 ----

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

// ---- 社交链接解析：空 href 时按图标派生（GitHub 自动补全；Email 点击复制地址，不跳转） ----
const socialLinks = computed(() =>
  (site.socials || []).map((item) => {
    let href = item.href || ''
    if (!href && item.icon === 'github') href = `https://github.com/${site.githubUser}`
    return { ...item, href }
  }),
)

// ---- 邮箱复制：点击邮箱图标复制 site.email 到剪贴板，按钮文字短暂变为"已复制" ----
const emailCopied = ref(false)
let emailCopiedTimer = null
function copyEmail() {
  const text = site.email || ''
  const done = () => {
    emailCopied.value = true
    clearTimeout(emailCopiedTimer)
    emailCopiedTimer = setTimeout(() => {
      emailCopied.value = false
    }, 2000)
  }
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done))
  } else {
    fallbackCopy(text, done)
  }
}
function fallbackCopy(text, done) {
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  try {
    document.execCommand('copy')
  } catch (e) {
    /* noop */
  }
  document.body.removeChild(ta)
  done()
}
function onSocialClick(item) {
  if (item.icon === 'email') copyEmail()
}

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
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
  clearTimeout(writeToastTimer)
  clearTimeout(emailCopiedTimer)
})
</script>

<template>
  <div class="home-page">
    <div class="container home-layout">
      <!-- 主区域：卡片自由错落摆放（flex 流式 + 各卡宽度/错位不同，不重叠） -->
      <div class="home-main">
        <div class="home-cards">
          <!-- 图片卡：问候卡上方，点击进入图片子页 /gallery -->
          <RouterLink
            to="/gallery"
            class="image-card glass-card reveal"
            aria-label="查看图片图集"
          >
            <img
              v-if="site.avatar && !avatarFailed"
              :src="resolveUrl(site.avatar)"
              :alt="`${site.aboutName} 的头像大图`"
              @error="avatarFailed = true"
            />
            <div v-else class="image-card__placeholder">
              <span class="image-card__initial" aria-hidden="true">{{ heroInitial }}</span>
              <span class="image-card__hint">查看图集</span>
            </div>
            <span class="image-card__badge">PHOTO</span>
            <span class="image-card__cta" aria-hidden="true">点击查看图集 →</span>
          </RouterLink>

          <!-- 问候卡：只保留问候语（动态问候 + 标题 + 副标题），其余元素已移出/隐藏 -->
          <section class="intro-card glass-card reveal">
            <img 
              v-if="site.avatar && !avatarFailed"
              :src="resolveUrl(site.avatar)" alt="头像"
              class="intro-card__avatar"
              @error="avatarFailed = true"
            >
            <div class="intro-card__text">
              <p class="intro-card__greeting">{{ greeting }}</p>
              <h2 class="intro-card__title">{{ site.heroTitle }}</h2>
            </div>
          </section>

          <!-- 写文章独立卡片 -->
          <section class="write-card glass-card reveal">
            <button class="btn btn--primary write-card__btn" type="button" @click="onWriteClick">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="iconPath('post')" /></svg>
              写文章
            </button>
          </section>

          <!-- 时间卡：问候卡右边（写文章按钮 + 实时数字时钟 + 日期） -->
          <section class="clock-card glass-card reveal">
            <span class="clock-card__label">LOCAL TIME</span>
            <div class="clock-card__time">
              <span class="clock-card__digit">{{ clockText }}</span>
              <span class="clock-card__sec">{{ clockSeconds }}</span>
            </div>
            <span class="clock-card__date">{{ dateText }}</span>
          </section>

          <!-- 近期项目 -->
          <section class="dash-card dash-card--project glass-card reveal">
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

        </div>

        <!-- 横向错落三卡：最新文章 / 社交 / 播放器，位于侧导航与问候卡下方同一行区域 -->
        <div class="home-stagger">
          <!-- 最新文章 -->
          <section class="dash-card dash-card--latest glass-card reveal">
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

          <!-- 社交 -->
          <section class="dash-card dash-card--social glass-card reveal">
            <div class="dash__socials">
              <a
                v-for="s in socialLinks"
                :key="s.label"
                class="dash__social"
                :href="s.icon === 'email' ? undefined : s.href"
                :target="s.icon === 'email' ? undefined : '_blank'"
                :rel="s.icon === 'email' ? undefined : 'noopener'"
                :aria-label="s.icon === 'email' ? '复制邮箱地址' : `${s.label}（新窗口打开）`"
                @click="onSocialClick(s)"
                @keydown.enter="onSocialClick(s)"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="iconPath(s.icon)" /></svg>
                {{ s.icon === 'email' && emailCopied ? '已复制' : s.label }}
              </a>
            </div>
          </section>

          <!-- 播放器 -->
          <section class="dash-card dash-card--player glass-card reveal">
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
            </div>
            <audio
              ref="audioEl"
              :src="resolveUrl(site.player?.src)" 
              @timeupdate="onAudioTime"
              @ended="onAudioEnded"
              @play="playerState.playing = true"
              @pause="playerState.playing = false"
            ></audio>
          </section>
        </div>

        <!-- 写文章待配置提示 -->
        <div v-if="writeToast" class="write-toast" role="status">{{ writeToast }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ===== 全页暖色渐变背景已提升至全局（base.css body），此处不再重复 ===== */
.home-page {
  min-height: 100vh;
}

/* ===== 页面骨架：主区域全宽；relative+top 视觉下移使问候卡位于视口垂直中心（不撑高布局，保证一屏无滚动）
   导航已提升为全局常驻组件（App.vue .global-nav 固定定位覆盖在问候卡左侧，位置与本容器对齐） ===== */
.home-layout {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  max-width: none;
  margin: 0;
  position: relative;
  top: calc(50vh - 275px);
  /* 水平左内边距将问候卡（中列）精确推至视口水平中心（导航已不在文档流内，直接按中列半宽推导）：
     L = 50vw - 中列半宽(16.67vw - 91.33) = 33.33vw + 91.33 */
  padding: 10px 0 0 calc(33.33vw + 91.33px);
}

/* 主区域：内容全宽（列宽由 home-cards 动态计算，保证问候卡中列精确对准视口中心） */
.home-main {
  flex: 1 1 auto;
  min-width: 0;
  max-width: none;
  margin: 0;
  position: relative;
}

/* ===== 左侧垂直导航已提升为全局组件 SiteNav（App.vue 常驻），样式移至该组件 ===== */

/* ===== 主区域卡片流：5 列（左列/间隙/中列/间隙/右列），问候卡居于中间行中列（精确对准视口中心），其余卡片四周围绕错落 ===== */
.home-cards {
  display: grid;
  grid-template-columns: 0 0 calc(33.33vw - 182.67px) 10px calc(33.33vw + 81.33px);
  grid-template-rows: 132px 250px 132px;
  row-gap: 8px;
  align-items: start;
}

/* 图片卡：问候卡正上方，白色玻璃卡风格，点击进入图片子页 /gallery（hover 提示可点击查看） */
.image-card {
  position: relative;
  display: block;
  grid-column: 3;
  grid-row: 1;
  width: 100%;
  height: 150px;
  margin-top: -24px;
  overflow: hidden;
  padding: 0;
  border-radius: var(--radius-glass);
  text-decoration: none;
  cursor: pointer;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  box-shadow: var(--card-shadow);
  transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;
}

.image-card img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.35s ease;
}

.image-card:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--accent-2) 55%, var(--card-border));
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent-2) 45%, transparent), var(--card-shadow),
    0 16px 40px -16px color-mix(in srgb, var(--accent-2) 45%, transparent);
}

.image-card:hover img {
  transform: scale(1.05);
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

/* hover 提示：默认隐藏在卡片底部，悬停时浮现“点击查看图集” */
.image-card__cta {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 10px;
  padding: 5px 10px;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.9);
  color: var(--accent);
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-align: center;
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.image-card:hover .image-card__cta {
  opacity: 1;
  transform: translateY(0);
}

/* 问候卡：仅问候语（动态问候 + 标题 + 副标题），内容垂直居中，高度与左侧导航一致保证底边平行 */
.intro-card {
  grid-column: 3;
  grid-row: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 250px;
  padding: var(--space-4);
  border-radius: var(--radius-glass);
  text-align: center;
}

.intro-card__avatar {
  width: 72px;             
  height: 72px;            
  border-radius: 50%;      
  object-fit: cover;       
  margin-bottom: var(--space-4);  
  box-shadow: 0 0 0 3px var(--bg), 0 10px 24px -10px color-mix(in srgb, var(--accent) 55%, transparent);
  flex: 0 0 auto;        
}

.intro-card__greeting {
  margin: 0 0 var(--space-3);
  color: var(--warm-accent);
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.12em;
}

.intro-card__title {
  margin: 0 0 var(--space-3);
  font-size: clamp(1.9rem, 4.5vw, 2.5rem);
  line-height: 1.15;
  letter-spacing: -0.02em;
  background: var(--gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* 写文章按钮 */
.write-card {
  width: 320px;
  grid-column: 5;
  grid-row: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-glass);
  text-align: center;
  /* 可选：和图片卡对齐，图片卡有 margin-top: -24px */
  margin-top: 0;
}

.write-card__btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
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

/* ===== 时间卡：问候卡右边错落 ===== */
.clock-card {
  position: relative;
  grid-column: 5;
  grid-row: 2;
  width: 320px;
  margin-top: 26px;
  padding: var(--space-4);
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
  font-size: 2.2rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  line-height: 1;
}

.clock-card__sec {
  font-family: var(--font-display);
  color: var(--text-muted);
  font-size: 0.9rem;
  font-variant-numeric: tabular-nums;
}

.clock-card__date {
  color: var(--text-muted);
  font-size: 12px;
}

/* ===== 环绕卡片：最新文章 / 近期项目 / 播放器 / 社交（问候卡四周围绕错落） ===== */
.dash-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 320px;
  padding: var(--space-4);
  border-radius: var(--radius-glass);
}

/* 近期项目卡：问候卡右下方 */
.dash-card--project { grid-column: 5; grid-row: 3; margin-top: 18px; }

/* ===== 横向错落三卡：最新文章 / 社交 / 播放器（侧导航与问候卡下方同一行区域，垂直偏移形成错落）
   绝对定位于 home-main 底部，不参与文档流高度，避免撑高布局破坏侧导航与问候卡的平行对齐 */
.home-stagger {
  position: absolute;
  left: -246px;
  right: auto;
  top: calc(100% - 114px);   
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 72px;
}

.home-stagger .dash-card {
  flex: 0 0 290px;
  min-width: 296px;
  min-height: 140px;
}

/* 社交 / 播放器：比最新文章卡更小 */
.home-stagger .dash-card--social,
.home-stagger .dash-card--player {
  flex: 0 0 180px;   
  height: 100px;      
  min-width: 0;            
  min-height: auto;         
  padding: var(--space-2) var(--space-3);   
  gap: 0;
  align-items: center;
  text-align: center;
  justify-content: center;
}

.home-stagger .dash-card--player .player {
  width: 100%;
  gap: 0;              
}

.home-stagger .dash-card--player .player__song {
  margin: 0;            
  line-height: 1.2;
}

.home-stagger .player__controls {
  gap: 5px;
}

.home-stagger .player__btn {
  width: 24px;
  height: 24px;
}

.home-stagger .player__btn svg {
  width: 12px;
  height: 12px;
}

.home-stagger .player__time {
  font-size: 10px;
}

.home-stagger .dash__social {
  padding: 4px 8px;
  font-size: 11px;
}

.home-stagger .dash__social svg {
  width: 12px;
  height: 12px;
}

.dash__label {
  color: var(--warm-accent);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1em;
}

.dash__title {
  margin: 0 0 var(--space-2);
  font-size: 0.9rem;
  line-height: 1.45;
}

.dash__text {
  margin: 0;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.5;
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
  margin-top: 10px;
  font-weight: 600;
  color: var(--text);
  font-size: 12px;
}

.player__controls {
  display: flex;
  align-items: center;
}

.player__btn {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
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
  height: 5px;
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
    margin-top: 0;
    position: static;
    /* 重置桌面推导内边距（33.33vw + 91.33px 在窄屏会推飞内容导致横向溢出） */
    padding: 10px 16px 0;
  }

  .home-main {
    max-width: 100%;
  }

  /* 窄屏回归流式布局：grid 区域失效，按文档顺序换行排列 */
  .home-cards {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: center;
    gap: var(--space-4);
    padding-bottom: var(--space-5);
  }

  /* 三卡同步换行：横向错落仅保留在桌面布局，窄屏按 2+1 流式排布 */
  .home-stagger {
    position: static;
    flex-wrap: wrap;
    margin-top: var(--space-4);
  }

  .home-stagger .dash-card {
    flex-basis: calc(50% - var(--space-4) / 2);
    margin-top: 0;
  }

  .intro-card {
    height: auto;
    min-height: 240px;
  }
}

@media (max-width: 760px) {
  .image-card,
  .intro-card,
  .clock-card,
  .dash-card {
    flex-basis: 100%;
    margin-top: 0;
    margin-left: 0;
    margin-right: 0;
  }

  /* 覆盖桌面固定卡宽与最小宽度，窄屏单列通栏不溢出 */
  .write-card,
  .clock-card,
  .dash-card {
    width: 100%;
    min-width: 0;
  }

  .home-stagger {
    gap: var(--space-3);
  }

  .home-stagger .dash-card {
    flex-basis: 100%;
    min-width: 0;
  }
}

@media (max-width: 480px) {
  .intro-card {
    padding: var(--space-4);
  }
}
</style>
