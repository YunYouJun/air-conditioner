export type AcMode = 'cold' | 'hot'

/**
 * Sound mode: `normal` plays everything, `sleep` lowers the volume,
 * `mute` silences the air conditioner.
 */
export type AcSoundMode = 'normal' | 'sleep' | 'mute'

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
   * Target temperature in Celsius.
   */
  temperature: number
  /**
   * Sound mode. States saved before this field existed fall back to `normal`.
   */
  sound: AcSoundMode
}

export type AcAction
  = | { type: 'increment' | 'decrement' | 'toggleStatus' | 'cycleSound' }
    | { type: 'status', status: AcState['status'] }
    | { type: 'mode', mode: AcState['mode'] }
    | { type: 'sound', sound: AcState['sound'] }
    | { type: 'update', payload: Partial<AcState> }

export type AcNotificationSeverity = 'success' | 'error' | 'info'

export interface AcNotification {
  message: string
  severity: AcNotificationSeverity
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
  dispose: () => void
}

export interface CreateAcAudioControllerOptions {
  /**
   * Initial sound mode.
   * @default 'normal'
   */
  soundMode?: AcSoundMode
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
