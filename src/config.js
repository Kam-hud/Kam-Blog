/**
 * 站点级配置 —— 全站唯一的"站点名"出处。
 *
 * 需要替换的信息都集中在这里：
 * 导航左侧站点名、页脚版权、浏览器标签标题全部读 site.name，
 * 改这一处即可全站生效（index.html 里的 <title> 只是 JS 执行前的占位）。
 */
export const site = {
  // 站点名：导航左侧、页脚版权、浏览器标签标题都读这里
  name: 'Kam-Blog',

  // 首页 Hero 问候文案，用户可自行替换（定位：个人项目 + 技术文章 + 生活分享）
  avatar:  new URL('./assets/img/header.png', import.meta.url).href,
  heroTitle: "I'm Kam",

  // 占位：换成你的 GitHub 用户名，页脚链接与项目源码链接都由此派生
  githubUser: 'Kam-hud',

  // 关于页
  aboutName: '你的名字',
  aboutHeadline: '全栈工程师 / 主要写前端，偶尔写后端',
  email: 'you@example.com',
  avatar:  new URL('./assets/img/header.png', import.meta.url).href, // 头像图片路径，留空则用首字母色块兜底
  resume: '', // 简历 PDF 路径（如 /resume.pdf），留空则不渲染该按钮，不产生死链

  // 首页动态问候语：按本地时间段切换（6点前=night, 6-12=morning, 12-18=afternoon, 18点后=evening）
  greeting: {
    morning: 'Good Morning',
    afternoon: 'Good Afternoon',
    evening: 'Good Evening',
    night: 'Good Night',
  },

  // 首页左侧垂直导航：
  // - to 指向项目已有的子页面路由（点击 RouterLink 跳转），不新增页面
  navItems: [
    { to: '/posts', label: '近期文章', icon: 'post' },
    { to: '/projects', label: '我的项目', icon: 'project' },
    { to: '/about', label: '关于网站', icon: 'about' },
  ],

  // 写文章按钮：指向博客后台/新建文章页的真实地址；留空则按钮显示“待配置”提示，不猜测个人链接
  writeUrl: '',

  // 首页底部音乐播放器卡：src 留空则显示占位、播放按钮禁用
  player: {
    title: '示例曲目 · 待配置',
    src: '',
  },

  // 首页底部社交卡：href 留空时 GitHub 自动派生 githubUser、Email 自动派生 mailto:email
  socials: [
    { label: 'GitHub', icon: 'github', href: '' },
    { label: 'Email', icon: 'email', href: '' },
  ],

  // 文章点赞写回仓库（GitHub Contents API，零后端）：
  // owner/repo 留空时分别回退到 githubUser 与 Kam-hud.github.io；
  // token 填入有 Contents:write 权限的 PAT 后，点赞才会真正写回仓库的 data/likes.json。
  likes: {
    owner: '',
    repo: '',
    path: 'data/likes.json',
    token: '',
  },
}
