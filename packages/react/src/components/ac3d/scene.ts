import type { AcForm, AcState } from '@yunlefun-home/air-conditioner-core'
import type { Group, Material, Mesh, Object3D } from 'three'
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js'
import {
  acAirflowAnchors,
  acIconPaths,
  acLouverMotion,
  acModelColors,
  acModelParts,
  getAcDripInterval,
  getAcLedColor,
  getAcMist,
} from '@yunlefun-home/air-conditioner-core'
import {
  Box3,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  HemisphereLight,
  MathUtils,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Mesh as ThreeMesh,
  Vector3,
  WebGLRenderer,
} from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

/** 场景需要的那部分状态 */
export type AcSceneState = Pick<AcState, 'status' | 'mode' | 'temperature' | 'swing'> & { fan?: AcState['fan'] }

export interface AcSceneOptions {
  /** 模型文件地址 */
  modelUrl: (form: AcForm) => string
  /** 一滴冷凝水落下 */
  onDrip?: () => void
  /** 模型加载失败 */
  onError?: (error: unknown) => void
  /** 减弱动态效果：不跑出风、雾气粒子，导风板直接到位 */
  reducedMotion?: boolean
}

export interface AcScene {
  update: (state: AcSceneState) => void
  setForm: (form: AcForm) => void
  dispose: () => void
}

/** 与 CSS 版一致：风速改变出风的快慢与浓淡 */
const fanPace: Record<NonNullable<AcState['fan']>, number> = { auto: 1, low: 1.6, medium: 1.15, high: 0.7 }
const fanStrength: Record<NonNullable<AcState['fan']>, number> = { auto: 1, low: 0.55, medium: 0.8, high: 1 }
/** 扫风一个来回（ms），与 acMotion.duration.swing 一致 */
const swingPeriod = 5200
const airflowCount = 72
const mistCount = 14
const coldAir = new Color('#9fd0ff')
const hotAir = new Color('#ffb37a')
const scratch = new Vector3()

/** 柔边圆点贴图：出风粒子与雾气共用 */
function softDot(size = 64): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const context = canvas.getContext('2d')!
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.4, 'rgba(255,255,255,0.55)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, size, size)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

/**
 * 显示窗贴图：和原生版 ACDisplay 一样，开机时用数码管字体显示模式图标与温度。
 */
function createDisplay() {
  const canvas = document.createElement('canvas')
  canvas.width = 500
  canvas.height = 200
  const context = canvas.getContext('2d')!
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  // glTF 的 UV 原点在左上角
  texture.flipY = false

  function draw(state: AcSceneState) {
    context.fillStyle = '#0f141c'
    context.fillRect(0, 0, canvas.width, canvas.height)
    if (state.status) {
      const color = acModelColors[state.mode]
      context.fillStyle = color
      context.save()
      context.translate(36, 46)
      context.scale(4.4, 4.4)
      context.fill(new Path2D(acIconPaths[state.mode]))
      context.restore()
      context.textAlign = 'right'
      context.textBaseline = 'alphabetic'
      // 暗着的「88」底纹
      context.font = '150px "Digital-7 Mono", ui-monospace, monospace'
      context.fillStyle = 'rgba(255,255,255,0.06)'
      context.fillText('88', 400, 168)
      context.fillStyle = color
      context.fillText(String(state.temperature), 400, 168)
      context.font = '56px "Digital-7 Mono", ui-monospace, monospace'
      context.fillText('°C', 476, 92)
    }
    texture.needsUpdate = true
  }

  return { texture, draw }
}

/** Blender 导出的 PBR 材质换成平面着色的 Lambert，保留低多边形的棱角感（原生版同样处理） */
function toFlat(material: Material): Material {
  const source = material as Material & { color?: Color, emissive?: Color, emissiveIntensity?: number, name: string }
  const flat = new MeshLambertMaterial({
    color: source.color?.clone() ?? new Color('#ffffff'),
    emissive: source.emissive?.clone() ?? new Color('#000000'),
    emissiveIntensity: source.emissiveIntensity ?? 1,
    flatShading: true,
  })
  flat.name = source.name
  material.dispose()
  return flat
}

interface LoadedForm {
  form: AcForm
  root: Group
  louver: Object3D
  /** 实际转动的节点：挂机是导风板本身，柜机是每片百叶 */
  movers: Object3D[]
  /** 柜机出风口里的竖向导风条，扫风时左右摆 */
  vanes: Object3D[]
  led?: MeshLambertMaterial
  /** 出风起点（世界坐标）与出风口宽度 */
  origin: Vector3
  /** 冷凝水挂在这里（导风板下沿） */
  lip: Vector3
  /** 相机看向的中心与需要容纳的尺寸 */
  center: Vector3
  size: Vector3
}

interface Particle {
  life: number
  duration: number
  start: Vector3
  drift: number
}

export function createAcScene(canvas: HTMLCanvasElement, options: AcSceneOptions): AcScene {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = SRGBColorSpace

  const scene = new Scene()
  const camera = new PerspectiveCamera(30, 2, 0.1, 50)
  scene.add(new HemisphereLight('#ffffff', '#b4bccb', 1.7))
  const sun = new DirectionalLight('#ffffff', 1.5)
  sun.position.set(2, 3, 4)
  scene.add(sun)

  const display = createDisplay()
  const dot = softDot()

  // 出风粒子：冷风淡蓝、暖风淡橙，透明度随寿命淡入淡出
  const airflowGeometry = new BufferGeometry()
  const airflowPositions = new Float32Array(airflowCount * 3)
  const airflowColors = new Float32Array(airflowCount * 4)
  airflowGeometry.setAttribute('position', new BufferAttribute(airflowPositions, 3))
  airflowGeometry.setAttribute('color', new BufferAttribute(airflowColors, 4))
  const airflowMaterial = new PointsMaterial({ size: 0.075, map: dot, vertexColors: true, transparent: true, depthWrite: false })
  const airflow = new Points(airflowGeometry, airflowMaterial)
  airflow.frustumCulled = false
  scene.add(airflow)
  const airflowParticles: Particle[] = Array.from({ length: airflowCount }, (_, i) => ({ life: i / airflowCount, duration: 1, start: new Vector3(), drift: 0 }))

  // 雾气（#70）：几团大而淡的冷雾，边飘边散
  const mist: { sprite: Sprite, particle: Particle }[] = Array.from({ length: mistCount }, (_, i) => {
    const sprite = new Sprite(new SpriteMaterial({ map: dot, color: '#cfe6fb', transparent: true, depthWrite: false, opacity: 0 }))
    scene.add(sprite)
    return { sprite, particle: { life: i / mistCount, duration: 1, start: new Vector3(), drift: 0 } }
  })

  // 冷凝水（#21）：一颗水珠在导风板下沿慢慢聚起再落下
  const drop = new ThreeMesh(
    new SphereGeometry(0.018, 12, 10),
    new MeshLambertMaterial({ color: '#8cc4f0', emissive: '#2a5a86', transparent: true, opacity: 0.9 }),
  )
  drop.visible = false
  scene.add(drop)
  let dripPhase = 0

  const loader = new GLTFLoader()
  const cache = new Map<AcForm, Promise<GLTF>>()
  let current: LoadedForm | undefined
  let wantedForm: AcForm | undefined
  let state: AcSceneState = { status: false, mode: 'cold', temperature: 26, swing: false, fan: 'auto' }

  /** 拖动旋转：左右最多约 40°，上下约 17°；双击回正 */
  let yaw = 0
  let pitch = 0
  let drag: { x: number, y: number, yaw: number, pitch: number } | undefined

  /** 导风板当前角度（弧度），向目标角度缓动 */
  let louverAngle = 0
  let lastTime = 0
  let swingClock = 0
  let frame = 0
  let visible = true
  let disposed = false

  function prepare(form: AcForm, gltf: GLTF): LoadedForm {
    const root = gltf.scene.clone(true)
    let led: MeshLambertMaterial | undefined
    root.traverse((object) => {
      const mesh = object as Mesh
      if (!mesh.isMesh)
        return
      if (object.name === acModelParts.display || object.parent?.name === acModelParts.display) {
        // 显示窗不受光照（原生版用 constant 光照模型）
        mesh.material = new MeshBasicMaterial({ map: display.texture })
        return
      }
      mesh.material = toFlat(mesh.material as Material)
      if (object.name === acModelParts.led || object.parent?.name === acModelParts.led)
        led = mesh.material as MeshLambertMaterial
    })

    const louver = root.getObjectByName(acModelParts.louver)!
    const movers = acLouverMotion[form].pivot === 'children' ? [...louver.children] : [louver]
    const vanes: Object3D[] = []
    root.traverse(object => /^Vane\d+$/.test(object.name) && vanes.push(object))

    root.updateMatrixWorld(true)
    const louverBox = new Box3().setFromObject(louver)
    const anchor = acAirflowAnchors[form]
    const origin = louver.getWorldPosition(new Vector3()).add(new Vector3(...anchor.offset))
    const lip = anchor.direction === 'down'
      ? new Vector3(louverBox.min.x + (louverBox.max.x - louverBox.min.x) * 0.28, louverBox.min.y, louverBox.max.z)
      : new Vector3(louverBox.max.x - 0.04, louverBox.min.y, louverBox.max.z)

    const box = new Box3().setFromObject(root)
    // 给出风留出空间：挂机向下、柜机向右
    if (anchor.direction === 'down')
      box.min.y -= 0.5
    else
      box.max.x += 0.5
    return { form, root, louver, movers, vanes, led, origin, lip, center: box.getCenter(new Vector3()), size: box.getSize(new Vector3()) }
  }

  function fitCamera() {
    if (!current)
      return
    const { width, height } = canvas.getBoundingClientRect()
    if (!width || !height)
      return
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    const fov = MathUtils.degToRad(camera.fov)
    const fitHeight = current.size.y / 2 / Math.tan(fov / 2)
    const fitWidth = current.size.x / 2 / Math.tan(fov / 2) / camera.aspect
    const distance = Math.max(fitHeight, fitWidth) * 1.08 + current.size.z
    // 略微从右下方仰视，和原生版的预览角度相近
    camera.position.copy(current.center).add(new Vector3(distance * 0.16, -distance * 0.08, distance))
    camera.lookAt(current.center)
    camera.updateProjectionMatrix()
  }

  async function load(form: AcForm) {
    wantedForm = form
    if (!cache.has(form))
      cache.set(form, loader.loadAsync(options.modelUrl(form)))
    try {
      const gltf = await cache.get(form)!
      if (disposed || wantedForm !== form)
        return
      if (current)
        scene.remove(current.root)
      current = prepare(form, gltf)
      current.root.rotation.set(pitch, yaw, 0)
      scene.add(current.root)
      // 粒子从新机型的出风口重新开始，错开各自的寿命
      airflowParticles.forEach((particle, i) => {
        respawn(particle, 1)
        particle.life = i / airflowCount
      })
      mist.forEach(({ particle }, i) => {
        respawn(particle, 0.9)
        particle.life = i / mistCount
      })
      louverAngle = state.status ? MathUtils.degToRad(acLouverMotion[form].openAngle) : 0
      fitCamera()
      apply()
    }
    catch (error) {
      cache.delete(form)
      options.onError?.(error)
    }
  }

  function apply() {
    display.draw(state)
    current?.led?.color.set(getAcLedColor(state))
    current?.led?.emissive.set(state.status ? getAcLedColor(state) : '#000000')
    wake()
  }

  function respawn(particle: Particle, spread: number) {
    particle.life = 0
    particle.drift = (Math.random() - 0.5) * 2
    if (!current)
      return
    const anchor = acAirflowAnchors[current.form]
    particle.start.copy(current.origin)
    const along = (Math.random() - 0.5) * anchor.extent * spread
    if (anchor.direction === 'down')
      particle.start.x += along
    else
      particle.start.y += along
  }

  /** 粒子沿出风方向前进 distance；扫风时整体左右（柜机上下）摆动 */
  function place(target: Vector3, particle: Particle, distance: number, sway: number) {
    if (!current)
      return
    target.copy(particle.start)
    if (acAirflowAnchors[current.form].direction === 'down') {
      target.y -= distance
      target.z += distance * 0.35
      target.x += distance * (sway + particle.drift * 0.12)
    }
    else {
      target.x += distance
      target.z += distance * 0.3
      target.y += distance * (sway * 0.6 + particle.drift * 0.12)
    }
  }

  function step(delta: number) {
    const running = state.status && current !== undefined
    const fan = state.fan ?? 'auto'
    const motion = !options.reducedMotion

    // 导风板：开机打开、关机合上；扫风时在打开角度上来回摆
    if (current) {
      const open = MathUtils.degToRad(acLouverMotion[current.form].openAngle)
      if (state.swing && running && motion)
        swingClock += delta
      const swingPhase = Math.sin((swingClock / swingPeriod) * Math.PI * 2)
      const target = state.status ? open + (state.swing ? swingPhase * 0.22 : 0) : 0
      louverAngle = motion ? MathUtils.damp(louverAngle, target, 6, delta / 1000) : target
      for (const mover of current.movers)
        mover.rotation.x = louverAngle
      for (const vane of current.vanes)
        vane.rotation.y = MathUtils.damp(vane.rotation.y, running && state.swing ? swingPhase * 0.35 : vane.rotation.y, 6, delta / 1000)
    }
    const sway = state.swing ? Math.sin((swingClock / swingPeriod) * Math.PI * 2) * 0.38 : 0
    if (!current) {
      airflow.visible = false
      return false
    }
    airflow.visible = true

    // 出风
    const pace = fanPace[fan]
    const color = state.mode === 'cold' ? coldAir : hotAir
    const strength = running && motion ? fanStrength[fan] : 0
    airflowParticles.forEach((particle, i) => {
      particle.life += delta / (1400 * pace)
      if (particle.life >= 1)
        respawn(particle, 1)
      place(scratch, particle, particle.life * 0.65, sway)
      scratch.toArray(airflowPositions, i * 3)
      const alpha = Math.sin(particle.life * Math.PI) * 0.95 * strength
      airflowColors.set([color.r, color.g, color.b, alpha], i * 4)
    })
    airflowGeometry.attributes.position.needsUpdate = true
    airflowGeometry.attributes.color.needsUpdate = true

    // 雾气：只在制冷时，浓度来自 getAcMist
    const mistLevel = current && motion ? getAcMist(state) : 0
    mist.forEach(({ sprite, particle }, i) => {
      particle.life += delta / (4300 * pace)
      if (particle.life >= 1)
        respawn(particle, 0.9)
      place(sprite.position, particle, particle.life * 0.38, sway * 0.5)
      const scale = (0.14 + particle.life * 0.32) * (current?.form === 'tower' ? 0.6 : 1)
      sprite.scale.set(scale * 1.6, scale, 1)
      const active = i < Math.round(mistLevel * mistCount)
      sprite.material.opacity = active ? Math.sin(particle.life * Math.PI) * 0.45 * mistLevel : 0
    })

    // 冷凝水：间隔来自 getAcDripInterval；前 96% 聚起，最后一小段落下
    const interval = getAcDripInterval(state)
    if (current && interval && motion) {
      dripPhase += delta / interval
      if (dripPhase >= 1) {
        dripPhase = 0
        options.onDrip?.()
      }
      drop.visible = true
      drop.position.copy(current.lip)
      if (dripPhase < 0.96) {
        drop.scale.setScalar(Math.min(1, dripPhase / 0.96))
      }
      else {
        const fall = (dripPhase - 0.96) / 0.04
        drop.position.y -= fall * fall * 0.45
        drop.scale.set(0.85, 1.25, 0.85)
      }
      drop.material.opacity = dripPhase < 0.96 ? 0.9 : 0.9 * (1 - (dripPhase - 0.96) / 0.04)
    }
    else {
      dripPhase = 0
      drop.visible = false
    }

    // 开机时一直有出风；关机后等导风板合上就停下，不再逐帧渲染
    return running ? motion : Math.abs(louverAngle) > 0.001
  }

  function tick(time: number) {
    frame = 0
    if (disposed)
      return
    const delta = lastTime ? Math.min(100, time - lastTime) : 16
    lastTime = time
    const keepGoing = step(delta)
    renderer.render(scene, camera)
    if (keepGoing && visible)
      frame = requestAnimationFrame(tick)
    else
      lastTime = 0
  }

  function wake() {
    if (!frame && !disposed && visible)
      frame = requestAnimationFrame(tick)
  }

  function rotate(nextYaw: number, nextPitch: number) {
    yaw = MathUtils.clamp(nextYaw, -0.7, 0.7)
    pitch = MathUtils.clamp(nextPitch, -0.3, 0.3)
    current?.root.rotation.set(pitch, yaw, 0)
    wake()
  }
  const onPointerDown = (event: PointerEvent) => {
    drag = { x: event.clientX, y: event.clientY, yaw, pitch }
    canvas.setPointerCapture(event.pointerId)
  }
  const onPointerMove = (event: PointerEvent) => {
    if (drag)
      rotate(drag.yaw + (event.clientX - drag.x) / 160, drag.pitch + (event.clientY - drag.y) / 240)
  }
  const onPointerUp = () => {
    drag = undefined
  }
  const onDoubleClick = () => rotate(0, 0)
  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('pointerup', onPointerUp)
  canvas.addEventListener('pointercancel', onPointerUp)
  canvas.addEventListener('dblclick', onDoubleClick)

  // 看不见（滚出屏幕、切到后台）时不渲染
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting && !document.hidden
    if (visible)
      wake()
  })
  intersection.observe(canvas)
  const onVisibility = () => {
    visible = !document.hidden
    if (visible)
      wake()
  }
  document.addEventListener('visibilitychange', onVisibility)
  const resize = new ResizeObserver(() => {
    fitCamera()
    wake()
  })
  resize.observe(canvas)
  // 数码管字体加载好后重画显示窗
  document.fonts?.load('150px "Digital-7 Mono"').then(() => apply(), () => {})

  return {
    update(next) {
      state = { ...next, fan: next.fan ?? 'auto' }
      apply()
    },
    setForm(form) {
      if (form !== current?.form)
        void load(form)
    },
    dispose() {
      disposed = true
      cancelAnimationFrame(frame)
      intersection.disconnect()
      resize.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
      canvas.removeEventListener('dblclick', onDoubleClick)
      scene.traverse((object) => {
        const mesh = object as Mesh
        mesh.geometry?.dispose()
        const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : []
        materials.forEach(material => material.dispose())
      })
      display.texture.dispose()
      dot.dispose()
      renderer.dispose()
    },
  }
}
