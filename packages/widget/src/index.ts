import type {
  AcAudioController,
  AcChangeEvent,
  AcDotRow,
  AcFanSpeed,
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
  acModeLabels,
  acShellSize,
  acSoundIcons,
  bindAcPressRepeat,
  createAcAudioController,
  createAcNotificationPresenter,
  createAirConditionerStore,
  defaultAcState,
  getAcCondensationStyle,
  getAcEnergyLabelText,
  getAcRemoteText,
  isAcFanSpeed,
  isAcSoundMode,
  observeAcScale,
  observeAcTilt,
  resolveAcAudioAssets,
} from '@yunlefun-home/air-conditioner-core'
import { floatingStyleText } from './floating-style'
import { widgetStyleText } from './style'

export { cdnAssets } from './cdn-assets'

export type WidgetAcMode = 'cold' | 'hot'

/** 声音模式：标准 / 睡眠（音量变小）/ 静音 */
export type WidgetAcSoundMode = 'normal' | 'sleep' | 'mute'

/** 风速：自动 / 低 / 中 / 高 */
export type WidgetAcFanSpeed = 'auto' | 'low' | 'medium' | 'high'

/** 行内显示，或固定在网页左上 / 右上角，遥控器位于同侧下角。 */
export type WidgetAcPlacement = 'inline' | 'top-left' | 'top-right'

export interface WidgetAcState {
  status: boolean
  mode: WidgetAcMode
  temperature: number
  sound: WidgetAcSoundMode
  /** 扫风：导风板与出风来回摆动 */
  swing: boolean
  /** 风速，旧版本保存的状态缺省为自动 */
  fan?: WidgetAcFanSpeed
  /** 各模式最近一次的设定温度（制冷 / 制热分开记忆） */
  temperatures?: Record<WidgetAcMode, number>
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
  /** 默认行内显示；悬浮时可点击或通过键盘展开遥控器。 */
  placement?: WidgetAcPlacement
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

function icon(name: AcIconName, size: number, className?: string) {
  const attrs = className ? ` class="${className}"` : ''
  return `<svg${attrs} viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true"><path fill="currentColor" d="${acIconPaths[name]}" /></svg>`
}

function dotRow(row: AcDotRow) {
  const dots = Array.from({ length: row.num }).fill(`<span class="acw-dot" style="width: ${row.size}px; height: ${row.size}px; margin: ${row.my}px ${row.mx}px"></span>`).join('')
  return `<div class="acw-dot-row" style="--acw-dot-color: ${row.color}">${dots}</div>`
}

function energyLabel() {
  const levels = acEnergyLabel.levels
    .map(level => `<div class="acw-energy-level" style="background-color: ${level.background}; width: ${level.width}"></div>`)
    .join('')
  return `<div class="acw-energy-label" role="img" aria-label="${getAcEnergyLabelText()}">
    <div class="acw-energy-header">${acEnergyLabel.top.map(row => dotRow(row)).join('')}<span class="acw-energy-qr"></span></div>
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
  inlineStyle: boolean
}

let sharedStyleSheet: CSSStyleSheet | null | undefined

function getSharedStyleSheet(): CSSStyleSheet | null {
  if (sharedStyleSheet !== undefined)
    return sharedStyleSheet
  try {
    if (typeof CSSStyleSheet === 'function' && 'replaceSync' in CSSStyleSheet.prototype) {
      const sheet = new CSSStyleSheet()
      sheet.replaceSync(`${widgetStyleText}${floatingStyleText}`)
      sharedStyleSheet = sheet
      return sheet
    }
  }
  catch {
    // Fall back to an inline <style> tag when Constructable Stylesheets are unavailable.
  }
  sharedStyleSheet = null
  return null
}

/**
 * 只在挂载时写入一次的骨架（结构与 Vue 版 AirConditionerWidget 一致）；之后的状态变化通过
 * `updateWidget` 增量更新，这样 CSS 过渡才能播放，按钮的键盘焦点也不会因整块重建而丢失。
 */
function widgetTemplate(view: WidgetViewOptions) {
  const audio = view.audio
    ? `<audio data-audio="beep" src="${escapeHtml(view.audio.beep)}" preload="none"></audio>
      <audio data-audio="start" src="${escapeHtml(view.audio.start)}" preload="none"></audio>
      <audio data-audio="work" src="${escapeHtml(view.audio.work)}" preload="none"></audio>`
    : ''
  const logo = view.logoUrl
    ? `<div class="acw-logo"><a href="${escapeHtml(view.logoHref)}" target="_blank" rel="noreferrer noopener"${view.title ? ` title="${escapeHtml(view.title)}"` : ''} aria-label="${escapeHtml(view.title ?? 'Air Conditioner')}"><img src="${escapeHtml(view.logoUrl)}" alt=""></a></div>`
    : ''
  return `
  ${view.inlineStyle ? `<style>${widgetStyleText}${floatingStyleText}</style>` : ''}
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
        <div class="acw-mist" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
        <span class="acw-drip" aria-hidden="true"></span>
        <span class="acw-led"></span>
      </div>
      <div class="acw-wind">
        <span class="acw-wind-line"></span><span class="acw-wind-line"></span><span class="acw-wind-line"></span>
      </div>
    </div>
    <div class="acw-notification-region" role="status"><span class="acw-sr-only"></span></div>
    <div class="acw-dock">
    <button type="button" class="acw-remote-toggle" aria-expanded="false" aria-controls="acw-remote-panel" hidden><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M9 6h6M9 10h6M9 14h2m2 0h2m-6 4h2m2 0h2"/></svg><span class="acw-toggle-label">打开遥控器</span></button>
    <div class="acw-remote-panel" id="acw-remote-panel">
    <div class="acw-remote" role="group" aria-label="Air conditioner remote control">
      <div class="acw-lcd" role="img">
        <div class="acw-lcd-main">
          <span class="acw-lcd-mode-slot"></span>
          <span class="acw-lcd-temp acw-digit"><span class="acw-lcd-temp-value"></span><small>°C</small></span>
        </div>
        <div class="acw-lcd-status" aria-hidden="true">
          <span class="acw-lcd-wind"><i></i><i></i><i></i><b>自动</b></span>
          ${icon('swing', 14, 'acw-lcd-swing')}
          <span class="acw-lcd-sound-slot"></span>
        </div>
      </div>
      <button type="button" class="acw-button acw-button-power" aria-label="power" data-action="toggleStatus">${icon('power', 24)}</button>
      <div class="acw-remote-temp">
        <button type="button" class="acw-button acw-button-temp" aria-label="add" title="温度 +（长按连续调）" data-repeat="increment">${icon('plus', 28)}</button>
        <button type="button" class="acw-button acw-button-temp" aria-label="reduce" title="温度 −（长按连续调）" data-repeat="decrement">${icon('minus', 28)}</button>
      </div>
      <div class="acw-remote-row">
        <div class="acw-remote-mode" role="group" aria-label="mode">
          <button type="button" class="acw-button acw-button-cold" aria-label="cold" title="${acModeLabels.cold}" data-action="cold">${icon('cold', 18)}</button>
          <button type="button" class="acw-button acw-button-hot" aria-label="hot" title="${acModeLabels.hot}" data-action="hot">${icon('hot', 18)}</button>
        </div>
        <button type="button" class="acw-button acw-button-fan" aria-label="fan" data-action="cycleFan">${icon('fan', 20)}</button>
        <button type="button" class="acw-button acw-button-swing" aria-label="swing" data-action="toggleSwing">${icon('swing', 20)}</button>
        <button type="button" class="acw-button acw-button-sound" aria-label="sound" data-action="cycleSound"></button>
      </div>
    </div>
    </div>
    </div>
  </div>
`
}

interface WidgetRefs {
  root: HTMLElement
  unit: HTMLElement
  modeIcon: Element
  temperature: Element
  led: Element
  wind: Element
  lcd: HTMLElement
  lcdTempValue: Element
  lcdModeSlot: Element
  lcdSoundSlot: Element
  powerButton: HTMLButtonElement
  coldButton: Element
  hotButton: Element
  fanButton: HTMLElement
  swingButton: HTMLElement
  soundButton: HTMLElement
  remoteToggle: HTMLButtonElement
  remoteToggleLabel: Element | null
  remotePanel: HTMLElement
}

function collectWidgetRefs(shadowRoot: ShadowRoot): WidgetRefs {
  return {
    root: shadowRoot.querySelector<HTMLElement>('.acw-root')!,
    unit: shadowRoot.querySelector<HTMLElement>('.acw-unit')!,
    modeIcon: shadowRoot.querySelector('.acw-mode-icon')!,
    temperature: shadowRoot.querySelector('.acw-temperature')!,
    led: shadowRoot.querySelector('.acw-led')!,
    wind: shadowRoot.querySelector('.acw-wind')!,
    lcd: shadowRoot.querySelector<HTMLElement>('.acw-lcd')!,
    lcdTempValue: shadowRoot.querySelector('.acw-lcd-temp-value')!,
    lcdModeSlot: shadowRoot.querySelector('.acw-lcd-mode-slot')!,
    lcdSoundSlot: shadowRoot.querySelector('.acw-lcd-sound-slot')!,
    powerButton: shadowRoot.querySelector<HTMLButtonElement>('.acw-button-power')!,
    coldButton: shadowRoot.querySelector('.acw-button-cold')!,
    hotButton: shadowRoot.querySelector('.acw-button-hot')!,
    fanButton: shadowRoot.querySelector<HTMLElement>('.acw-button-fan')!,
    swingButton: shadowRoot.querySelector<HTMLElement>('.acw-button-swing')!,
    soundButton: shadowRoot.querySelector<HTMLElement>('.acw-button-sound')!,
    remoteToggle: shadowRoot.querySelector<HTMLButtonElement>('.acw-remote-toggle')!,
    remoteToggleLabel: shadowRoot.querySelector('.acw-toggle-label'),
    remotePanel: shadowRoot.querySelector<HTMLElement>('.acw-remote-panel')!,
  }
}

/**
 * 用新节点替换旧节点，以便重新播放进入动画。
 */
function replaceAnimated(current: Element, text: string, attribute: [string, string]): HTMLElement {
  const next = current.cloneNode(false) as HTMLElement
  next.textContent = text
  next.setAttribute(...attribute)
  next.addEventListener('animationend', () => next.removeAttribute(attribute[0]), { once: true })
  current.replaceWith(next)
  return next
}

function updateWidget(refs: WidgetRefs, state: AcState, previous: AcState | undefined) {
  const status = state.status ? 'on' : 'off'
  const fan = state.fan ?? 'auto'
  for (const element of [refs.root, refs.unit]) {
    element.dataset.mode = state.mode
    element.dataset.status = status
    element.dataset.swing = state.swing ? 'on' : 'off'
    element.dataset.fan = fan
  }

  if (!state.status || (previous && previous.status !== state.status))
    refs.unit.removeAttribute('data-skip-selftest')

  if (!previous) {
    refs.modeIcon.textContent = acModeIcons[state.mode]
    refs.modeIcon.removeAttribute('data-animate')
  }
  else if (previous.mode !== state.mode) {
    refs.modeIcon = replaceAnimated(refs.modeIcon, acModeIcons[state.mode], ['data-animate', ''])
  }

  if (!previous) {
    refs.temperature.textContent = String(state.temperature)
    refs.temperature.removeAttribute('data-dir')
  }
  else if (previous.temperature !== state.temperature) {
    refs.temperature = replaceAnimated(refs.temperature, String(state.temperature), ['data-dir', state.temperature > previous.temperature ? 'up' : 'down'])
  }

  // 雾气浓度与冷凝水滴落间隔（#70 / #21）
  const condensation = getAcCondensationStyle(state)
  refs.unit.dataset.drip = condensation.drip
  refs.unit.dataset.mist = condensation.mist > 0 ? 'on' : 'off'
  refs.unit.style.setProperty('--acw-mist', String(condensation.mist))
  if (condensation.dripCycle)
    refs.unit.style.setProperty('--acw-drip-cycle', condensation.dripCycle)
  else
    refs.unit.style.removeProperty('--acw-drip-cycle')

  refs.led.setAttribute('aria-label', status)
  refs.wind.setAttribute('aria-hidden', state.status ? 'false' : 'true')
  updateRemote(refs, state, previous)
}

/**
 * 遥控器：小屏与按键状态，结构与 Vue / React 的 RemoteControl 一致。
 */
function updateRemote(refs: WidgetRefs, state: AcState, previous: AcState | undefined) {
  const text = getAcRemoteText(state)

  refs.lcd.setAttribute('aria-label', text.display)
  refs.lcd.dataset.status = state.status ? 'on' : 'off'
  refs.lcd.dataset.mode = state.mode
  refs.lcd.dataset.swing = state.swing ? 'on' : 'off'
  refs.lcd.dataset.fan = state.fan ?? 'auto'
  refs.lcdTempValue.textContent = String(state.temperature)

  refs.powerButton.classList.toggle('acw-button-on', state.status)
  refs.powerButton.setAttribute('aria-pressed', String(state.status))
  refs.powerButton.title = text.power

  if (previous?.mode !== state.mode) {
    refs.lcdModeSlot.innerHTML = icon(state.mode, 22, 'acw-lcd-mode')
    refs.coldButton.setAttribute('aria-pressed', String(state.mode === 'cold'))
    refs.hotButton.setAttribute('aria-pressed', String(state.mode === 'hot'))
  }

  if (previous?.fan !== state.fan) {
    refs.fanButton.dataset.fan = state.fan ?? 'auto'
    refs.fanButton.title = text.fan
  }

  if (previous?.swing !== state.swing) {
    refs.swingButton.setAttribute('aria-pressed', String(state.swing))
    refs.swingButton.title = text.swing
  }

  if (previous?.sound !== state.sound) {
    refs.soundButton.dataset.sound = state.sound
    refs.soundButton.title = text.sound
    refs.soundButton.innerHTML = icon(acSoundIcons[state.sound], 20)
    refs.lcdSoundSlot.innerHTML = icon(acSoundIcons[state.sound], 14, 'acw-lcd-sound')
    refs.lcdSoundSlot.querySelector('.acw-lcd-sound')!.setAttribute('data-sound', state.sound)
  }
}

/** 纸条停留多久后被风吹走，以及吹走动画的时长（与样式里的 acw-note-away 一致） */
const noteStayMs = 3600
const noteAwayMs = 460

/**
 * 按 core 的呈现方式显示一条提示：节能建议是「出风口吹出的小纸条」，温度到上下限时
 * 小屏抖一下，设置变化只给读屏播报（结构与 Vue / React 一致）。
 */
function createNotificationView(root: ShadowRoot) {
  const region = root.querySelector('.acw-notification-region')!
  const lcd = root.querySelector<HTMLElement>('.acw-lcd')!
  const announce = region.querySelector('.acw-sr-only')!
  const present = createAcNotificationPresenter()
  let disposed = false
  let note: HTMLElement | undefined
  let noteTimer: ReturnType<typeof setTimeout> | undefined
  let shakeTimer: ReturnType<typeof setTimeout> | undefined

  return {
    present(notification: AcNotification, state: AcState) {
      if (disposed)
        return
      const how = present(notification, state)
      if (how === 'skip')
        return
      if (how === 'shake') {
        clearTimeout(shakeTimer)
        lcd.removeAttribute('data-alert')
        // 重新触发动画
        void lcd.offsetWidth
        lcd.setAttribute('data-alert', '')
        shakeTimer = setTimeout(() => {
          shakeTimer = undefined
          if (!disposed)
            lcd.removeAttribute('data-alert')
        }, 400)
      }
      if (how !== 'note') {
        announce.textContent = notification.message
        return
      }

      clearTimeout(noteTimer)
      note?.remove()
      const next = document.createElement('div')
      note = next
      next.className = 'acw-note'
      next.dataset.severity = notification.severity
      next.dataset.mode = state.mode
      next.innerHTML = `<span class="acw-note-icon" aria-hidden="true">${icon('leaf', 14)}</span><span class="acw-note-text"><strong></strong>${notification.detail ? '<small></small>' : ''}</span>`
      next.querySelector('strong')!.textContent = notification.message
      if (notification.detail)
        next.querySelector('small')!.textContent = notification.detail
      region.prepend(next)
      noteTimer = setTimeout(() => {
        if (disposed || note !== next)
          return
        next.dataset.leaving = ''
        noteTimer = setTimeout(() => {
          if (disposed || note !== next)
            return
          next.remove()
          note = undefined
          noteTimer = undefined
        }, noteAwayMs)
      }, noteStayMs)
    },
    dispose() {
      disposed = true
      clearTimeout(noteTimer)
      clearTimeout(shakeTimer)
      noteTimer = shakeTimer = undefined
      note?.remove()
      note = undefined
      lcd.removeAttribute('data-alert')
      announce.textContent = ''
    },
  }
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

function fanAttribute(value: string | null): AcFanSpeed | undefined {
  return isAcFanSpeed(value) ? value : undefined
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
    fan: fanAttribute(element.getAttribute('fan')) ?? defaults?.fan,
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
    private refs?: WidgetRefs
    private stopObservers: (() => void)[] = []
    private audio?: AcAudioController
    private audioRunning = false
    private notificationView?: ReturnType<typeof createNotificationView>
    private notificationOwners = new WeakMap<AcChangeEvent, ReturnType<typeof createNotificationView>>()
    private placement?: WidgetAcPlacement

    static get observedAttributes() {
      return ['mode', 'status', 'temperature', 'sound', 'swing', 'fan', 'placement']
    }

    connectedCallback() {
      this.teardownConnection()

      const assetsBaseUrl = options.assetsBaseUrl ?? '/assets'
      const enableAudio = options.enableAudio ?? true
      ensureDigitFont(assetsBaseUrl)
      if (!this.shadowRoot) {
        const root = this.attachShadow({ mode: 'open' })
        const sheet = getSharedStyleSheet()
        const supportsAdopted = Boolean(sheet && 'adoptedStyleSheets' in root)
        root.innerHTML = widgetTemplate({
          title: this.getAttribute('title') ?? options.title,
          logoUrl: options.logoUrl ?? '/yun-logo.svg',
          logoHref: options.logoHref ?? 'https://github.com/YunYouJun/air-conditioner',
          showEnergyLabel: options.showEnergyLabel ?? true,
          audio: enableAudio ? resolveAcAudioAssets(`${assetsBaseUrl}/audio`, options.audioExt ?? 'm4a') : undefined,
          inlineStyle: !supportsAdopted,
        })
        if (supportsAdopted && sheet)
          root.adoptedStyleSheets = [sheet]
      }

      this.refs ||= collectWidgetRefs(this.shadowRoot!)
      const notificationView = createNotificationView(this.shadowRoot!)
      this.notificationView = notificationView
      // The model belongs to this element; only connection resources are recreated.
      const reconnecting = Boolean(this.store)
      this.store ||= createAirConditionerStore({
        ...options,
        storageKey: this.getAttribute('storage-key') ?? options.storageKey,
        initialState: getInitialState(this, options.initialState),
        onNotify: (notification, event) => {
          // ac-change can remove/reconnect this element and dispatch a nested action.
          // Present only in the connection that observed this particular event.
          const owner = this.notificationOwners.get(event)
          this.notificationOwners.delete(event)
          owner?.present(notification, event.state)
          this.dispatchEvent(new CustomEvent('ac-notify', {
            detail: { notification, event },
            bubbles: true,
            composed: true,
          }))
          options.onNotify?.(notification, event)
        },
      })
      this.unsubscribe = this.store.subscribe((event) => {
        if (event.notification)
          this.notificationOwners.set(event, notificationView)
        this.render()
        this.playAudio(event)
        this.dispatchEvent(new CustomEvent<WidgetAcChangeEvent>('ac-change', {
          detail: event,
          bubbles: true,
          composed: true,
        }))
      })
      this.shadowRoot?.addEventListener('pointerdown', this.onWarm, true)
      this.shadowRoot?.addEventListener('keydown', this.onWarm, true)
      this.shadowRoot?.addEventListener('click', this.onClick)
      this.shadowRoot?.addEventListener('keydown', this.onKeyDown)
      this.shadowRoot?.addEventListener('animationiteration', this.onDrip)
      const initial = this.store.getState()
      if (!initial.status)
        this.audioRunning = false
      if (reconnecting && initial.status)
        this.refs.unit.setAttribute('data-skip-selftest', '')
      if (reconnecting && this.audioRunning && initial.status)
        this.ensureAudio(initial.sound, initial.fan ?? 'auto')?.resumeFan()
      this.updatePlacement()
      this.renderedState = undefined
      this.render()

      // 窄容器下机身等比缩小，保持长款比例；精细指针下轻微 3D 倾斜
      const unit = this.refs.unit
      this.stopObservers.push(
        observeAcScale(unit, acShellSize.compact.width, (scale) => {
          unit.style.setProperty('--acw-scale', String(scale))
        }),
        observeAcTilt(unit, (x, y) => {
          unit.style.setProperty('--acw-tilt-x', `${x}deg`)
          unit.style.setProperty('--acw-tilt-y', `${y}deg`)
        }),
      )

      // 温度键：长按连续调温，到上下限就停
      const value = () => this.store?.getState().temperature
      for (const button of this.shadowRoot?.querySelectorAll<HTMLElement>('[data-repeat]') ?? []) {
        const type = button.dataset.repeat === 'increment' ? 'increment' : 'decrement'
        this.stopObservers.push(bindAcPressRepeat(button, () => this.store?.dispatch({ type }), { value }))
      }
    }

    disconnectedCallback() {
      this.teardownConnection()
    }

    private teardownConnection() {
      this.notificationView?.dispose()
      this.notificationView = undefined
      this.unsubscribe?.()
      this.unsubscribe = undefined
      this.audio?.dispose()
      this.audio = undefined
      this.stopObservers.forEach(stop => stop())
      this.stopObservers = []
      this.shadowRoot?.removeEventListener('pointerdown', this.onWarm, true)
      this.shadowRoot?.removeEventListener('keydown', this.onWarm, true)
      this.shadowRoot?.removeEventListener('click', this.onClick)
      this.shadowRoot?.removeEventListener('keydown', this.onKeyDown)
      this.shadowRoot?.removeEventListener('animationiteration', this.onDrip)
    }

    /** 一滴冷凝水落下：「嗒」一声（只在标准声音下，且已经有过操作、创建了音频） */
    private onDrip = (event: Event) => {
      if ((event.target as Element | null)?.classList.contains('acw-drip'))
        this.audio?.drip()
    }

    attributeChangedCallback(name: string) {
      if (name === 'placement') {
        this.updatePlacement()
        return
      }
      if (!this.store)
        return

      this.store.dispatch({
        type: 'update',
        payload: getInitialState(this, this.store.getState()),
      })
    }

    /** 捕获阶段唤醒音频，赶在 click 和温度键的 pointerdown 发声之前。 */
    private onWarm = () => {
      const state = this.store?.getState()
      this.ensureAudio(state?.sound, state?.fan ?? 'auto')?.unlock()
    }

    private onClick = (event: Event) => {
      if ((event.target as Element | null)?.closest('.acw-remote-toggle')) {
        if (this.refs)
          this.setRemoteOpen(Boolean(this.refs.remotePanel.hidden))
        return
      }
      // 按钮内是 SVG 图标，点击目标可能是 path，向上查找带 data-action 的按钮
      const target = (event.target as Element | null)?.closest<HTMLElement>('[data-action]')
      const action = target?.dataset.action
      if (!action || !this.store)
        return

      // 模式键：关机时按下也会开机，和真的遥控器一样
      if (action === 'cold' || action === 'hot')
        this.store.dispatch({ type: 'mode', mode: action, powerOn: true })
      else if (action === 'toggleStatus')
        this.store.dispatch({ type: 'toggleStatus' })
      else if (action === 'cycleSound' || action === 'toggleSwing' || action === 'cycleFan')
        this.store.dispatch({ type: action })
    }

    private updatePlacement() {
      if (!this.shadowRoot || !this.refs)
        return
      const value = this.getAttribute('placement') ?? options.placement
      const placement = value === 'top-left' || value === 'top-right' ? value : 'inline'
      const wasFloating = this.placement && this.placement !== 'inline'
      this.placement = placement
      this.dataset.acPlacement = placement
      const toggle = this.refs.remoteToggle
      const focusRemote = placement === 'inline' && this.shadowRoot.activeElement === toggle
      toggle.hidden = placement === 'inline'
      // Switching sides retains the disclosure state; entering floating mode starts compact.
      if (placement === 'inline' || !wasFloating)
        this.setRemoteOpen(placement === 'inline')
      // Browsers cannot focus a control while its panel is still hidden.
      if (focusRemote)
        this.refs.powerButton.focus()
    }

    private setRemoteOpen(open: boolean) {
      if (!this.refs)
        return
      const { remotePanel: panel, remoteToggle: toggle, remoteToggleLabel: label } = this.refs
      if (!open && this.shadowRoot?.activeElement && panel.contains(this.shadowRoot.activeElement))
        toggle.focus()
      panel.hidden = !open
      toggle.setAttribute('aria-expanded', String(open))
      if (label)
        label.textContent = open ? '收起遥控器' : '打开遥控器'
    }

    private onKeyDown = (event: Event) => {
      const keyboardEvent = event as KeyboardEvent
      if (keyboardEvent.key !== 'Escape' || this.placement === 'inline')
        return
      const panel = this.refs?.remotePanel
      if (!panel || panel.hidden)
        return
      keyboardEvent.preventDefault()
      keyboardEvent.stopPropagation()
      this.setRemoteOpen(false)
      this.refs?.remoteToggle.focus()
    }

    /**
     * 有 `<audio>` 时创建控制器并开始解码。重复调用沿用已创建的那一个。
     */
    private ensureAudio(soundMode?: AcSoundMode, fanSpeed?: AcFanSpeed) {
      const root = this.shadowRoot
      if (!root?.querySelector('audio'))
        return undefined

      this.audio ||= createAcAudioController({
        beep: root.querySelector<HTMLAudioElement>('[data-audio="beep"]'),
        start: root.querySelector<HTMLAudioElement>('[data-audio="start"]'),
        work: root.querySelector<HTMLAudioElement>('[data-audio="work"]'),
      }, { soundMode, fanSpeed })
      return this.audio
    }

    /**
     * 同步声音模式后播放按键「嘀」声；开关状态翻转时播放启动 / 关闭音效（与 Vue 版 useAcAudio 一致）。
     */
    private playAudio(event: { previousState: AcState, state: AcState }) {
      const audio = this.ensureAudio(event.state.sound, event.state.fan ?? 'auto')
      if (!audio)
        return
      if (event.previousState.sound !== event.state.sound)
        audio.setSoundMode(event.state.sound)
      if (event.previousState.fan !== event.state.fan)
        audio.setFanSpeed(event.state.fan ?? 'auto')
      audio.beep()
      if (event.previousState.status !== event.state.status) {
        this.audioRunning = event.state.status
        audio.toggleStatusAudio(event.previousState.status)
      }
    }

    private render() {
      const state = this.store?.getState() ?? defaultAcState
      if (this.refs)
        updateWidget(this.refs, state, this.renderedState)
      this.renderedState = state
    }
  }

  customElements.define(tagName, AirConditionerWidgetElement)
  return AirConditionerWidgetElement
}

export function mountAirConditioner(target: string | HTMLElement, options: MountAirConditionerOptions = {}): HTMLElement {
  // Mount placement is per instance; only explicit registration sets a tag-wide default.
  const { placement, ...elementOptions } = options
  const tagName = options.tagName ?? defaultTagName
  defineAirConditionerElement(elementOptions)

  const targetElement = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target
  if (!targetElement)
    throw new Error(`Unable to find target: ${String(target)}`)

  if (targetElement.localName === tagName) {
    if (placement)
      targetElement.setAttribute('placement', placement)
    return targetElement
  }

  const element = document.createElement(tagName)
  if (options.storageKey)
    element.setAttribute('storage-key', options.storageKey)
  if (options.title)
    element.setAttribute('title', options.title)
  if (placement)
    element.setAttribute('placement', placement)

  targetElement.appendChild(element)
  return element
}
