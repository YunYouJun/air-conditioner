/**
 * Yun Home sandbox plugin contract, SDK version 1.
 *
 * The host loads `state.js` into an isolated JavaScriptCore context and calls
 * these pure functions with JSON values. No timers, network or file access
 * exist in that context.
 */
export type DeviceTone = 'idle' | 'cool' | 'heat' | 'warm' | 'active'

export interface DevicePresentation {
  /** Whether the device is running */
  active: boolean
  tone: DeviceTone
  /** One-line status shown in lists, e.g. "制冷 · 26°C" */
  summary: string
}

export interface PluginLimits {
  min: number
  max: number
  step: number
}

export interface PluginContext {
  /** Device limits reported by the host, e.g. a bound climate entity */
  limits?: PluginLimits
}

export interface YunHomeSandboxPlugin<State, Action> {
  create: () => State
  normalize: (value: unknown) => State
  isAction: (value: unknown) => value is Action
  reduce: (state: State, action: Action, context?: PluginContext) => State
  present: (state: State) => DevicePresentation
}
