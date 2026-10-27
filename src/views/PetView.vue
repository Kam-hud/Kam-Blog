<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { useRouter } from 'vue-router'
import { site } from '../config'

const router = useRouter()
const stageRef = ref(null)
const progressRef = ref(null)
const bubbleVisible = ref(false)
const bubbleText = ref('')
const loading = ref(true)
const progress = ref(0)

const LINES = site.pet?.quotes?.length
  ? site.pet.quotes
  : ['你好呀，欢迎来玩～', '同赏人间欢喜，共守灯火长明。', '今天的风很温柔呢。', '要一起看夕阳吗？', '我在这里等你哦。']

let renderer, scene, camera, controls, raycaster
let fox, head, body, tail, ears, eyeL, eyeR
let rafId, last, blink = 2.4, modelFailed = false
const mouse = { x: 0, y: 0 }

/* ---------- 场景 ---------- */

function initStage() {
  const el = stageRef.value
  const w = window.innerWidth
  const h = window.innerHeight

  renderer = new THREE.WebGLRenderer({ canvas: el, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.setSize(w, h)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace

  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 50)
  camera.position.set(0, 0.8, 3.2)

  scene.add(new THREE.AmbientLight(0xfff0e6, 0.9))
  const dir = new THREE.DirectionalLight(0xfff4e8, 1.8)
  dir.position.set(2.5, 4, 2.5)
  dir.castShadow = true
  dir.shadow.mapSize.set(1024, 1024)
  scene.add(dir)
  const fill = new THREE.DirectionalLight(0xbcd0ff, 0.5)
  fill.position.set(-3, 1, -2)
  scene.add(fill)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.target.set(0, 0, 0)
  controls.enablePan = false
  controls.minDistance = 2.2
  controls.maxDistance = 6
  controls.minPolarAngle = 0.35
  controls.maxPolarAngle = 1.35
  controls.rotateSpeed = 0.9

  raycaster = new THREE.Raycaster()
  loadModel()
}

/* ---------- GLB 模型加载 ---------- */

function loadModel() {
  const loader = new GLTFLoader()
  loader.load(
    `${import.meta.env.BASE_URL}models/fox-blender.glb`,
    (gltf) => {
      fox = gltf.scene
      fox.traverse((o) => {
        if (o.isMesh) { o.castShadow = true; o.receiveShadow = true }
      })
      scene.add(fox)
      // 绑定动画节点（名称在 Blender 建模时预设）
      head = fox.getObjectByName('head')
      body = fox.getObjectByName('body')
      tail = fox.getObjectByName('tail')
      ears = fox.getObjectByName('ears')
      eyeL = fox.getObjectByName('eyeL')
      eyeR = fox.getObjectByName('eyeR')
      loading.value = false
      last = performance.now()
    },
    (p) => {
      if (p.total) progress.value = Math.round((p.loaded / p.total) * 100)
    },
    (err) => {
      console.error('GLB 加载失败:', err)
      modelFailed = true
      loading.value = false
      progressRef.value && (progressRef.value.textContent = '模型加载失败，请刷新重试')
    }
  )
}

/* ---------- 交互 ---------- */

const ndc = (e) => {
  const r = stageRef.value.getBoundingClientRect()
  return new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1))
}
const onMove = (e) => { const v = ndc(e); mouse.x = v.x; mouse.y = v.y }
const onClick = (e) => {
  if (!fox) return
  raycaster.setFromCamera(ndc(e), camera)
  if (raycaster.intersectObjects(fox, true).length) showBubble()
}
const onKey = (e) => { if (e.key === 'Escape') goHome() }

let bubbleTimer
function showBubble() {
  const line = LINES[Math.floor(Math.random() * LINES.length)]
  bubbleText.value = line
  bubbleVisible.value = true
  speak(line)
  clearTimeout(bubbleTimer)
  bubbleTimer = setTimeout(() => { bubbleVisible.value = false }, 3200)
}
function speak(text) {
  if (!('speechSynthesis' in window)) return
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'zh-CN'; u.rate = 1.05; u.pitch = 1.35
  speechSynthesis.speak(u)
}
const goHome = () => router.push('/')

/* ---------- 动画 ---------- */

function animate(now) {
  rafId = requestAnimationFrame(animate)
  const t = now / 1000
  const dt = Math.min((now - last) / 1000, 0.05)
  last = now

  if (!fox) { controls.update(); renderer.render(scene, camera); return }

  body && (body.position.y = 0.02 + Math.sin(t * 1.6) * 0.015)               // 呼吸
  if (head) {                                                                  // 视线跟随
    head.rotation.y += (mouse.x * 0.22 - head.rotation.y) * dt * 4
    head.rotation.x += (-mouse.y * 0.14 - head.rotation.x) * dt * 4
  }

  blink -= dt
  if (blink < 0) {                                                           // 闭眼窗口 0.16s
    const k = Math.max(0, -blink / 0.16)
    const sy = 1 - Math.sin(k * Math.PI) * 0.92
    eyeL && (eyeL.scale.y = sy)
    eyeR && (eyeR.scale.y = sy)
    if (k >= 1) blink = 2.4 + Math.random() * 3.6
  }

  tail && (tail.rotation.y = Math.sin(t * 2.2) * 0.28)                        // 尾巴摆动
  tail && (tail.rotation.x = 0.02 + Math.sin(t * 2.2 + 0.6) * 0.06)
  ears && (ears.rotation.x = Math.sin(t * 3.4) * 0.05)                        // 耳尖抖动

  controls.update()
  renderer.render(scene, camera)
}

/* ---------- 生命周期 ---------- */

const onResize = () => {
  const w = window.innerWidth
  const h = window.innerHeight
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
}

onMounted(() => {
  initStage()
  window.addEventListener('resize', onResize)
  window.addEventListener('pointermove', onMove)
  stageRef.value.addEventListener('pointerdown', onClick)
  window.addEventListener('keydown', onKey)
  last = performance.now()
  animate(performance.now())
})

onUnmounted(() => {
  cancelAnimationFrame(rafId)
  clearTimeout(bubbleTimer)
  speechSynthesis?.cancel()
  window.removeEventListener('resize', onResize)
  window.removeEventListener('pointermove', onMove)
  stageRef.value?.removeEventListener('pointerdown', onClick)
  window.removeEventListener('keydown', onKey)
  controls?.dispose()
  fox?.traverse((o) => {
    o.geometry?.dispose()
    const m = o.material
    Array.isArray(m) ? m.forEach((x) => x.dispose()) : m?.dispose()
    o.material?.map?.dispose?.()
  })
  renderer?.dispose()
  renderer?.forceContextLoss?.()
})
</script>

<template>
  <div class="pet-stage">
    <canvas ref="stageRef"></canvas>

    <!-- 加载进度（模型加载完成才消失） -->
    <div class="loading" ref="progressRef" v-show="loading">
      <div class="bar"><i :style="{ width: progress + '%' }"></i></div>
      <span>{{ progress }}%</span>
    </div>

    <!-- 台词气泡 -->
    <div class="bubble" v-show="bubbleVisible" :class="{ 'bubble-show': bubbleVisible }">
      {{ bubbleText }}
    </div>

    <!-- 返回 -->
    <button class="back" @click="goHome">← 返回首页</button>
    <div class="hint">拖拽旋转</div>
  </div>
</template>

<style scoped>
.pet-stage {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(160deg, #fff7ef 0%, #ffe9e4 45%, #e8d9ff 100%);
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: grab;
}
canvas:active { cursor: grabbing; }

.loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  text-align: center;
}
.loading .bar {
  height: 4px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.6);
  overflow: hidden;
}
.loading .bar i {
  display: block;
  height: 100%;
  width: 0;
  background: linear-gradient(90deg, #ffb3c1, #b39ddb);
  transition: width 0.2s ease;
}
.loading span {
  display: block;
  margin-top: 10px;
  font-size: 13px;
  color: #8a7a9a;
}

.bubble {
  position: absolute;
  top: 16%;
  left: 50%;
  transform: translateX(-50%);
  max-width: 60vw;
  padding: 14px 22px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(179, 157, 219, 0.35);
  border-radius: 18px;
  box-shadow: 0 8px 24px rgba(150, 120, 180, 0.18);
  font-size: 16px;
  color: #5b4a72;
  backdrop-filter: blur(8px);
  opacity: 0;
  transform: translateX(-50%) translateY(6px) scale(0.94);
  transition: all 0.25s ease;
  pointer-events: none;
}
.bubble.bubble-show {
  opacity: 1;
  transform: translateX(-50%) translateY(0) scale(1);
}

.back {
  position: absolute;
  top: 18px;
  left: 18px;
  padding: 8px 16px;
  border: 1px solid rgba(179, 157, 219, 0.5);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  color: #6b5a8e;
  font-size: 14px;
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition: all 0.2s;
}
.back:hover {
  background: rgba(255, 255, 255, 0.95);
  transform: translateY(-1px);
}

.hint {
  position: absolute;
  bottom: 26px;
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  color: #9b8ab8;
  backdrop-filter: blur(6px);
}

@media (max-width: 480px) {
  .bubble { max-width: 78vw; font-size: 14px; top: 12%; }
  .back { top: 12px; left: 12px; }
}
</style>
