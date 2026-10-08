import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles/tokens.css'
import './styles/base.css'
// 代码高亮主题：本地依赖，不走 CDN
import 'highlight.js/styles/github-dark.css'

createApp(App).use(router).mount('#app')
