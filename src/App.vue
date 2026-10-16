<script setup>
// 布局骨架：导航 / 路由出口 / 页脚，全站只此一处
import { useRoute } from 'vue-router'
import SiteNav from './components/SiteNav.vue'
import SiteFooter from './components/SiteFooter.vue'
import BackToTop from './components/BackToTop.vue'

// 参考站 anxforever.cn：首页无顶部横向导航，导航集中在左侧垂直栏；子页面保留顶栏
const route = useRoute()
const showSiteNav = () => route.name !== 'home'
</script>

<template>
  <div class="app-shell">
    <SiteNav v-if="showSiteNav()" />
    <main class="app-main">
      <RouterView />
    </main>
    <BackToTop />
    <SiteFooter />
  </div>
</template>
