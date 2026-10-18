import type { AcDotRow, AcForm, AcState } from '@yunlefun-home/air-conditioner-core'
import type { Group, Material, Mesh, Object3D } from 'three'
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js'
import {
  acAirflowAnchors,
  acEnergyLabel,
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
  PlaneGeometry,
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
  /** 一开始侧转的角度（弧度）：从平面版「转过来」时，模型从这个角度转回正面 */
  initialYaw?: number
  /** 第一个模型显示出来 */
  onReady?: () => void
  /** 已经回正时再双击：请求变回平面版 */
  onFlatten?: () => void
  /** 换上了这个机型的模型（第一次加载也算） */
  onForm?: (form: AcForm) => void
  /**
   * 接收拖动、并作为取景框的元素（默认画布本身）。画布可以比它高、上下对称地溢出，
   * 转动时机身探出取景框也不会被裁掉
   */
  surface?: HTMLElement
}

export interface AcScene {
  update: (state: AcSceneState) => void
  setForm: (form: AcForm) => void
  /** 带缓动地转到这个角度（弧度，绕竖轴；俯仰回到 0） */
  turnTo: (yaw: number) => void
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

/**
 * 能效标签贴图：和平面版（lib/EnergyLabel.tsx 与 style.css 的 .acw-energy-label）同一套 50 × 80 的布局，
 * 点阵与等级条来自 core 的 acEnergyLabel，按 k 倍画到画布上。
 */
function createEnergyLabel(k = 8): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 50 * k
  canvas.height = 80 * k
  const context = canvas.getContext('2d')!
  context.scale(k, k)
  const rect = (x: number, y: number, w: number, h: number, color: string) => {
    context.fillStyle = color
    context.fillRect(x, y, w, h)
  }
  /** 一行点阵，整行在 [left, left + width] 里居中（width 省略时靠左），返回行高 */
  const dots = (row: AcDotRow, left: number, top: number, width?: number) => {
    const step = row.size + row.mx * 2
    let x = width === undefined ? left : left + (width - step * row.num) / 2
    context.fillStyle = row.color
    for (let n = 0; n < row.num; n++, x += step) {
      context.beginPath()
      context.arc(x + row.mx + row.size / 2, top + row.my + row.size / 2, row.size / 2, 0, Math.PI * 2)
      context.fill()
    }
    return row.size + row.my * 2
  }

  context.fillStyle = '#4ea5f5'
  context.beginPath()
  context.roundRect(0, 0, 50, 80, 2)
  context.fill()

  // 内容区：4px 内边距，宽 42
  const left = 4
  const width = 42
  // 顶部：标识名称（白点）靠左，能效信息码（11 × 11 的二维码）靠右，垂直居中
  const top = acEnergyLabel.top[0]
  dots(top, left, 4 + (11 - (top.size + top.my * 2)) / 2)
  const qr = left + width - 11
  rect(qr, 4, 11, 11, '#fff')
  for (let y = 0; y < 9; y++) {
    for (let x = 0; x < 9; x++) {
      if ((x + y) % 2 === 0)
        rect(qr + 1 + x, 5 + y, 1, 1, '#000')
    }
  }
  for (const [x, y] of [[0, 0], [6, 0], [0, 6]])
    rect(qr + 1 + x, 5 + y, 3, 3, '#000')

  // 等级区：白底，5 行 3px 的条均匀分布；首行是 1 级绿条和朝左的指示箭头
  rect(left, 19, width, 28, '#fff')
  const barLeft = left + 8
  const barWidth = width - 16
  const gap = (24 - 15) / 6
  let y = 19 + 2 + gap
  rect(barLeft, y, barWidth * 0.4, 3, 'green')
  context.fillStyle = 'green'
  context.beginPath()
  context.moveTo(barLeft + barWidth * 0.8, y + 1.5)
  context.lineTo(barLeft + barWidth * 0.8 + 2, y)
  context.lineTo(barLeft + barWidth * 0.8 + 2, y + 3)
  context.fill()
  rect(barLeft + barWidth * 0.8 + 2, y, barWidth * 0.1, 3, 'green')
  for (const level of acEnergyLabel.levels) {
    y += 3 + gap
    rect(barLeft, y, barWidth * Number.parseFloat(level.width) / 100, 3, level.background)
  }

  // 文字明细区：白底，黑点行，首行下面一条分隔线
  rect(left, 51, width, 20, '#fff')
  y = 51.8
  acEnergyLabel.detail.forEach((row, index) => {
    y += dots(row, left, y, width)
    if (index === 0) {
      rect(left, y + 0.8, width, 1, '#000')
      y += 2.6
    }
  })

  // 底部：国家标准编号（白点）
  dots(acEnergyLabel.footer, left, 73, width)

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
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
  /** 取景时要放得下的尺寸：挂机只算机身，让正面和平面版一样宽 */
  fit: Vector3
}

interface Particle {
  life: number
  duration: number
  start: Vector3
  drift: number
}

export function createAcScene(canvas: HTMLCanvasElement, options: AcSceneOptions): AcScene {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true })
  const surface = options.surface ?? canvas
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = SRGBColorSpace

  const scene = new Scene()
  /**
   * 取景框的竖向视角（度）。视角窄、相机远，透视平缓：侧转时近的一端不会胀得探出画面，
   * 也更接近平面版 perspective(1400px) 的转身
   */
  const fov = 20
  const camera = new PerspectiveCamera(fov, 2, 0.1, 50)
  scene.add(new HemisphereLight('#ffffff', '#b4bccb', 1.7))
  const sun = new DirectionalLight('#ffffff', 1.5)
  sun.position.set(2, 3, 4)
  scene.add(sun)

  const display = createDisplay()
  const dot = softDot()
  const energyLabel = createEnergyLabel()

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
  let yaw = options.initialYaw ?? 0
  let pitch = 0
  let drag: { x: number, y: number, yaw: number, pitch: number } | undefined
  /** 正在缓动转向的目标角度 */
  let turnTarget: number | undefined
  let ready = false

  /** 导风板当前角度（弧度），向目标角度缓动 */
  let louverAngle = 0
  let lastTime = 0
  let swingClock = 0
  let frame = 0
  let visible = true
  let disposed = false

  /** 能效标签贴在机身右侧面正中：高约机身的 4/10，比例和平面版一样 50 : 80 */
  function stickEnergyLabel(root: Object3D) {
    const body = root.getObjectByName('Body')
    if (!body)
      return
    root.updateMatrixWorld(true)
    const box = new Box3().setFromObject(body)
    const center = box.getCenter(new Vector3())
    const height = (box.max.y - box.min.y) * 0.4
    const label = new ThreeMesh(
      new PlaneGeometry(height * 50 / 80, height),
      new MeshLambertMaterial({ map: energyLabel }),
    )
    label.name = 'EnergyLabel'
    // 平面朝 +Z，绕竖轴转 90° 朝向 +X（右侧面）；贴图左边正好在机身前侧。离表面一点点，免得和侧面闪烁
    label.rotation.y = Math.PI / 2
    label.position.set(box.max.x + 0.002, center.y, center.z)
    root.add(label)
  }

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

    // 挂机右侧面贴能效标签（平面版贴在正面左上角，立体的正面留给面板，就贴到侧面）
    if (form === 'wall')
      stickEnergyLabel(root)

    root.updateMatrixWorld(true)
    const louverBox = new Box3().setFromObject(louver)
    const anchor = acAirflowAnchors[form]
    const origin = louver.getWorldPosition(new Vector3()).add(new Vector3(...anchor.offset))
    const lip = anchor.direction === 'down'
      ? new Vector3(louverBox.min.x + (louverBox.max.x - louverBox.min.x) * 0.28, louverBox.min.y, louverBox.max.z)
      : new Vector3(louverBox.max.x - 0.04, louverBox.min.y, louverBox.max.z)

    const box = new Box3().setFromObject(root)
    const body = box.getSize(new Vector3())
    // 给出风留出空间：挂机向下；柜机向右吹，但左右对称地留，机身才在画面正中
    if (anchor.direction === 'down') {
      box.min.y -= 0.36
    }
    else {
      box.min.x -= 0.5
      box.max.x += 0.5
    }
    const size = box.getSize(new Vector3())
    // 挂机和平面版同高（见 Ac3D.scss），画面偏扁：按含出风的高度取景机身会变小，
    // 所以只按机身取景，出风区仍然通过下移的中心留在机身下方
    const fit = anchor.direction === 'down' ? body : size
    return { form, root, louver, movers, vanes, led, origin, lip, center: box.getCenter(new Vector3()), size, fit }
  }

  function fitCamera() {
    if (!current)
      return
    // 用布局尺寸：转身时外层带着 rotateY / scale，getBoundingClientRect 量到的是投影
    const { clientWidth: width, clientHeight: height } = canvas
    const frameHeight = surface.clientHeight || height
    if (!width || !height)
      return
    renderer.setSize(width, height, false)
    // 按取景框取景；画布上下多出来的部分只是把视野等比例往外扩
    const tanHalf = Math.tan(MathUtils.degToRad(fov) / 2)
    camera.fov = MathUtils.radToDeg(2 * Math.atan(tanHalf * height / frameHeight))
    camera.aspect = width / height
    const fitHeight = current.fit.y / 2 / tanHalf
    const fitWidth = current.fit.x / 2 / tanHalf / (width / frameHeight)
    // 从机身中心算起，正面离相机近半个厚度；挂机让正面的宽度和平面版差不多，两者转身时能接上
    const distance = Math.max(fitHeight, fitWidth) * 1.04 + current.size.z / 2
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
      options.onForm?.(form)
      apply()
      if (!ready) {
        ready = true
        // 先画好第一帧，再通知外面开始「转过来」
        renderer.render(scene, camera)
        options.onReady?.()
      }
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

    // 转身：向目标角度缓动（平面 / 3D 切换、双击回正）
    if (turnTarget !== undefined) {
      yaw = motion ? MathUtils.damp(yaw, turnTarget, 7, delta / 1000) : turnTarget
      pitch = motion ? MathUtils.damp(pitch, 0, 7, delta / 1000) : 0
      if (Math.abs(yaw - turnTarget) < 0.002 && Math.abs(pitch) < 0.002) {
        yaw = turnTarget
        pitch = 0
        turnTarget = undefined
      }
      current?.root.rotation.set(pitch, yaw, 0)
    }
    const turning = turnTarget !== undefined

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
    return (running ? motion : Math.abs(louverAngle) > 0.001) || turning
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
    turnTarget = undefined
    yaw = MathUtils.clamp(nextYaw, -0.7, 0.7)
    // 挂机贴着画面上沿（和平面版同高）：侧转后近的一端伸向镜头，再往上翻就会探出画面，所以往上少翻一点
    pitch = MathUtils.clamp(nextPitch, current?.form === 'tower' ? -0.3 : -0.12, 0.3)
    current?.root.rotation.set(pitch, yaw, 0)
    wake()
  }
  const onPointerDown = (event: PointerEvent) => {
    drag = { x: event.clientX, y: event.clientY, yaw, pitch }
    surface.setPointerCapture(event.pointerId)
  }
  const onPointerMove = (event: PointerEvent) => {
    if (drag)
      rotate(drag.yaw + (event.clientX - drag.x) / 160, drag.pitch + (event.clientY - drag.y) / 240)
  }
  const onPointerUp = () => {
    drag = undefined
  }
  // 双击回正；已经是正面时再双击，交给外面变回平面版
  const onDoubleClick = () => {
    if (Math.abs(yaw) < 0.02 && Math.abs(pitch) < 0.02 && turnTarget === undefined)
      options.onFlatten?.()
    else
      turnTo(0)
  }
  function turnTo(target: number) {
    turnTarget = MathUtils.clamp(target, -0.7, 0.7)
    wake()
  }
  surface.addEventListener('pointerdown', onPointerDown)
  surface.addEventListener('pointermove', onPointerMove)
  surface.addEventListener('pointerup', onPointerUp)
  surface.addEventListener('pointercancel', onPointerUp)
  surface.addEventListener('dblclick', onDoubleClick)

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
    turnTo,
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
      surface.removeEventListener('pointerdown', onPointerDown)
      surface.removeEventListener('pointermove', onPointerMove)
      surface.removeEventListener('pointerup', onPointerUp)
      surface.removeEventListener('pointercancel', onPointerUp)
      surface.removeEventListener('dblclick', onDoubleClick)
      scene.traverse((object) => {
        const mesh = object as Mesh
        mesh.geometry?.dispose()
        const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : []
        materials.forEach(material => material.dispose())
      })
      display.texture.dispose()
      energyLabel.dispose()
      dot.dispose()
      renderer.dispose()
    },
  }
}
