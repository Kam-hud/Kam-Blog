import { createRouter, createWebHashHistory } from 'vue-router'
import { site } from '../config'

import HomeView from '../views/HomeView.vue'
import ProjectsView from '../views/ProjectsView.vue'
import ProjectDetailView from '../views/ProjectDetailView.vue'
import PostsView from '../views/PostsView.vue'
import PostView from '../views/PostView.vue'
import AboutView from '../views/AboutView.vue'
import NotFoundView from '../views/NotFoundView.vue'

// 使用 hash 模式：URL 中 '#' 之后的部分不参与服务器请求，
// 因此刷新任意页面都不会 404，GitHub Pages 无需任何 rewrite 配置。
const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/projects', name: 'projects', component: ProjectsView, meta: { title: '作品' } },
  { path: '/projects/:slug', name: 'project-detail', component: ProjectDetailView },
  { path: '/posts', name: 'posts', component: PostsView, meta: { title: '文章' } },
  { path: '/posts/:slug', name: 'post', component: PostView },
  { path: '/about', name: 'about', component: AboutView, meta: { title: '关于' } },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView, meta: { title: '页面不存在' } },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
})

// 统一维护浏览器标签标题；详情页会在组件内覆盖为具体标题
router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · ${site.name}` : site.name
})

export default router
