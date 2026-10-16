<script setup>
import ThemeToggle from './ThemeToggle.vue'
import { site } from '../config'

// 子页面导航：复用 config.navItems（首页左侧垂直导航的同一数据源），横向排在页面左上方
const links = (site.navItems || []).map((item) => ({ to: item.to, label: item.label }))
</script>

<template>
  <header class="nav">
    <div class="nav__inner">
      <RouterLink to="/" class="nav__brand">{{ site.name }}</RouterLink>
      <nav class="nav__links" aria-label="主导航">
        <!-- active-class 默认是前缀匹配，详情页也能点亮所属栏目 -->
        <RouterLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="nav__link"
          active-class="nav__link--active"
        >
          {{ link.label }}
        </RouterLink>
        <ThemeToggle />
      </nav>
    </div>
  </header>
</template>

<style scoped>
/* 子页面导航：横向排列、位于页面左侧上方（非顶部通栏），卡片化 */
.nav {
  position: static;
  width: fit-content;
  max-width: calc(100vw - 32px);
  margin: var(--space-4) 0 0 var(--space-4);
  padding: 10px 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius-glass);
  background: var(--card-bg);
  box-shadow: var(--card-shadow);
}

.nav__inner {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-4);
}

.nav__brand {
  color: var(--text);
  font-size: 1.05rem;
  font-weight: 700;
}

.nav__brand:hover {
  color: var(--accent);
  text-decoration: none;
}

.nav__links {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-4);
}

.nav__link {
  color: var(--text-muted);
  font-size: 15px;
}

.nav__link:hover {
  color: var(--text);
  text-decoration: none;
}

.nav__link--active {
  color: var(--text);
  font-weight: 600;
}

@media (max-width: 480px) {
  .nav__links {
    gap: var(--space-3);
  }

  .nav__link {
    font-size: 14px;
  }
}
</style>
