<script setup>
// 布局骨架：导航 / 路由出口 / 页脚，全站只此一处
import SiteNav from './components/SiteNav.vue'
import SiteFooter from './components/SiteFooter.vue'
import BackToTop from './components/BackToTop.vue'
</script>

<template>
  <div class="app-shell">
    <SiteNav />
    <main class="app-main">
      <RouterView />
    </main>
    <BackToTop />
    <SiteFooter />
  </div>
</template>
