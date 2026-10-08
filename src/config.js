/**
 * 站点级配置 —— 全站唯一的"站点名"出处。
 *
 * 需要替换的信息都集中在这里：
 * 导航左侧站点名、页脚版权、浏览器标签标题全部读 site.name，
 * 改这一处即可全站生效（index.html 里的 <title> 只是 JS 执行前的占位）。
 */
export const site = {
  // 占位：换成你自己的站点名
  name: '站点名待定',

  // 首页 Hero 文案，用户可自行替换
  heroTitle: '写代码，也写字。',
  heroSubtitle: '全栈工程师。这里放我做过的东西，和一些想清楚了的废话。',

  // 占位：换成你的 GitHub 用户名，页脚链接与项目源码链接都由此派生
  githubUser: 'Kam-hud',

  // 关于页
  aboutName: '你的名字',
  aboutHeadline: '全栈工程师 / 主要写前端，偶尔写后端',
  email: 'you@example.com',
  avatar: '', // 头像图片路径，留空则用首字母色块兜底
  resume: '', // 简历 PDF 路径（如 /resume.pdf），留空则不渲染该按钮，不产生死链
}

// 由用户名派生，避免两处维护
site.github = `https://github.com/${site.githubUser}`
