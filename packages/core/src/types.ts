export type AcMode = 'cold' | 'hot'

/**
 * Sound mode: `normal` plays everything, `sleep` lowers the volume,
 * `mute` silences the air conditioner.
 */
export type AcSoundMode = 'normal' | 'sleep' | 'mute'

/**
 * Fan speed (风速). `auto` lets the unit decide: strong at first, quieter
 * once the room settles, with the occasional surge. The fixed speeds hold
 * the airflow and fan sound steady.
 */
export type AcFanSpeed = 'auto' | 'low' | 'medium' | 'high'

/**
 * Temperature range a device supports. Real devices (e.g. Home Assistant
 * climate entities) report their own range and step.
 */
export interface AcLimits {
  min: number
  max: number
  step: number
}

/**
 * Visual tone of the unit: idle when off, otherwise follows the mode.
 */
export type AcTone = 'idle' | 'cool' | 'heat'

export interface AcState {
  /**
   * Whether the air conditioner is powered on.
   */
  status: boolean
  /**
   * Current work mode.
   */
  mode: AcMode
  /**
   * Target temperature in Celsius, for the current mode.
   */
  temperature: number
  /**
   * Last target temperature of each mode, like a real remote: switching
   * from 制冷 20 °C to 制热 and back restores 20 °C. `normalizeAcState`
   * always fills it in, with the current mode holding `temperature`; states
   * saved before this field existed start with both modes at their saved
   * temperature. Optional so hand-written states keep type-checking.
   */
  temperatures?: Record<AcMode, number>
  /**
   * Sound mode. States saved before this field existed fall back to `normal`.
   */
  sound: AcSoundMode
  /**
   * Whether the airflow sweeps left and right. States saved before this
   * field existed fall back to `false`.
   */
  swing: boolean
  /**
   * Fan speed. `normalizeAcState` fills in `auto` for states saved before
   * this field existed; optional so hand-written states keep type-checking.
   */
  fan?: AcFanSpeed
}

export type AcAction
  = | { type: 'increment' | 'decrement' | 'toggleStatus' | 'cycleSound' | 'toggleSwing' | 'cycleFan' }
    | { type: 'status', status: AcState['status'] }
    | { type: 'mode', mode: AcState['mode'] }
    | { type: 'sound', sound: AcState['sound'] }
    | { type: 'swing', swing: AcState['swing'] }
    | { type: 'fan', fan: AcFanSpeed }
    | { type: 'update', payload: Partial<AcState> }

export type AcNotificationSeverity = 'success' | 'error' | 'info'

/**
 * What a notification is about, which decides how views present it:
 *
 * - `tip`：节能建议，以「出风口吹出的小纸条」显示
 * - `limit`：温度到了上下限，遥控器小屏抖一下，不弹提示
 * - `setting`：风速、声音、扫风等设置变化，小屏已经显示，只给读屏播报
 */
export type AcNotificationKind = 'tip' | 'limit' | 'setting'

export interface AcNotification {
  message: string
  severity: AcNotificationSeverity
  /** Absent on notifications from before kinds existed; treat as `tip`. */
  kind?: AcNotificationKind
  /** A second, quieter line, e.g. why a tip matters. */
  detail?: string
}

export interface AcChangeEvent {
  action: AcAction
  previousState: AcState
  state: AcState
  notification?: AcNotification
}

export type AcStoreListener = (event: AcChangeEvent) => void

export interface AcStorage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem?: (key: string) => void
}

export interface CreateAirConditionerStoreOptions {
  initialState?: Partial<AcState>
  /**
   * Device temperature limits. Defaults to 16–31 °C with a step of 1.
   */
  limits?: AcLimits
  storage?: AcStorage | null
  storageKey?: string
  onNotify?: (notification: AcNotification, event: AcChangeEvent) => void
}

export interface AirConditionerStore {
  getState: () => AcState
  dispatch: (action: AcAction) => AcChangeEvent
  subscribe: (listener: AcStoreListener) => () => void
}

/**
 * The subset of `HTMLAudioElement` the audio controller uses. The optional
 * members let it pause, loop and set volume when they exist.
 */
export interface AcAudioElement {
  currentTime: number
  load: () => void
  play: () => Promise<unknown> | unknown
  pause?: () => void
  volume?: number
  muted?: boolean
  loop?: boolean
  /** Used to fetch the file for Web Audio playback. */
  src?: string
  currentSrc?: string
}

export interface AcAudioElements {
  start: AcAudioElement | null
  work: AcAudioElement | null
  beep?: AcAudioElement | null
}

export interface AcAudioController {
  beep: () => void
  toggleStatusAudio: (previousStatus: boolean) => void
  /**
   * Change the volume of everything, including sounds already playing.
   */
  setSoundMode: (mode: AcSoundMode) => void
  /**
   * Follow the fan speed: `auto` keeps the settle / surge cycle, fixed
   * speeds hold the fan sound at a steady level.
   */
  setFanSpeed: (fan: AcFanSpeed) => void
  dispose: () => void
}

export interface CreateAcAudioControllerOptions {
  /**
   * Initial sound mode.
   * @default 'normal'
   */
  soundMode?: AcSoundMode
  /**
   * Initial fan speed.
   * @default 'auto'
   */
  fanSpeed?: AcFanSpeed
  /**
   * Play through the Web Audio API for a gapless loop and smooth fades.
   * Falls back to the `<audio>` elements when the API is missing or the
   * files cannot be fetched (for example across origins without CORS).
   * @default true
   */
  webAudio?: boolean
  /**
   * Create the `AudioContext`. Defaults to `new AudioContext()`.
   */
  createAudioContext?: () => AudioContext
  /**
   * Fetch an audio file. Defaults to `fetch(url)`.
   */
  loadAudioData?: (url: string) => Promise<ArrayBuffer>
  /**
   * Random source for the fan's quiet / busy cycle. Defaults to `Math.random`.
   */
  random?: () => number
}
