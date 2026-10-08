import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 仓库命名为 <username>.github.io（用户主页仓库）时，站点根路径即 '/'。
// 若改用 blog 这类项目仓库，根路径会变成 '/blog/'，把下面的 base 同步改掉即可。
export default defineConfig({
  base: '/',
  plugins: [vue()],
})
