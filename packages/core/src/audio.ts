import type {
  AcAudioController,
  AcAudioElement,
  AcAudioElements,
  AcFanSpeed,
  AcSoundMode,
  CreateAcAudioControllerOptions,
} from './types'
import { acFanSoundLevels, acSoundVolumes, soundTimings } from './constants'

type SoundName = 'beep' | 'start' | 'work'
type Timer = ReturnType<typeof setTimeout>

interface WebEngine {
  context: AudioContext
  /** 总音量，跟随声音模式 */
  master: GainNode
  buffers: Partial<Record<SoundName, AudioBuffer>>
  /** 启动声与风声都解码成功时为 true */
  ready: Promise<boolean>
}

/**
 * 一次开机用到的节点：关机时整体淡出再断开。
 */
interface WebRun {
  output: GainNode
  /** 风声相对音量（达标后变小、压缩机发力时变大） */
  fan: GainNode
  sources: Set<AudioBufferSourceNode>
}

/** Web Audio 资源迟迟没加载好时，本次开机先用 `<audio>` 播放 */
const readyTimeoutMs = 1500
const fallbackTweenStepMs = 100
const curveLength = 64

function sourceUrl(element: AcAudioElement | null | undefined): string {
  return element?.currentSrc || element?.src || ''
}

async function fetchAudioData(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url)
  if (!response.ok)
    throw new Error(`Failed to load ${url}: ${response.status}`)
  return response.arrayBuffer()
}

function createDefaultAudioContext(): AudioContext | null {
  const scope = globalThis as typeof globalThis & { webkitAudioContext?: typeof AudioContext }
  const AudioContextConstructor = scope.AudioContext ?? scope.webkitAudioContext
  return AudioContextConstructor ? new AudioContextConstructor() : null
}

/**
 * 合成一声很轻的「嗒」：音高快速下滑的正弦波，短促起音、指数衰减，像水珠落在窗台上。
 */
function playDrip(context: AudioContext, output: AudioNode) {
  const start = context.currentTime
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(1500, start)
  oscillator.frequency.exponentialRampToValueAtTime(520, start + 0.07)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(0.12, start + 0.004)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16)
  oscillator.connect(gain)
  gain.connect(output)
  oscillator.start(start)
  oscillator.stop(start + 0.18)
  oscillator.onended = () => gain.disconnect()
}

/**
 * 等功率淡入 / 淡出曲线，噪声类声音交叉淡化时中段不会变小。
 */
function fadeCurve(direction: 'in' | 'out'): Float32Array {
  const curve = new Float32Array(curveLength)
  for (let i = 0; i < curveLength; i++) {
    const phase = (i / (curveLength - 1)) * Math.PI / 2
    curve[i] = direction === 'in' ? Math.sin(phase) : Math.cos(phase)
  }
  return curve
}

function randomBetween(range: readonly [number, number], random: () => number): number {
  return range[0] + (range[1] - range[0]) * random()
}

function playElement(element: AcAudioElement | null | undefined) {
  if (!element)
    return

  element.load()
  // 自动播放策略可能拒绝播放，不影响后续操作
  Promise.resolve(element.play()).catch(() => {})
}

function stopElement(element: AcAudioElement | null | undefined) {
  if (!element)
    return

  if (element.pause)
    element.pause()
  else
    element.load()
}

/**
 * 空调音效：按键「嘀」声、开机启动声与持续的风声。
 *
 * 默认通过 Web Audio API 播放：风声无缝循环，开关机淡入淡出，运行一段时间后
 * 风声变小、并不定时随压缩机发力起伏。环境不支持或音频无法获取时退回
 * `<audio>` 元素。
 *
 * 需在用户交互（点击遥控器）里首次调用，浏览器才允许发声。
 *
 * @param elements 三个音频元素；Web Audio 会从它们的 `src` 获取音频
 * @param options 声音模式与可替换的环境依赖
 */
export function createAcAudioController(
  elements: AcAudioElements,
  options: CreateAcAudioControllerOptions = {},
): AcAudioController {
  const random = options.random ?? Math.random
  let soundMode: AcSoundMode = options.soundMode ?? 'normal'
  let fanSpeed: AcFanSpeed = options.fanSpeed ?? 'auto'
  /** 开机后风声循环已经接上（启动声结束） */
  let fanRunning = false
  /** 每次重启「达标 / 发力」循环自增，丢弃旧循环的回调 */
  let fanCycle = 0
  /** undefined：尚未尝试；null：不可用 */
  let engine: WebEngine | null | undefined
  let run: WebRun | undefined
  /** 每次开关机自增，丢弃过期的异步回调 */
  let session = 0
  const timers = new Set<Timer>()

  /** `<audio>` 播放时的风声相对音量 */
  let fallbackFanLevel = 1
  let fallbackTween: ReturnType<typeof setInterval> | undefined

  function later(callback: () => void, delayMs: number) {
    const timer = setTimeout(() => {
      timers.delete(timer)
      callback()
    }, delayMs)
    timers.add(timer)
  }

  function clearTimers() {
    timers.forEach(timer => clearTimeout(timer))
    timers.clear()
  }

  function volume() {
    return acSoundVolumes[soundMode]
  }

  function applyElementVolume(element: AcAudioElement | null | undefined, level = 1) {
    if (!element)
      return

    if (element.volume !== undefined)
      element.volume = Math.min(1, Math.max(0, volume() * level))
    // iOS 上 volume 只读，静音需要 muted
    if (element.muted !== undefined)
      element.muted = soundMode === 'mute'
  }

  function cancelFallbackTween() {
    if (fallbackTween)
      clearInterval(fallbackTween)
    fallbackTween = undefined
  }

  function tweenFallbackFan(target: number, durationMs: number, onDone?: () => void) {
    cancelFallbackTween()

    const from = fallbackFanLevel
    const steps = Math.max(1, Math.round(durationMs / fallbackTweenStepMs))
    let step = 0
    fallbackTween = setInterval(() => {
      step++
      fallbackFanLevel = from + (target - from) * (step / steps)
      applyElementVolume(elements.work, fallbackFanLevel)
      if (step >= steps) {
        cancelFallbackTween()
        onDone?.()
      }
    }, fallbackTweenStepMs)
  }

  function ensureEngine(): WebEngine | null {
    if (engine !== undefined)
      return engine

    engine = createEngine()
    return engine
  }

  function createEngine(): WebEngine | null {
    if (options.webAudio === false)
      return null

    let context: AudioContext | null
    try {
      context = (options.createAudioContext ?? createDefaultAudioContext)()
    }
    catch {
      return null
    }
    if (!context)
      return null

    const master = context.createGain()
    master.gain.value = volume()
    master.connect(context.destination)

    const buffers: WebEngine['buffers'] = {}
    const load = options.loadAudioData ?? fetchAudioData
    const decode = async (name: SoundName) => {
      const url = sourceUrl(elements[name])
      if (!url)
        return
      try {
        buffers[name] = await context.decodeAudioData(await load(url))
      }
      catch {
        // 跨域无 CORS、格式不支持等：该音效改用 <audio> 播放
      }
    }
    const ready = Promise.all((['beep', 'start', 'work'] as const).map(decode))
      .then(() => Boolean(buffers.start && buffers.work))

    return { context, master, buffers, ready }
  }

  function resume(web: WebEngine) {
    if (web.context.state === 'suspended')
      Promise.resolve(web.context.resume()).catch(() => {})
  }

  function waitReady(web: WebEngine): Promise<boolean> {
    return Promise.race([
      web.ready,
      new Promise<boolean>(resolve => setTimeout(resolve, readyTimeoutMs, false)),
    ])
  }

  function playBuffer(web: WebEngine, buffer: AudioBuffer, destination: AudioNode, when: number) {
    const source = web.context.createBufferSource()
    source.buffer = buffer
    source.connect(destination)
    source.start(when)
    return source
  }

  function track(target: WebRun, source: AudioBufferSourceNode, cleanup?: () => void) {
    target.sources.add(source)
    source.onended = () => {
      target.sources.delete(source)
      source.disconnect()
      cleanup?.()
    }
  }

  /**
   * 排一段风声，并在它结束前交叉淡化接上下一段。
   */
  function loopFan(web: WebEngine, target: WebRun, when: number) {
    const buffer = web.buffers.work!
    const crossfade = Math.min(soundTimings.loopCrossfadeMs / 1000, buffer.duration / 2)
    const gain = web.context.createGain()
    gain.gain.value = 0
    gain.gain.setValueCurveAtTime(fadeCurve('in'), when, crossfade)
    gain.gain.setValueCurveAtTime(fadeCurve('out'), when + buffer.duration - crossfade, crossfade)
    gain.connect(target.fan)

    const source = playBuffer(web, buffer, gain, when)
    source.stop(when + buffer.duration)
    track(target, source, () => gain.disconnect())

    const next = when + buffer.duration - crossfade
    later(() => {
      if (run === target)
        loopFan(web, target, next)
    }, Math.max(0, (next - web.context.currentTime - 1) * 1000))
  }

  function setFanLevel(level: number, rampMs: number) {
    if (run && engine) {
      const gain = run.fan.gain
      const now = engine.context.currentTime
      gain.cancelScheduledValues(now)
      gain.setValueAtTime(gain.value, now)
      gain.linearRampToValueAtTime(level, now + rampMs / 1000)
    }
    else {
      tweenFallbackFan(level, rampMs)
    }
  }

  /** 风声循环刚接上时的音量：自动风速从满音量开始，固定风速保持各自的音量。 */
  function initialFanLevel() {
    return fanSpeed === 'auto' ? 1 : acFanSoundLevels[fanSpeed]
  }

  /**
   * 自动风速：室温达标后风声变小；之后不定时随压缩机发力变大，再回落。
   * 固定风速不走这个循环。
   */
  function startFanCycle() {
    fanRunning = true
    const cycle = ++fanCycle
    if (fanSpeed !== 'auto')
      return
    const current = () => cycle === fanCycle && fanSpeed === 'auto'
    const quiet = () => {
      later(() => {
        if (!current())
          return
        setFanLevel(soundTimings.surgeLevel, soundTimings.surgeRampMs)
        later(() => {
          if (!current())
            return
          setFanLevel(soundTimings.settleLevel, soundTimings.surgeRampMs)
          quiet()
        }, randomBetween(soundTimings.surgeDurationMs, random))
      }, randomBetween(soundTimings.quietDurationMs, random))
    }

    later(() => {
      if (!current())
        return
      setFanLevel(soundTimings.settleLevel, soundTimings.settleRampMs)
      quiet()
    }, soundTimings.settleAfterMs)
  }

  function startWeb(web: WebEngine) {
    const output = web.context.createGain()
    output.connect(web.master)
    const fan = web.context.createGain()
    fan.gain.value = initialFanLevel()
    fan.connect(output)
    const target: WebRun = { output, fan, sources: new Set() }
    run = target

    const now = web.context.currentTime
    track(target, playBuffer(web, web.buffers.start!, output, now))
    loopFan(web, target, now + soundTimings.startDelayMs / 1000)
    later(startFanCycle, soundTimings.startDelayMs)
  }

  function stopWeb(fadeMs: number) {
    const target = run
    run = undefined
    if (!target || !engine)
      return

    const now = engine.context.currentTime
    const end = now + fadeMs / 1000
    const gain = target.output.gain
    gain.cancelScheduledValues(now)
    gain.setValueAtTime(gain.value, now)
    gain.linearRampToValueAtTime(0, end)
    target.sources.forEach((source) => {
      try {
        source.stop(end)
      }
      catch {
        // 已停止的音源
      }
    })
    setTimeout(() => target.output.disconnect(), fadeMs + 100)
  }

  function startFallback() {
    const { start, work } = elements
    stopElement(work)
    applyElementVolume(start)
    playElement(start)

    later(() => {
      if (!work)
        return
      fallbackFanLevel = 0
      applyElementVolume(work, 0)
      if (work.loop !== undefined)
        work.loop = true
      playElement(work)
      tweenFallbackFan(initialFanLevel(), soundTimings.loopCrossfadeMs)
      startFanCycle()
    }, soundTimings.startDelayMs)
  }

  function stopFallback(fadeMs: number) {
    stopElement(elements.start)
    if (fadeMs > 0)
      tweenFallbackFan(0, fadeMs, () => stopElement(elements.work))
    else
      stopElement(elements.work)
  }

  function powerOn() {
    const id = ++session
    fanRunning = false
    fanCycle++
    clearTimers()
    // 上次关机的淡出若还没结束，别让它停掉这次的风声
    cancelFallbackTween()
    stopWeb(0)
    stopFallback(0)

    const web = ensureEngine()
    if (!web) {
      startFallback()
      return
    }

    resume(web)
    void waitReady(web).then((ok) => {
      if (id !== session)
        return
      if (ok)
        startWeb(web)
      else
        startFallback()
    })
  }

  function powerOff() {
    session++
    fanRunning = false
    fanCycle++
    clearTimers()
    stopWeb(soundTimings.stopFadeMs)
    stopFallback(soundTimings.stopFadeMs)
  }

  return {
    beep() {
      if (soundMode === 'mute')
        return

      const web = ensureEngine()
      if (web) {
        resume(web)
        if (web.buffers.beep) {
          playBuffer(web, web.buffers.beep, web.master, web.context.currentTime)
          return
        }
      }

      applyElementVolume(elements.beep)
      playElement(elements.beep)
    },
    drip() {
      // 只在标准声音下响；睡眠和静音时安安静静
      if (soundMode !== 'normal')
        return
      const web = ensureEngine()
      if (!web || typeof web.context.createOscillator !== 'function')
        return
      resume(web)
      playDrip(web.context, web.master)
    },
    toggleStatusAudio(previousStatus: boolean) {
      if (previousStatus)
        powerOff()
      else
        powerOn()
    },
    setSoundMode(mode: AcSoundMode) {
      soundMode = mode
      if (engine)
        engine.master.gain.setTargetAtTime(volume(), engine.context.currentTime, 0.08)

      applyElementVolume(elements.beep)
      applyElementVolume(elements.start)
      applyElementVolume(elements.work, fallbackFanLevel)
    },
    setFanSpeed(fan: AcFanSpeed) {
      if (fan === fanSpeed)
        return
      fanSpeed = fan
      // Before the fan loop starts, it simply begins at the new level.
      if (!fanRunning) {
        if (run)
          run.fan.gain.value = initialFanLevel()
        return
      }
      if (fan === 'auto') {
        // Back to automatic: blow strongly, then settle as usual.
        setFanLevel(1, soundTimings.loopCrossfadeMs)
        startFanCycle()
      }
      else {
        fanCycle++
        setFanLevel(acFanSoundLevels[fan], soundTimings.loopCrossfadeMs)
      }
    },
    dispose() {
      session++
      clearTimers()
      cancelFallbackTween()
      stopWeb(0)
      stopFallback(0)
      if (engine && !options.createAudioContext)
        Promise.resolve(engine.context.close()).catch(() => {})
      engine = null
    },
  }
}
