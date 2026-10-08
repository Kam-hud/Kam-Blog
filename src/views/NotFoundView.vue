<script setup>
import { watchEffect } from 'vue'
import { site } from '../config'

// 同一个组件既用于未匹配路由，也用于详情页找不到对应条目
watchEffect(() => {
  document.title = `页面不存在 · ${site.name}`
})
</script>

<template>
  <div class="container container--narrow nf">
    <p class="nf__code">404</p>
    <h1 class="nf__title">页面不存在</h1>
    <p class="nf__desc">可能链接写错了，也可能我删了。</p>
    <div class="nf__actions">
      <RouterLink class="btn btn--primary" to="/">回首页</RouterLink>
      <RouterLink class="btn" to="/posts">读文章</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.nf {
  padding: var(--space-6) 20px;
  text-align: center;
}

.nf__code {
  margin: 0 0 var(--space-2);
  color: var(--border);
  font-family: var(--font-mono);
  font-size: 4rem;
  font-weight: 700;
  line-height: 1;
}

.nf__title {
  font-size: 1.4rem;
}

.nf__desc {
  color: var(--text-muted);
}

.nf__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-3);
  margin-top: var(--space-5);
}
</style>
