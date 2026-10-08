<script setup>
import ProjectCard from '../components/ProjectCard.vue'
import { projects } from '../composables/useProjects'
</script>

<template>
  <div class="container">
    <div class="page-head">
      <h1 class="page-head__title">作品</h1>
      <p class="page-head__desc">做过的东西，每个都配一个能点开的 Demo。</p>
    </div>

    <div v-if="projects.length" class="grid">
      <ProjectCard v-for="project in projects" :key="project.slug" :project="project" />
    </div>

    <p v-else class="muted">
      还没有项目。在 <code>src/content/projects/</code> 下新建一个 .md 就会出现。
    </p>
  </div>
</template>

<style scoped>
/* 桌面 2 列，<760px 单列 */
.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-5);
}

@media (max-width: 760px) {
  .grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
