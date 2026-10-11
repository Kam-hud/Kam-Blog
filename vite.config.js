import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 仓库为 Kam-Blog（项目仓库），站点部署在子路径 /Kam-Blog/ 下。
// 若改回 <username>.github.io 主页仓库，把 base 改回 '/' 即可。
export default defineConfig({
  base: '/Kam-Blog/',
  plugins: [vue()],
})
