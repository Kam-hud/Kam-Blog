<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { site } from '../config'

/**
 * 全站导航（唯一渲染实例，由 App.vue 常驻承载）：
 * - mode="home"：垂直导航，固定在首页问候卡左侧（与问候卡同高、底边平行）
 * - mode="sub" ：横向导航，平滑移动到页面左上方（点击导航项跳转子页面时触发过渡）
 * 形态切换由 CSS transition 驱动（位置/尺寸/圆角/阴影平滑过渡，避免生硬跳变）。
 */
const props = defineProps({
  mode: {
    type: String,
    default: 'home',
  },
})

const route = useRoute()
const isSub = computed(() => props.mode === 'sub')

const navItems = computed(() => site.navItems || [])
const activeNav = computed(() => {
  const matched = navItems.value.find(
    (i) => i.to && (route.path === i.to || route.path.startsWith(`${i.to}/`)),
  )
  return matched ? matched.to : ''
})

// 头像徽标：优先读 config.avatar，缺失时首字母色块兜底
const avatarFailed = ref(false)
const heroInitial = computed(() => (site.aboutName || site.name || 'K').slice(0, 1))

function resolveUrl(url) {
  if (!url) return ''
  if (/^(https?:)?\/\//.test(url) || url.startsWith('mailto:')) return url
  const base = import.meta.env.BASE_URL || '/'
  return `${base.replace(/\/+$/, '/')}${url.replace(/^\/+/, '')}`
}

// 内联图标：与首页社交/播放器共用同一套路径
const iconPaths = {
  project: 'M3 3h8v8H3V3zm10 0h8v5h-8V3zM13 10h8v11h-8V10zM3 13h8v8H3v-8z',
  post: 'M6 3h8l6 6v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm7 1.5V9h4.5L13 4.5zM7 12v2h10v-2H7zm0 4v2h7v-2H7z',
  share: 'M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 7.7l5.4-.8L12 2z',
  about: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-7h2v7zm0-9h-2V6h2v2z',
  link: 'M10.6 13.4a4.98 4.98 0 0 0 7.07 0l3.54-3.54a5 5 0 0 0-7.07-7.07l-1.72 1.71.1.1a5 5 0 0 1 .1 7.07l-1.71 1.72.89.01zm3.8-2.8a4.98 4.98 0 0 0-7.07 0L2.79 14.14a5 5 0 0 0 7.07 7.07l1.71-1.71-.1-.1a5 5 0 0 1-.1-7.07l1.71-1.72-.89-.01z',
}
const iconPath = (name) => iconPaths[name] || iconPaths.link
</script>

<template>
  <aside class="site-nav" :class="{ 'site-nav--sub': isSub }">
    <RouterLink to="/" class="site-nav__brand" aria-label="返回首页">
      <span class="site-nav__avatar">
        <img
          v-if="site.avatar && !avatarFailed"
          :src="resolveUrl(site.avatar)"
          :alt="`${site.aboutName} 的头像`"
          @error="avatarFailed = true"
        />
        <span v-else aria-hidden="true">{{ heroInitial }}</span>
      </span>
      <div class="site-nav__id">
        <strong class="site-nav__name">{{ site.name }}</strong>
        <span class="site-nav__role">Developer</span>
      </div>
    </RouterLink>

    <nav class="site-nav__menu">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="site-nav__link"
        :class="{ 'site-nav__link--active': activeNav === item.to }"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="iconPath(item.icon)" /></svg>
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>
  </aside>
</template>

<style scoped>
/* 基础形态（首页垂直导航）：固定宽高，与问候卡同高保证底边平行；
   所有可平滑属性均带过渡，供点击跳转子页面时由 App.vue 切换形态 */
.site-nav {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 240px;
  height: 250px;
  padding: 14px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--card-bg) 100%, white 6%), var(--card-bg) 72%);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-glass);
  box-shadow: var(--card-shadow);
  transition:
    width 0.45s cubic-bezier(0.22, 0.61, 0.36, 1),
    height 0.45s cubic-bezier(0.22, 0.61, 0.36, 1),
    padding 0.45s cubic-bezier(0.22, 0.61, 0.36, 1),
    border-radius 0.45s cubic-bezier(0.22, 0.61, 0.36, 1),
    box-shadow 0.45s cubic-bezier(0.22, 0.61, 0.36, 1),
    background-color 0.3s ease,
    border-color 0.3s ease,
    transform 0.3s ease;
}

/* 顶部柔光：品牌区上方一抹 accent 光晕，增强卡片层次感 */
.site-nav::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  border-radius: var(--radius-glass);
  background: linear-gradient(180deg, color-mix(in srgb, var(--accent-2) 12%, transparent), transparent);
  opacity: 0.55;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.site-nav:hover::before {
  opacity: 1;
}

.site-nav:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--accent-2) 55%, var(--card-border));
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent-2) 45%, transparent), var(--card-shadow),
    0 16px 40px -16px color-mix(in srgb, var(--accent-2) 45%, transparent);
}

/* 横向形态（子页面左上角）：整体收成一行紧凑导航 */
.site-nav--sub {
  flex-direction: row;
  align-items: center;
  gap: 10px;
  width: auto;
  height: 56px;
  padding: 8px 16px;
  border-radius: var(--radius-glass);
}

.site-nav--sub .site-nav__brand {
  margin-bottom: 0;
}

.site-nav--sub .site-nav__avatar {
  width: 34px;
  height: 34px;
  font-size: 0.85rem;
}

.site-nav--sub .site-nav__name {
  font-size: 14px;
}

.site-nav--sub .site-nav__role {
  font-size: 11px;
}

.site-nav--sub .site-nav__menu {
  flex-direction: row;
  gap: 2px;
}

.site-nav--sub .site-nav__link {
  padding: 6px 10px;
  gap: 8px;
  font-size: 14px;
}

.site-nav--sub .site-nav__link svg {
  width: 16px;
  height: 16px;
}

.site-nav__brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: 8px;
  text-decoration: none;
  transition: margin-bottom 0.4s cubic-bezier(0.22, 0.61, 0.36, 1), gap 0.4s cubic-bezier(0.22, 0.61, 0.36, 1);
}

.site-nav__avatar {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  overflow: hidden;
  border-radius: 50%;
  background: var(--gradient);
  color: var(--accent-contrast);
  font-weight: 700;
  font-size: 1rem;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent-2) 22%, transparent), 0 4px 12px -4px color-mix(in srgb, var(--accent-2) 40%, transparent);
  transition:
    width 0.4s cubic-bezier(0.22, 0.61, 0.36, 1),
    height 0.4s cubic-bezier(0.22, 0.61, 0.36, 1),
    font-size 0.4s cubic-bezier(0.22, 0.61, 0.36, 1),
    transform 0.25s ease,
    box-shadow 0.25s ease;
}

.site-nav:hover .site-nav__avatar {
  transform: scale(1.07);
  box-shadow:
    0 0 0 3px color-mix(in srgb, var(--accent-2) 45%, transparent),
    0 0 20px -2px color-mix(in srgb, var(--accent-2) 55%, transparent),
    0 4px 14px -4px color-mix(in srgb, var(--accent-2) 50%, transparent);
}

.site-nav__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.site-nav__id {
  min-width: 0;
}

.site-nav__name {
  display: block;
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: 0.01em;
  transition: font-size 0.4s cubic-bezier(0.22, 0.61, 0.36, 1);
}

.site-nav__role {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
  font-size: 13px;
  letter-spacing: 0.04em;
  transition: font-size 0.4s cubic-bezier(0.22, 0.61, 0.36, 1), opacity 0.3s ease;
}

.site-nav__role::before {
  content: '';
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--accent-2);
  box-shadow: 0 0 8px color-mix(in srgb, var(--accent-2) 70%, transparent);
}

.site-nav__menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: gap 0.4s cubic-bezier(0.22, 0.61, 0.36, 1);
}

.site-nav__link {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 14px;
  border-radius: var(--radius-btn);
  color: var(--text-muted);
  font-size: 15px;
  white-space: nowrap;
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease,
    font-weight 0.2s ease,
    padding 0.35s cubic-bezier(0.22, 0.61, 0.36, 1),
    font-size 0.35s cubic-bezier(0.22, 0.61, 0.36, 1),
    gap 0.35s cubic-bezier(0.22, 0.61, 0.36, 1);
}

/* 左侧指示条：hover 淡入，active 常显 */
.site-nav__link::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 3px;
  height: 14px;
  border-radius: 2px;
  background: linear-gradient(180deg, var(--accent-2), var(--accent));
  opacity: 0;
  transform: translateY(-50%) scaleY(0.4);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.site-nav__link svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
  transition: transform 0.2s ease;
}

.site-nav__link:hover {
  color: var(--accent);
  background: linear-gradient(90deg, color-mix(in srgb, var(--accent-soft) 30%, transparent), var(--accent-soft));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 12%, transparent);
  text-decoration: none;
}

.site-nav__link:hover::before {
  opacity: 1;
  transform: translateY(-50%) scaleY(1);
}

.site-nav__link:hover svg,
.site-nav__link--active svg {
  transform: translateX(2px) scale(1.08);
}

.site-nav__link--active {
  color: var(--accent);
  background: linear-gradient(90deg, var(--accent-soft), color-mix(in srgb, var(--accent-soft) 70%, transparent));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 16%, transparent);
  font-weight: 600;
}

.site-nav__link--active::before {
  opacity: 1;
  transform: translateY(-50%) scaleY(1);
}

/* 窄屏兜底：顶部通栏横向展示，避免固定定位遮挡内容 */
@media (max-width: 900px) {
  .site-nav {
    width: 100%;
    max-width: 100%;
    height: auto;
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px 12px;
    padding: 10px 14px;
  }

  .site-nav__brand {
    margin-bottom: 0;
  }

  .site-nav__menu {
    flex-direction: row;
    flex-wrap: wrap;
  }
}

/* 超窄屏：导航项进一步收紧，避免通栏换行撑破视口 */
@media (max-width: 480px) {
  .site-nav {
    padding: 8px 10px;
  }

  .site-nav__link {
    padding: 6px 8px;
    gap: 6px;
    font-size: 13px;
  }

  .site-nav__link svg {
    width: 16px;
    height: 16px;
  }
}
</style>
