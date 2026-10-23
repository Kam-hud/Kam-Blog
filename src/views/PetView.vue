<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { useRouter } from 'vue-router'
import { site } from '../config'

const router = useRouter()
const stageRef = ref(null)
const progressRef = ref(null)
const bubbleVisible = ref(false)
const bubbleText = ref('')

const LINES = site.pet?.quotes?.length
  ? site.pet.quotes
  : ['你好呀，欢迎来玩～', '同赏人间欢喜，共守灯火长明。', '今天的风很温柔呢。', '要一起看夕阳吗？', '我在这里等你哦。']

/* 卡通色阶贴图：全局共享一份 */
const GRAD = (() => {
  const d = new Uint8Array(12)
  ;[250, 205, 150].forEach((v, i) => { d[i*4] = v; d[i*4+1] = v; d[i*4+2] = v; d[i*4+3] = 255 })
  const t = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat)
  t.needsUpdate = true
  return t
})()
const toon = (c) => new THREE.MeshToonMaterial({ color: c, gradientMap: GRAD })

let renderer, scene, camera, controls, raycaster
let fox, head, bodyGrp, tail, eyeL, eyeR, ears
let rafId, last, blink = 2.4
const mouse = { x: 0, y: 0 }

/* ---------- 建模 ---------- */

function mirror(fn) { fn(-1); fn(1) }

function build() {
  fox = new THREE.Group()
  const P = (geo, mat, x = 0, y = 0, z = 0, parent = fox) => {
    const m = new THREE.Mesh(geo, mat)
    m.position.set(x, y, z)
    m.castShadow = true
    parent.add(m)
    return m
  }
  const skin = toon(0xfff0e7)   // 粉调肤色
  const hair = toon(0xfbf7f2)   // 米白发
  const white = toon(0xffffff)  // 纯白外耳/裙边
  const pink = toon(0xffb3c4)   // 内耳粉
  const rose = toon(0xff9db8)   // 裙身粉
  const red = toon(0xe04f6f)    // 蝴蝶结红
  const E = (c, op) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: op })

  /* ---- 身体：Q 版小裙装 ---- */
  bodyGrp = new THREE.Group()
  bodyGrp.add(P(new THREE.CapsuleGeometry(0.4, 0.5, 8, 24), skin))                  // 上身
  bodyGrp.add(P(new THREE.CylinderGeometry(0.42, 0.78, 0.5, 28), rose, 0, -0.02))   // A 字裙（敞，露出腿）
  bodyGrp.add(P(new THREE.TorusGeometry(0.76, 0.06, 8, 32), white, 0, -0.32))       // 裙摆白色花边
  bodyGrp.add(P(new THREE.CylinderGeometry(0.42, 0.48, 0.12, 28), white, 0, 0.08))  // 裙腰白色
  mirror((s) => {                                                                    // 蝴蝶结两翼（更大）
    const wing = P(new THREE.SphereGeometry(0.1, 14, 10), red, 0.14*s, 0.5, 0.36, bodyGrp)
    wing.scale.set(1.7, 0.55, 0.22)
  })
  bodyGrp.add(P(new THREE.SphereGeometry(0.055, 12, 10), red, 0, 0.5, 0.38))        // 蝴蝶结中心
  mirror((s) => {
    bodyGrp.add(P(new THREE.CapsuleGeometry(0.07, 0.34, 6, 16), skin, 0.6*s, 0.2, 0.05))   // 短袖手臂（外伸）
    bodyGrp.add(P(new THREE.CapsuleGeometry(0.09, 0.3, 6, 16), skin, 0.16*s, -0.62))       // 短腿（露出裙摆）
  })
  bodyGrp.position.y = 0.85
  fox.add(bodyGrp)
  // 脖子：头身之间的过渡，消除“不倒翁”圆团感
  fox.add(P(new THREE.CapsuleGeometry(0.15, 0.32, 6, 16), skin, 0, 1.6, 0))

  /* ---- 尾巴：6 节球链，从身侧横向伸出上翘，正面可见，尾尖粉白渐变 ---- */
  tail = new THREE.Group()
  tail.position.set(0.52, 0.8, -0.18)
  const tailR = [0.22, 0.2, 0.18, 0.16, 0.14, 0.12]
  const tailC = [white, hair, hair, hair, toon(0xffcbd8), pink]
  for (let i = 0; i < 6; i++) {
    const t = i / 5
    const seg = P(new THREE.SphereGeometry(tailR[i], 20, 14), tailC[i],
      t * 0.62, t * 0.58 + Math.sin(t * Math.PI) * 0.18, -t * 0.42, tail)
    seg.scale.z = 1.3
  }
  tail.rotation.z = 0.12
  fox.add(tail)

  /* ---- 头 ---- */
  head = new THREE.Group()
  head.position.y = 1.85
  fox.add(head)
  const face = P(new THREE.SphereGeometry(0.46, 32, 24), skin)
  face.scale.set(1, 1.06, 0.96)

  // 后发：两层扁球延伸至肩
  const backHair = P(new THREE.SphereGeometry(0.3, 24, 16), hair, 0, -0.42, -0.38)
  backHair.scale.set(1.4, 1.55, 0.55)
  const backHair2 = P(new THREE.SphereGeometry(0.26, 24, 16), hair, 0, -0.18, -0.44)
  backHair2.scale.set(1.35, 1.3, 0.5)

  // 齐刘海：3 片弧形半球覆盖额头上沿（更大，盖住额头）
  const bangMid = P(new THREE.SphereGeometry(0.44, 32, 12, 0, Math.PI*2, 0, Math.PI*0.36), hair, 0, 0.17, 0.12)
  bangMid.rotation.x = 0.5
  mirror((s) => {
    const bang = P(new THREE.SphereGeometry(0.36, 32, 12, 0, Math.PI*2, 0, Math.PI*0.36), hair, 0.26*s, 0.17, 0.1)
    bang.rotation.x = 0.44
  })

  // 狐耳：更大更高更尖（外耳纯白、内耳粉、外倾、耳尖抖动组）
  ears = new THREE.Group()
  ears.position.y = 0.44
  head.add(ears)
  mirror((s) => {
    const out = P(new THREE.ConeGeometry(0.24, 0.62, 24), white, 0.32*s, 0.1, 0, ears)
    out.rotation.z = -0.18*s
    const inner = P(new THREE.ConeGeometry(0.12, 0.4, 18), pink, 0.32*s, 0.14, 0.06, ears)
    inner.rotation.z = -0.18*s
  })

  // 鬓发：两侧下垂（更粗更长）+ 脸侧发帘（正面可见，勾勒娃娃头轮廓）
  mirror((s) => {
    P(new THREE.CapsuleGeometry(0.12, 0.72, 6, 14), hair, 0.58*s, -0.18, 0.04)
    P(new THREE.CapsuleGeometry(0.1, 0.55, 6, 14), hair, 0.5*s, -0.28, 0.02)
  })

  // 腮红（更明显）
  mirror((s) => {
    const blush = P(new THREE.SphereGeometry(0.075, 16, 12), E(0xff9fb3, 0.7), 0.34*s, -0.03, 0.42)
    blush.scale.set(1, 0.78, 0.28)
  })

  // 眼睛：红瞳大眼 + 高光 + 睫毛（CanvasTexture 贴图动漫眼，球面纹理跟随旋转）
  const mkEye = () => {
    const cv = document.createElement('canvas')
    cv.width = cv.height = 256
    const ctx = cv.getContext('2d')
    ctx.clearRect(0, 0, 256, 256)
    ctx.fillStyle = '#d9445f'                       // 红瞳
    ctx.beginPath(); ctx.arc(128, 128, 100, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#ffffff'                       // 主高光
    ctx.beginPath(); ctx.arc(92, 88, 34, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(160, 154, 15, 0, Math.PI * 2); ctx.fill()  // 小高光
    ctx.strokeStyle = '#3a2430'                     // 上翘睫毛弧
    ctx.lineWidth = 12
    ctx.beginPath(); ctx.arc(128, 118, 92, Math.PI * 1.18, Math.PI * 1.82); ctx.stroke()
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'       // 高光外圈提亮
    ctx.lineWidth = 4
    ctx.beginPath(); ctx.arc(92, 88, 38, 0, Math.PI * 2); ctx.stroke()
    const tex = new THREE.CanvasTexture(cv)
    const g = new THREE.Group()
    const line = P(new THREE.SphereGeometry(0.138, 22, 16), toon(0x3a2430), 0, 0, 0, g)  // 深色眼线球
    line.scale.z = 0.4
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.125, 22, 16), new THREE.MeshBasicMaterial({ map: tex }))
    pupil.position.set(0, 0, 0.005)
    pupil.scale.z = 0.42
    g.add(pupil)
    return g
  }
  eyeL = mkEye(); eyeL.position.set(-0.21, 0.1, 0.42); head.add(eyeL)
  eyeR = mkEye(); eyeR.position.set(0.21, 0.1, 0.42); head.add(eyeR)

  // 上翘睫毛：眼睛上方细弧（随眨眼组一起缩放）
  mirror((s) => {
    const lash = P(new THREE.TorusGeometry(0.145, 0.012, 6, 16, Math.PI * 0.62), toon(0x3a2430), 0.21*s, 0.145, 0.455, head)
    lash.rotation.x = -0.5
    lash.rotation.z = s > 0 ? -0.32 : 0.32
  })

  // 红色发夹（刘海右侧，少女感点缀）
  const clip = P(new THREE.SphereGeometry(0.085, 14, 10), red, 0.26, 0.34, 0.3, head)
  clip.scale.set(1.35, 0.4, 0.55)
  head.add(P(new THREE.SphereGeometry(0.03, 10, 8), toon(0xffffff), 0.26, 0.36, 0.36))

  // 细弯眉毛（随眼位）
  mirror((s) => {
    const brow = P(new THREE.TorusGeometry(0.088, 0.015, 6, 14, Math.PI*0.6), toon(0xc98a6b), 0.21*s, 0.26, 0.42)
    brow.rotation.z = s > 0 ? 0.15 : Math.PI - 0.15
  })

  // 微笑嘴（下弧 ∪，更大更翘更明显）
  const mouth = P(new THREE.TorusGeometry(0.09, 0.026, 8, 24, Math.PI * 0.92), toon(0xc9405f), 0, -0.15, 0.44)
  mouth.rotation.x = Math.PI

  // 呆毛
  P(new THREE.CapsuleGeometry(0.018, 0.34, 4, 8), hair, 0.05, 0.66)

  fox.position.y = -0.52
  fox.scale.set(1.15, 1, 1)   // 横向略拉宽，Q 版剪影更圆润
}

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
  camera.position.set(0, 1.05, 3.6)

  scene.add(new THREE.AmbientLight(0xfff0e6, 0.9))
  const dir = new THREE.DirectionalLight(0xfff4e8, 1.8)
  dir.position.set(2.5, 4, 2.5)
  dir.castShadow = true
  dir.shadow.mapSize.set(1024, 1024)
  scene.add(dir)
  const fill = new THREE.DirectionalLight(0xbcd0ff, 0.5)
  fill.position.set(-3, 1, -2)
  scene.add(fill)

  const base = new THREE.Mesh(new THREE.CircleGeometry(1.5, 48), new THREE.MeshBasicMaterial({ color: 0xfff6ec, transparent: true, opacity: 0.5 }))
  base.rotation.x = -Math.PI / 2
  base.position.y = 0.02
  base.receiveShadow = true
  scene.add(base)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.target.set(0, 0.9, 0)
  controls.enablePan = false
  controls.minDistance = 2.2
  controls.maxDistance = 6
  controls.minPolarAngle = 0.35
  controls.maxPolarAngle = 1.35
  controls.rotateSpeed = 0.9

  raycaster = new THREE.Raycaster()
  build()
  scene.add(fox)
}

/* ---------- 交互 ---------- */

const ndc = (e) => {
  const r = stageRef.value.getBoundingClientRect()
  return new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1))
}
const onMove = (e) => { const v = ndc(e); mouse.x = v.x; mouse.y = v.y }
const onClick = (e) => {
  raycaster.setFromCamera(ndc(e), camera)
  if (raycaster.intersectObjects(fox.children, true).length) showBubble()
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

  bodyGrp.position.y = 0.95 + Math.sin(t * 1.6) * 0.015                    // 呼吸
  head.rotation.y += (mouse.x * 0.22 - head.rotation.y) * dt * 4           // 视线跟随
  head.rotation.x += (-mouse.y * 0.14 - head.rotation.x) * dt * 4

  blink -= dt
  if (blink < 0) {                                                         // 闭眼窗口 0.16s
    const k = Math.max(0, -blink / 0.16)
    eyeL.scale.y = eyeR.scale.y = 1 - Math.sin(k * Math.PI) * 0.92
    if (k >= 1) blink = 2.4 + Math.random() * 3.6
  }

  tail.rotation.y = Math.sin(t * 2.2) * 0.28                               // 尾巴摆动
  tail.rotation.x = 0.02 + Math.sin(t * 2.2 + 0.6) * 0.06
  ears.rotation.x = Math.sin(t * 3.4) * 0.05                               // 耳尖抖动

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
  })
  GRAD.dispose()
  renderer?.dispose()
  renderer?.forceContextLoss?.()
})
</script>

<template>
  <div class="pet-stage">
    <canvas ref="stageRef"></canvas>

    <!-- 加载进度 -->
    <div class="loading" ref="progressRef">
      <div class="bar"><i></i></div>
      <span>0%</span>
    </div> 

    <!-- 台词气泡 -->
    <div class="bubble" v-show="bubbleVisible" :class="{ 'bubble-show': bubbleVisible }">
      {{ bubbleText }}
    </div>

    <!-- 返回 -->
    <button class="back" @click="goHome">← 返回首页</button>
    <div class="hint">拖拽旋转 · 点击互动</div>
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

/* 纯 CSS 加载动画：0.7s 走完进度，0.9s 后整体淡出 */
.loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  text-align: center;
  animation: hide 0.4s ease 0.9s forwards;
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
  animation: load 0.7s ease forwards;
}
@keyframes load { from { width: 0 } to { width: 100% } }
@keyframes hide { to { opacity: 0; visibility: hidden } }
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