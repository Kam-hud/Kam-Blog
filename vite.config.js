import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { siteDataPlugin } from './scripts/generate-site-data.mjs'

// 仓库为 Kam-Blog（项目仓库），GitHub Pages 部署在子路径 /Kam-Blog/ 下。
// Vercel 构建环境自带 VERCEL=1：走根路径 /，避免资源 404；
// 本地 / GitHub Pages 仍走 /Kam-Blog/。
export default defineConfig({
  base: process.env.VERCEL ? '/' : '/Kam-Blog/',
  plugins: [vue(), siteDataPlugin()],
})
