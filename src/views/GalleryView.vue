<script setup>
import { ref,computed } from 'vue'
import { site } from '../config'

const images = computed(()=>site.gallery || [])

// 灯箱逻辑
const activeImage = ref(null)
function openImage(img) {
  activeImage.value = img
}
function closeImage(){
  activeImage.value = null
}
</script>

<template>
  <div class="gallery-page">
    <div class="container gallery-container">
      <div class="gallery-grid">
        <figure
          v-for="(img, i) in images"
          :key="i"
          class="gallery-item"
          @click="openImage(img)"
          style="cursor: zoom-in;"
          :style="{
            flexBasis: img.basis,
            transform: `rotate(${img.rot}deg)`,
            marginTop: `${img.rise}px`,
          }"
        >
          <div class="gallery-item__frame" :style="{ aspectRatio: img.ratio }">
            <img :src="img.src" :alt="img.alt" loading="lazy" />
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
  min-height: 100vh;
  padding: 24px 28px 72px;
}

.gallery-container {
  max-width: 1180px;
  margin: 0 auto;
}

/* 错落网格：flex wrap + 不同宽度（basis）/ 垂直偏移（rise）/ 旋转微调（rotate），不重叠且自适应 */
.gallery-grid {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: center;
  gap: 30px 26px;
  padding-top: 10px;
}

.gallery-item {
  flex: 0 1 auto;
  min-width: 0;
}

.gallery-item__frame {
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

@media (max-width: 760px) {
  .gallery-item {
    flex-basis: 46% !important;
  }
}

@media (max-width: 480px) {
  .gallery-item {
    flex-basis: 100% !important;
  }
}
</style>
