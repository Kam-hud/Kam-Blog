<script setup>
import { ref, watchEffect } from 'vue'
import { site } from '../config'

// 头像缺失时用首字母色块兜底，不留死链
const avatarFailed = ref(false)

watchEffect(() => {
  document.title = `关于 · ${site.name}`
})

function resolveUrl(url) {
  if (!url) return ''
  if (/^(https?:)?\/\//.test(url) || url.startsWith('mailto:')) return url
  const base = import.meta.env.BASE_URL || '/'
  return `${base.replace(/\/+$/, '/')}${url.replace(/^\/+/, '')}`
}

const initial = site.aboutName.slice(0, 1)
</script>

<template>
  <div class="container container--narrow">
    <header class="about__head">
      <div class="about__avatar">
        <img
          v-if="site.avatar && !avatarFailed"
          :src="resolveUrl(site.avatar)"
          :alt="`${site.aboutName} 的头像`"
          @error="avatarFailed = true"
        />
        <span v-else aria-hidden="true">{{ initial }}</span>
      </div>
      <div>
        <h1 class="about__name">{{ site.aboutName }}</h1>
        <p class="about__headline">{{ site.aboutHeadline }}</p>
      </div>
    </header>

    <div class="prose">
      <p>你好，欢迎来这里。</p>
      <p>
        我平时主要写前端，也做一些后端的事。这个站点用 Vue 3 + Vite 搭，
        内容全部是 Markdown，没有评论、没有统计、没有登录——写下来是为了少维护一点。
      </p>
      <p>
        作品区的每个项目都尽量配一个能直接点开的 Demo，也尽量把当时的取舍写清楚，
        因为踩过的坑比结果本身更有参考价值。
      </p>
      <p>如果你对我的项目或者某篇文章有想法，欢迎邮件找我。</p>
    </div>

    <ul class="about__links">
      <li>
        <a class="btn" :href="site.github" target="_blank" rel="noopener">GitHub ↗</a>
      </li>
      <li>
        <a class="btn" :href="`mailto:${site.email}`">Email</a>
      </li>
      <li v-if="site.resume">
        <a class="btn" :href="resolveUrl(site.resume)" target="_blank" rel="noopener">简历 PDF ↗</a>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.about__head {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  margin-bottom: var(--space-6);
}

.about__avatar {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 88px;
  height: 88px;
  overflow: hidden;
  border-radius: 50%;
  background: var(--accent);
  color: var(--accent-contrast);
  font-size: 2rem;
  font-weight: 700;
}

.about__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.about__name {
  margin-bottom: var(--space-1);
  font-size: 1.6rem;
}

.about__headline {
  margin: 0;
  color: var(--text-muted);
  font-size: 14.5px;
}

.about__links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin: var(--space-5) 0 0;
  padding: 0;
  list-style: none;
}

@media (max-width: 480px) {
  .about__head {
    gap: var(--space-4);
  }

  .about__avatar {
    width: 64px;
    height: 64px;
    font-size: 1.5rem;
  }

  .about__name {
    font-size: 1.35rem;
  }
}
</style>
