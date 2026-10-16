export type AcMode = 'cold' | 'hot'

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
}

export type AcAction
  = | { type: 'increment' | 'decrement' | 'toggleStatus' }
    | { type: 'status', status: AcState['status'] }
    | { type: 'mode', mode: AcState['mode'] }
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

export interface AcAudioElement {
  currentTime: number
  load: () => void
  play: () => Promise<unknown> | unknown
}

export interface AcAudioElements {
  start: AcAudioElement | null
  work: AcAudioElement | null
  beep?: AcAudioElement | null
}

export interface AcAudioController {
  beep: () => void
  toggleStatusAudio: (previousStatus: boolean) => void
  dispose: () => void
}
