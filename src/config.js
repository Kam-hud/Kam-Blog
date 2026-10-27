/**
 * 站点级配置 —— 全站唯一的"站点名"出处。
 *
 * 需要替换的信息都集中在这里：
 * 导航左侧站点名、页脚版权、浏览器标签标题全部读 site.name，
 * 改这一处即可全站生效（index.html 里的 <title> 只是 JS 执行前的占位）。
 */
// 1.自动扫描目录下的图片
const photoModules = import.meta.glob('./assets/img/photos/*.{jpg,jpeg,png,webp}',{
  eager: true,
  import: 'default'
})

// 自动排序
const sortedPaths = Object.keys(photoModules).sort((a, b) => a.localeCompare(b, 'zh-CN', { numeric: true }))
const photoUrls = sortedPaths.map(path => photoModules[path])

// 2.散落样式
const layoutPresets = [
  { basis: '32%', ratio: '4 / 3', rot: -2,   rise: 26 },
  { basis: '24%', ratio: '3 / 4', rot: 2.2,  rise: 6 },
  { basis: '26%', ratio: '16 / 10', rot: 1.6, rise: 42 },
  { basis: '30%', ratio: '1 / 1', rot: -2.4, rise: 0 },
  { basis: '22%', ratio: '4 / 5', rot: 0.9,  rise: 34 },
  { basis: '36%', ratio: '3 / 2', rot: -1.2, rise: 18 },
]

// 3.自动组合成最终的数组
const autoGallery = photoUrls.map((url,i) => {
  const preset = layoutPresets[i % layoutPresets.length]
  return {
    src: url,
    alt: `生活照片 ${i + 1}`,
    ...preset
  }
})

export const site = {
  // 站点名：导航左侧、页脚版权、浏览器标签标题都读这里
  name: 'Kam-Blog',

  // 首页 Hero 问候文案，用户可自行替换（定位：个人项目 + 技术文章 + 生活分享）
  avatar:  new URL('./assets/img/header.png', import.meta.url).href,
  heroTitle: "I'm Kam",

  // 占位：换成你的 GitHub 用户名，页脚链接与项目源码链接都由此派生
  githubUser: 'Kam-hud',

  // 关于页
  aboutName: 'Kam',
  aboutHeadline: '',
  email: '3214779709@qq.com',
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
  writeUrl: '/#/write',

  // 首页底部音乐播放器卡：src 留空则显示占位、播放按钮禁用
  player: {
    title: '回到你身边-h3r3刘清云',
    src: new URL('./assets/audio/回到你身边.flac',import.meta.url).href,
  },

  // 首页社交卡：href 留空时 GitHub 自动派生 githubUser；Email 图标为点击复制地址
  socials: [
    { label: 'GitHub', icon: 'github', href: '' },
    { label: 'Email', icon: 'email', href: '' },
  ],

  // 图片集
  gallery : autoGallery,
}