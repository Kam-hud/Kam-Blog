import { onBeforeUnmount, onMounted } from 'vue'

/**
 * 轻量滚动入场动画 composable。
 * 用 IntersectionObserver 给目标元素（默认 .reveal）添加 .reveal--in，
 * 配合 base.css 里的 .reveal transition 完成淡入上移；进入视口后即解除观察。
 * 首屏元素（如 Hero）不要加 .reveal，直接显示。
 */
export function useReveal(selector = '.reveal', options = {}) {
  let observer = null

  onMounted(() => {
    const els = [...document.querySelectorAll(selector)]

    if (!('IntersectionObserver' in window)) {
      // 老环境降级：直接全部显示，不阻塞内容
      els.forEach((el) => el.classList.add('reveal--in'))
      return
    }

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal--in')
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -36px 0px', ...options }
    )

    els.forEach((el) => observer.observe(el))
  })

  onBeforeUnmount(() => {
    if (observer) observer.disconnect()
  })
}
