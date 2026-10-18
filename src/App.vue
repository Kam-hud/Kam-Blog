<script setup>
// 布局骨架：常驻导航 / 路由出口，全站只此一处
// 导航常驻渲染：首页为左侧垂直导航，点击导航项跳转子页面时，
// 由 .global-nav 切换定位 + SiteNav 切换形态，CSS transition 平滑过渡到左上方横向展示
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SiteNav from './components/SiteNav.vue'

const route = useRoute()
const isHome = computed(() => route.name === 'home')
const navMode = computed(() => (isHome.value ? 'home' : 'sub'))
</script>

<template>
  <div class="app-shell">
    <div class="global-nav" :class="{ 'global-nav--sub': !isHome }">
      <SiteNav :mode="navMode" />
    </div>
    <main class="app-main" :class="{ 'app-main--sub': !isHome }">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
/* 常驻导航定位：首页 = 问候卡左侧（垂直居中于主容器，与问候卡同高、底边平行）；
   子页面 = 页面左上方。切换时 left/top 平滑过渡形成移动动画
   top 推导：主容器 top=calc(50vh-275px)+padding10，容器高530，导航高250 居中 →
   top = 50vh-275+10+(530-250)/2 = calc(50vh - 125px) */
.global-nav {
  position: fixed;
  z-index: 50;
  top: calc(50vh - 125px);
  left: calc(33.33vw - 154.67px);
  transition:
    left 0.45s cubic-bezier(0.22, 0.61, 0.36, 1),
    top 0.45s cubic-bezier(0.22, 0.61, 0.36, 1);
}

.global-nav--sub {
  top: 16px;
  left: 16px;
}

/* 子页面为横向导航预留顶部空间，避免内容被固定导航遮挡 */
.app-main--sub {
  padding-top: 88px;
}

@media (max-width: 900px) {
  .global-nav,
  .global-nav--sub {
    top: 8px;
    left: 8px;
    right: 8px;
  }

  .app-main--sub {
    padding-top: 72px;
  }

  /* 首页导航同样转为顶部通栏，需为内容预留空间避免被固定导航遮挡 */
  .app-main:not(.app-main--sub) {
    padding-top: 116px;
  }
}
</style>
