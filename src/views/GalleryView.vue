<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { site } from '../config'

const images = computed(() => site.gallery || [])

// 灯箱逻辑（保留）
const activeImage = ref(null)
function openImage(img) {
  activeImage.value = img
}
function closeImage() {
  activeImage.value = null
}

// ---- 自由散落布局：绝对定位 + 确定性伪随机坐标 / 尺寸 / 角度 ----
const gridEl = ref(null)
const layout = ref([]) // [{ left, top, width, height, rot }]
const gridH = ref(600)

// 确定性伪随机（0~1）：同一种子结果稳定，便于验收复现
function rnd(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}
function rndRange(seed, min, max) {
  return min + rnd(seed) * (max - min)
}
// '4 / 3' → 1.333...
function parseRatio(r) {
  if (typeof r === 'string' && r.includes('/')) {
    const [a, b] = r.split('/').map((s) => parseFloat(s))
    return b ? a / b : 1
  }
  const n = parseFloat(r)
  return Number.isFinite(n) && n > 0 ? n : 1
}

function placeImages() {
  const el = gridEl.value
  const winW = window.innerWidth || 1440
  const winH = window.innerHeight || 900
  const W = el ? el.clientWidth : Math.max(320, winW - 56)
  const gridTop = el ? Math.max(0, el.getBoundingClientRect().top) : 0
  const count = images.value.length
  if (!count) {
    layout.value = []
    gridH.value = Math.max(360, winH - gridTop - 20)
    return
  }
  const mobile = W < 760
  const gap = mobile ? 8 : 12
  // 底部留白（视口底部安全边距）
  const bottomPad = mobile ? 20 : 24
  // 可用散落区域 = 视口高度 - 网格顶部偏移 - 底部留白，全部图片必须落在该区域内
  const usableH = Math.max(280, winH - gridTop - bottomPad)
  // 单屏内放不下时主动缩小尺寸范围，保证全部首屏可见
  const minW = mobile ? 108 : 200
  const maxW = mobile ? Math.min(196, W - 28) : Math.min(340, W - 40)
  const rotMax = mobile ? 4 : 6
  const items = []
  const placed = [] // { left, top, width, height }

  for (let i = 0; i < count; i++) {
    const preset = images.value[i] || {}
    let w = Math.round(rndRange(i * 7 + 3, minW, maxW))
    let h = Math.round(w / parseRatio(preset.ratio))
    let left = 0
    let top = 0
    let ok = false
    // 冲突检测：失败则缩小该图尺寸再重试（最多 3 轮），始终不越出视口
    for (let round = 0; round < 3 && !ok; round++) {
      for (let attempt = 0; attempt < 60; attempt++) {
        const maxLeft = Math.max(0, W - w)
        const maxTop = Math.max(0, usableH - h)
        if (mobile) {
          // 窄屏：x 靠边错落（不溢出），y 在可用高度内自由错落
          left = Math.round(rndRange(i * 31 + attempt + round * 977, 8, Math.max(8, maxLeft)))
          top = Math.round(rndRange(i * 13 + attempt + round * 131, 0, maxTop))
        } else {
          // 桌面：全宽自由坐标 + 视口内自由错落
          left = Math.round(rndRange(i * 31 + attempt + round * 977, 8, Math.max(8, maxLeft)))
          top = Math.round(rndRange(i * 17 + attempt + round * 131, 0, maxTop))
        }
        const noHit = placed.every(
          (p) =>
            left + w + gap <= p.left ||
            left >= p.left + p.width + gap ||
            top + h + gap <= p.top ||
            top >= p.top + p.height + gap,
        )
        if (noHit) {
          ok = true
          break
        }
      }
      if (!ok) {
        w = Math.round(w * 0.8)
        h = Math.round(h * 0.8)
      }
    }
    if (!ok) {
      // 最终兜底：随机落在可用区域内（可能轻微重叠，z-index 保证层级），绝不越出视口
      left = Math.round(rndRange(i * 5 + 7, 0, Math.max(0, W - w)))
      top = Math.round(rndRange(i * 3 + 9, 0, Math.max(0, usableH - h)))
    }
    const rot = Math.round(rndRange(i * 11 + 5, -rotMax, rotMax) * 10) / 10
    items.push({ left, top, width: w, height: h, rot })
    placed.push({ left, top, width: w, height: h })
  }
  // 容器高度 = 可用散落区域高度（单屏），不再向下铺开
  layout.value = items
  gridH.value = Math.round(usableH)
}

function onResize() {
  placeImages()
}

onMounted(() => {
  placeImages()
  window.addEventListener('resize', onResize)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <div class="gallery-page">
    <div class="container gallery-container">
      <div ref="gridEl" class="gallery-grid" :style="{ height: gridH + 'px' }">
        <figure
          v-for="(img, i) in images"
          :key="i"
          class="gallery-item"
          @click="openImage(img)"
          :style="{
            left: (layout[i] ? layout[i].left : 0) + 'px',
            top: (layout[i] ? layout[i].top : 0) + 'px',
            width: (layout[i] ? layout[i].width : 260) + 'px',
            height: (layout[i] ? layout[i].height : 200) + 'px',
            transform: `rotate(${layout[i] ? layout[i].rot : 0}deg)`,
            '--z': i + 1,
          }"
        >
          <div class="gallery-item__frame">
            <img :src="img.src" :alt="img.alt" loading="lazy" decoding="async" />
          </div>
        </figure>
      </div>
    </div>
    <!-- 灯箱 -->
    <div v-if="activeImage" class="gallery-lightbox" @click.self="closeImage">
      <button class="close-btn" @click="closeImage">x</button>
      <img :src="activeImage.src" :alt="activeImage.alt" />
    </div>
  </div>
</template>

<style scoped>
.gallery-page {
  /* 单屏布局：不撑出滚动，容器高度由 placeImages 内联控制 */
  padding: 24px 28px 0;
}

/* 移动端顶部留出导航通栏高度，避免首屏图片被遮挡 */
@media (max-width: 900px) {
  .gallery-page {
    padding-top: 56px;
  }
}

.gallery-container {
  max-width: 1180px;
  margin: 0 auto;
}

/* 散落布局：absolute 自由坐标 + 随机旋转/尺寸，非行列对齐 */
.gallery-grid {
  position: relative;
  margin: 0 auto;
  transition: height 0.3s ease;
}

.gallery-item {
  position: absolute;
  /* 重置 figure 的浏览器默认 margin（1em 40px），保证 left/top 即真实落点 */
  margin: 0;
  cursor: zoom-in;
  z-index: var(--z);
  will-change: transform;
}

.gallery-item__frame {
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 18px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  box-shadow: var(--card-shadow);
  transition: transform 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease;
}

.gallery-item__frame img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gallery-item:hover .gallery-item__frame {
  transform: translateY(-4px) scale(1.02);
  border-color: color-mix(in srgb, var(--accent-2) 55%, var(--card-border));
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent-2) 40%, transparent), var(--card-shadow),
    0 18px 42px -18px color-mix(in srgb, var(--accent-2) 45%, transparent);
}

/* 灯箱样式 */
.gallery-lightbox {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999; 
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
}

.gallery-lightbox img {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain; 
  border-radius: 8px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  transform: none !important; 
  margin: 0;
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 24px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: #fff;
  font-size: 28px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  cursor: pointer;
}
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
</style>
