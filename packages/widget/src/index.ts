import type {
  AcAudioController,
  AcDotRow,
  AcIconName,
  AcMode,
  AcNotification,
  AcSoundMode,
  AcState,
  AirConditionerStore,
} from '@yunlefun-home/air-conditioner-core'
import {
  acEnergyLabel,
  acIconPaths,
  acModeIcons,
  acShellSize,
  acSoundIcons,
  acSoundModeLabels,
  createAcAudioController,
  createAirConditionerStore,
  defaultAcState,
  isAcSoundMode,
  observeAcScale,
  observeAcTilt,
  resolveAcAudioAssets,
} from '@yunlefun-home/air-conditioner-core'
import { widgetStyleText } from './style'

export type WidgetAcMode = 'cold' | 'hot'

/** 声音模式：标准 / 睡眠（音量变小）/ 静音 */
export type WidgetAcSoundMode = 'normal' | 'sleep' | 'mute'

export interface WidgetAcState {
  status: boolean
  mode: WidgetAcMode
  temperature: number
  sound: WidgetAcSoundMode
  /** 扫风：出风左右摆动 */
  swing: boolean
}

export interface WidgetAcNotification {
  message: string
  severity: 'success' | 'error' | 'info'
}

export interface WidgetAcChangeEvent {
  action: unknown
  previousState: WidgetAcState
  state: WidgetAcState
  notification?: WidgetAcNotification
}

export interface WidgetAcStorage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem?: (key: string) => void
}

export interface DefineAirConditionerElementOptions {
  tagName?: string
  /** Logo 的替代文字 / 链接标题 */
  title?: string
  initialState?: Partial<WidgetAcState>
  storage?: WidgetAcStorage | null
  storageKey?: string
  /** 中央 Logo 图片地址，传空字符串则不显示，默认 `/yun-logo.svg` */
  logoUrl?: string
  /** Logo 链接 */
  logoHref?: string
  /** 静态资源基础路径（字体 / 音频所在目录），默认 `/assets` */
  assetsBaseUrl?: string
  /** 音频扩展名，默认 `m4a` */
  audioExt?: string
  /** 是否启用音效，默认 `true` */
  enableAudio?: boolean
  /** 是否显示能效标签，默认 `true` */
  showEnergyLabel?: boolean
  onNotify?: (notification: WidgetAcNotification, event: WidgetAcChangeEvent) => void
}

export interface MountAirConditionerOptions extends DefineAirConditionerElementOptions {}

const defaultTagName = 'air-conditioner-widget'
const digitFontStyleId = 'acw-digit-font'

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, char => `&#${char.charCodeAt(0)};`)
}

/**
 * Shadow DOM 内声明的 @font-face 不会生效，数码管字体需注入到 document（只注入一次）。
 */
function ensureDigitFont(assetsBaseUrl: string) {
  if (typeof document === 'undefined' || document.getElementById(digitFontStyleId))
    return

  const style = document.createElement('style')
  style.id = digitFontStyleId
  style.textContent = `@font-face {
  font-family: "Digital-7 Mono";
  src: url("${assetsBaseUrl.replace(/\/$/, '')}/fonts/digital-7-mono.ttf") format("truetype");
  font-display: swap;
}`
  document.head.appendChild(style)
}

function icon(name: AcIconName, size: number) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true"><path fill="currentColor" d="${acIconPaths[name]}" /></svg>`
}

function dotRow(row: AcDotRow) {
  const dots = Array.from({ length: row.num }).fill(`<span class="acw-dot" style="width: ${row.size}px; height: ${row.size}px; margin: ${row.my}px ${row.mx}px"></span>`).join('')
  return `<div class="acw-dot-row" style="--acw-dot-color: ${row.color}">${dots}</div>`
}

function energyLabel() {
  const levels = acEnergyLabel.levels
    .map(level => `<div class="acw-energy-level" style="background-color: ${level.background}; width: ${level.width}"></div>`)
    .join('')
  return `<div class="acw-energy-label">
    ${acEnergyLabel.top.map(row => dotRow(row)).join('')}
    <div class="acw-energy-grades">
      <div class="acw-energy-arrow"><div class="acw-arrow-bar"></div><div class="acw-arrow-tip"></div><div class="acw-arrow-bar acw-arrow-bar-sm"></div></div>
      ${levels}
    </div>
    <div class="acw-energy-detail">
      ${acEnergyLabel.detail.map((row, i) => dotRow(row) + (i === 0 ? '<div class="acw-energy-detail-line"></div>' : '')).join('')}
    </div>
    ${dotRow(acEnergyLabel.footer)}
  </div>`
}

interface WidgetViewOptions {
  title?: string
  logoUrl: string
  logoHref: string
  showEnergyLabel: boolean
  audio?: ReturnType<typeof resolveAcAudioAssets>
}

/**
 * 只在挂载时写入一次的骨架（结构与 Vue 版 AirConditionerWidget 一致）；之后的状态变化通过
 * `updateWidget` 增量更新，这样 CSS 过渡才能播放，按钮的键盘焦点也不会因整块重建而丢失。
 */
function widgetTemplate(view: WidgetViewOptions) {
  const audio = view.audio
    ? `<audio data-audio="beep" src="${escapeHtml(view.audio.beep)}" preload="auto"></audio>
      <audio data-audio="start" src="${escapeHtml(view.audio.start)}" preload="auto"></audio>
      <audio data-audio="work" src="${escapeHtml(view.audio.work)}" preload="auto"></audio>`
    : ''
  const logo = view.logoUrl
    ? `<div class="acw-logo"><a href="${escapeHtml(view.logoHref)}" target="_blank" rel="noreferrer noopener"${view.title ? ` title="${escapeHtml(view.title)}"` : ''}><img src="${escapeHtml(view.logoUrl)}" alt="${escapeHtml(view.title ?? 'logo')}"></a></div>`
    : ''
  return `
  <style>${widgetStyleText}</style>
  <div class="acw-root">
    ${audio}
    <div class="acw-unit">
      <div class="acw-shell">
        ${view.showEnergyLabel ? energyLabel() : ''}
        <div class="acw-display" aria-live="polite">
          <div class="acw-display-mode"><span class="acw-mode-icon"></span></div>
          <div class="acw-display-temp">
            <span class="acw-readout"><span class="acw-digit acw-temperature"></span><small class="acw-digit">°C</small></span>
            <span class="acw-digit acw-selftest" aria-hidden="true">88</span>
          </div>
        </div>
        ${logo}
        <div class="acw-outlet"></div>
        <div class="acw-vent" aria-hidden="true"></div>
        <div class="acw-louver" aria-hidden="true"></div>
        <span class="acw-led"></span>
      </div>
      <div class="acw-wind">
        <span class="acw-wind-line"></span><span class="acw-wind-line"></span><span class="acw-wind-line"></span>
      </div>
    </div>
    <div class="acw-remote" role="group" aria-label="Air conditioner remote control">
      <div class="acw-remote-row">
        <button type="button" class="acw-button acw-button-cold" aria-label="cold" data-action="cold">${icon('cold', 22)}</button>
        <button type="button" class="acw-button acw-button-power" aria-label="power" data-action="toggleStatus">${icon('power', 22)}</button>
        <button type="button" class="acw-button acw-button-hot" aria-label="hot" data-action="hot">${icon('hot', 22)}</button>
      </div>
      <button type="button" class="acw-button acw-button-temp" aria-label="add" data-action="increment">${icon('increase', 28)}</button>
      <button type="button" class="acw-button acw-button-temp" aria-label="reduce" data-action="decrement">${icon('decrease', 28)}</button>
      <div class="acw-remote-row">
        <button type="button" class="acw-button acw-button-swing" aria-label="swing" data-action="toggleSwing">${icon('swing', 20)}</button>
        <button type="button" class="acw-button acw-button-sound" aria-label="sound" data-action="cycleSound"></button>
      </div>
    </div>
    <div class="acw-notification-region" role="status"></div>
  </div>
`
}

/**
 * 用新节点替换旧节点，以便重新播放进入动画。
 */
function replaceAnimated(current: Element, text: string, attribute: [string, string]) {
  const next = current.cloneNode(false) as HTMLElement
  next.textContent = text
  next.setAttribute(...attribute)
  current.replaceWith(next)
}

function updateWidget(root: ShadowRoot, state: AcState, previous: AcState | undefined) {
  const status = state.status ? 'on' : 'off'
  for (const element of root.querySelectorAll<HTMLElement>('.acw-root, .acw-unit')) {
    element.dataset.mode = state.mode
    element.dataset.status = status
    element.dataset.swing = state.swing ? 'on' : 'off'
  }

  const mode = root.querySelector('.acw-mode-icon')!
  if (!previous)
    mode.textContent = acModeIcons[state.mode]
  else if (previous.mode !== state.mode)
    replaceAnimated(mode, acModeIcons[state.mode], ['data-animate', ''])

  const temperature = root.querySelector('.acw-temperature')!
  if (!previous)
    temperature.textContent = String(state.temperature)
  else if (previous.temperature !== state.temperature)
    replaceAnimated(temperature, String(state.temperature), ['data-dir', state.temperature > previous.temperature ? 'up' : 'down'])

  root.querySelector('.acw-led')!.setAttribute('aria-label', status)
  root.querySelector('.acw-wind')!.setAttribute('aria-hidden', state.status ? 'false' : 'true')
  root.querySelector('.acw-button-power')!.classList.toggle('acw-button-on', state.status)

  if (previous?.swing !== state.swing) {
    const swing = root.querySelector<HTMLElement>('.acw-button-swing')!
    swing.setAttribute('aria-pressed', String(state.swing))
    swing.title = `扫风：${state.swing ? '开' : '关'}`
  }

  if (previous?.sound !== state.sound) {
    const sound = root.querySelector<HTMLElement>('.acw-button-sound')!
    sound.dataset.sound = state.sound
    sound.title = `声音：${acSoundModeLabels[state.sound]}`
    sound.innerHTML = icon(acSoundIcons[state.sound], 20)
  }
}

function showNotification(root: ShadowRoot, notification: AcNotification) {
  const region = root.querySelector('.acw-notification-region')!
  const element = document.createElement('div')
  element.className = 'acw-notification'
  element.dataset.severity = notification.severity
  element.textContent = notification.message
  region.replaceChildren(element)
}

function boolAttribute(value: string | null, fallback?: boolean): boolean | undefined {
  if (value === null)
    return fallback

  return value !== 'false'
}

function numberAttribute(value: string | null): number | undefined {
  if (value === null)
    return undefined

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function modeAttribute(value: string | null): AcMode | undefined {
  return value === 'cold' || value === 'hot' ? value : undefined
}

function soundAttribute(value: string | null): AcSoundMode | undefined {
  return isAcSoundMode(value) ? value : undefined
}

function getInitialState(element: HTMLElement, defaults?: Partial<AcState>): Partial<AcState> {
  const state: Partial<AcState> = {
    ...defaults,
    mode: modeAttribute(element.getAttribute('mode')) ?? defaults?.mode,
    // 未设置 status 属性时沿用持久化状态（与 Vue / React 组件一致）
    status: boolAttribute(element.getAttribute('status'), defaults?.status),
    temperature: numberAttribute(element.getAttribute('temperature')) ?? defaults?.temperature,
    sound: soundAttribute(element.getAttribute('sound')) ?? defaults?.sound,
    swing: boolAttribute(element.getAttribute('swing'), defaults?.swing),
  }
  // 未指定的字段不能以 undefined 覆盖持久化 / 默认状态（否则 mode 会变成 undefined）
  for (const key of Object.keys(state) as (keyof AcState)[]) {
    if (state[key] === undefined)
      delete state[key]
  }
  return state
}

export function defineAirConditionerElement(options: DefineAirConditionerElementOptions = {}): CustomElementConstructor {
  const tagName = options.tagName ?? defaultTagName
  const existing = customElements.get(tagName)
  if (existing)
    return existing

  class AirConditionerWidgetElement extends HTMLElement {
    private store?: AirConditionerStore
    private unsubscribe?: () => void
    private renderedState?: AcState
    private stopObservers: (() => void)[] = []
    private audio?: AcAudioController

    static get observedAttributes() {
      return ['mode', 'status', 'temperature', 'sound', 'swing']
    }

    connectedCallback() {
      const assetsBaseUrl = options.assetsBaseUrl ?? '/assets'
      const enableAudio = options.enableAudio ?? true
      ensureDigitFont(assetsBaseUrl)
      if (!this.shadowRoot) {
        this.attachShadow({ mode: 'open' }).innerHTML = widgetTemplate({
          title: this.getAttribute('title') ?? options.title,
          logoUrl: options.logoUrl ?? '/yun-logo.svg',
          logoHref: options.logoHref ?? 'https://github.com/YunYouJun/air-conditioner',
          showEnergyLabel: options.showEnergyLabel ?? true,
          audio: enableAudio ? resolveAcAudioAssets(`${assetsBaseUrl}/audio`, options.audioExt ?? 'm4a') : undefined,
        })
      }

      this.store = createAirConditionerStore({
        ...options,
        storageKey: this.getAttribute('storage-key') ?? options.storageKey,
        initialState: getInitialState(this, options.initialState),
        onNotify: (notification, event) => {
          if (this.shadowRoot)
            showNotification(this.shadowRoot, notification)
          this.dispatchEvent(new CustomEvent('ac-notify', {
            detail: { notification, event },
            bubbles: true,
            composed: true,
          }))
          options.onNotify?.(notification, event)
        },
      })
      this.unsubscribe = this.store.subscribe((event) => {
        this.render()
        this.playAudio(event)
        this.dispatchEvent(new CustomEvent<WidgetAcChangeEvent>('ac-change', {
          detail: event,
          bubbles: true,
          composed: true,
        }))
      })
      this.shadowRoot?.addEventListener('click', this.onClick)
      this.renderedState = undefined
      this.render()

      // 窄容器下机身等比缩小，保持长款比例；精细指针下轻微 3D 倾斜
      const unit = this.shadowRoot?.querySelector<HTMLElement>('.acw-unit')
      if (unit) {
        this.stopObservers.forEach(stop => stop())
        this.stopObservers = [
          observeAcScale(unit, acShellSize.compact.width, (scale) => {
            unit.style.setProperty('--acw-scale', String(scale))
          }),
          observeAcTilt(unit, (x, y) => {
            unit.style.setProperty('--acw-tilt-x', `${x}deg`)
            unit.style.setProperty('--acw-tilt-y', `${y}deg`)
          }),
        ]
      }
    }

    disconnectedCallback() {
      this.unsubscribe?.()
      this.audio?.dispose()
      this.audio = undefined
      this.stopObservers.forEach(stop => stop())
      this.stopObservers = []
      this.shadowRoot?.removeEventListener('click', this.onClick)
    }

    attributeChangedCallback() {
      if (!this.store)
        return

      this.store.dispatch({
        type: 'update',
        payload: getInitialState(this, this.store.getState()),
      })
    }

    private onClick = (event: Event) => {
      // 按钮内是 SVG 图标，点击目标可能是 path，向上查找带 data-action 的按钮
      const target = (event.target as Element | null)?.closest<HTMLElement>('[data-action]')
      const action = target?.dataset.action
      if (!action || !this.store)
        return

      if (action === 'cold' || action === 'hot')
        this.store.dispatch({ type: 'mode', mode: action })
      else if (action === 'toggleStatus')
        this.store.dispatch({ type: 'toggleStatus' })
      else if (action === 'increment' || action === 'decrement' || action === 'cycleSound' || action === 'toggleSwing')
        this.store.dispatch({ type: action })
    }

    /**
     * 同步声音模式后播放按键「嘀」声；开关状态翻转时播放启动 / 关闭音效（与 Vue 版 useAcAudio 一致）。
     */
    private playAudio(event: { previousState: AcState, state: AcState }) {
      const root = this.shadowRoot
      if (!root?.querySelector('audio'))
        return
      this.audio ||= createAcAudioController({
        beep: root.querySelector<HTMLAudioElement>('[data-audio="beep"]'),
        start: root.querySelector<HTMLAudioElement>('[data-audio="start"]'),
        work: root.querySelector<HTMLAudioElement>('[data-audio="work"]'),
      }, { soundMode: event.state.sound })
      if (event.previousState.sound !== event.state.sound)
        this.audio.setSoundMode(event.state.sound)
      this.audio.beep()
      if (event.previousState.status !== event.state.status)
        this.audio.toggleStatusAudio(event.previousState.status)
    }

    private render() {
      const state = this.store?.getState() ?? defaultAcState
      if (this.shadowRoot)
        updateWidget(this.shadowRoot, state, this.renderedState)
      this.renderedState = state
    }
  }

  customElements.define(tagName, AirConditionerWidgetElement)
  return AirConditionerWidgetElement
}

export function mountAirConditioner(target: string | HTMLElement, options: MountAirConditionerOptions = {}): HTMLElement {
  const tagName = options.tagName ?? defaultTagName
  defineAirConditionerElement(options)

  const targetElement = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target
  if (!targetElement)
    throw new Error(`Unable to find target: ${String(target)}`)

  if (targetElement.localName === tagName)
    return targetElement

  const element = document.createElement(tagName)
  if (options.storageKey)
    element.setAttribute('storage-key', options.storageKey)
  if (options.title)
    element.setAttribute('title', options.title)

  targetElement.appendChild(element)
  return element
}
