<script setup>
import ThemeToggle from './ThemeToggle.vue'
import { site } from '../config'

const links = [
  { to: '/projects', label: '作品' },
  { to: '/posts', label: '文章' },
  { to: '/about', label: '关于' },
]
</script>

<template>
  <header class="nav">
    <div class="container nav__inner">
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
.nav {
  position: sticky;
  top: 0;
  z-index: 20;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
}

.nav__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  min-height: var(--nav-height);
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
