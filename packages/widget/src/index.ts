import type {
  AcAudioController,
  AcDotRow,
  AcFanSpeed,
  AcIconName,
  AcMode,
  AcNotification,
  AcNotificationPresentation,
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
    ? `<div class="acw-logo"><a href="${escapeHtml(view.logoHref)}" target="_blank" rel="noreferrer noopener"${view.title ? ` title="${escapeHtml(view.title)}"` : ''} aria-label="${escapeHtml(view.title ?? 'Air Conditioner')}"><img src="${escapeHtml(view.logoUrl)}" alt=""></a></div>`
    : ''
  return `
  <style>${widgetStyleText}${floatingStyleText}</style>
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
    <button type="button" class="acw-remote-toggle" aria-expanded="false" aria-controls="acw-remote-panel" hidden>打开遥控器</button>
    <div class="acw-remote-panel" id="acw-remote-panel">
    <div class="acw-remote" role="group" aria-label="Air conditioner remote control">
      <div class="acw-lcd" role="img">
        <div class="acw-lcd-main">
          <span class="acw-lcd-mode-slot"></span>
          <span class="acw-lcd-temp acw-digit"></span>
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
    element.dataset.fan = state.fan ?? 'auto'
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

  // 雾气浓度与冷凝水滴落间隔（#70 / #21）
  const unit = root.querySelector<HTMLElement>('.acw-unit')!
  const condensation = getAcCondensationStyle(state)
  unit.dataset.drip = condensation.drip
  unit.style.setProperty('--acw-mist', String(condensation.mist))
  if (condensation.dripCycle)
    unit.style.setProperty('--acw-drip-cycle', condensation.dripCycle)
  else
    unit.style.removeProperty('--acw-drip-cycle')

  root.querySelector('.acw-led')!.setAttribute('aria-label', status)
  root.querySelector('.acw-wind')!.setAttribute('aria-hidden', state.status ? 'false' : 'true')
  updateRemote(root, state, previous)
}

/**
 * 遥控器：小屏与按键状态，结构与 Vue / React 的 RemoteControl 一致。
 */
function updateRemote(root: ShadowRoot, state: AcState, previous: AcState | undefined) {
  const text = getAcRemoteText(state)

  const lcd = root.querySelector<HTMLElement>('.acw-lcd')!
  lcd.setAttribute('aria-label', text.display)
  lcd.dataset.status = state.status ? 'on' : 'off'
  lcd.dataset.mode = state.mode
  lcd.dataset.swing = state.swing ? 'on' : 'off'
  lcd.dataset.fan = state.fan ?? 'auto'
  root.querySelector('.acw-lcd-temp')!.innerHTML = `${state.temperature}<small>°C</small>`

  const power = root.querySelector<HTMLElement>('.acw-button-power')!
  power.classList.toggle('acw-button-on', state.status)
  power.setAttribute('aria-pressed', String(state.status))
  power.title = text.power

  if (previous?.mode !== state.mode) {
    root.querySelector('.acw-lcd-mode-slot')!.innerHTML = icon(state.mode, 22, 'acw-lcd-mode')
    for (const mode of ['cold', 'hot'] as const)
      root.querySelector(`.acw-button-${mode}`)!.setAttribute('aria-pressed', String(state.mode === mode))
  }

  if (previous?.fan !== state.fan) {
    const fan = root.querySelector<HTMLElement>('.acw-button-fan')!
    fan.dataset.fan = state.fan ?? 'auto'
    fan.title = text.fan
  }

  if (previous?.swing !== state.swing) {
    const swing = root.querySelector<HTMLElement>('.acw-button-swing')!
    swing.setAttribute('aria-pressed', String(state.swing))
    swing.title = text.swing
  }

  if (previous?.sound !== state.sound) {
    const sound = root.querySelector<HTMLElement>('.acw-button-sound')!
    sound.dataset.sound = state.sound
    sound.title = text.sound
    sound.innerHTML = icon(acSoundIcons[state.sound], 20)
    root.querySelector('.acw-lcd-sound-slot')!.innerHTML = icon(acSoundIcons[state.sound], 14, 'acw-lcd-sound')
    root.querySelector('.acw-lcd-sound')!.setAttribute('data-sound', state.sound)
  }
}

/** 纸条停留多久后被风吹走，以及吹走动画的时长（与样式里的 acw-note-away 一致） */
const noteStayMs = 3600
const noteAwayMs = 460

/**
 * 按 core 的呈现方式显示一条提示：节能建议是「出风口吹出的小纸条」，温度到上下限时
 * 小屏抖一下，设置变化只给读屏播报（结构与 Vue / React 一致）。
 */
function presentNotification(root: ShadowRoot, notification: AcNotification, how: AcNotificationPresentation, state: AcState) {
  if (how === 'skip')
    return
  if (how === 'shake')
    shakeLcd(root)
  if (how !== 'note') {
    root.querySelector('.acw-notification-region .acw-sr-only')!.textContent = notification.message
    return
  }

  const region = root.querySelector('.acw-notification-region')!
  region.querySelector('.acw-note')?.remove()
  const note = document.createElement('div')
  note.className = 'acw-note'
  note.dataset.severity = notification.severity
  note.dataset.mode = state.mode
  note.innerHTML = `<span class="acw-note-icon" aria-hidden="true">${icon('leaf', 14)}</span><span class="acw-note-text"><strong></strong>${notification.detail ? '<small></small>' : ''}</span>`
  note.querySelector('strong')!.textContent = notification.message
  if (notification.detail)
    note.querySelector('small')!.textContent = notification.detail
  region.prepend(note)
  setTimeout(() => {
    note.dataset.leaving = ''
    setTimeout(() => note.remove(), noteAwayMs)
  }, noteStayMs)
}

function shakeLcd(root: ShadowRoot) {
  const lcd = root.querySelector<HTMLElement>('.acw-lcd')!
  lcd.removeAttribute('data-alert')
  // 重新触发动画
  void lcd.offsetWidth
  lcd.setAttribute('data-alert', '')
  setTimeout(() => lcd.removeAttribute('data-alert'), 400)
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
    private stopObservers: (() => void)[] = []
    private audio?: AcAudioController
    private present = createAcNotificationPresenter()
    private placement?: WidgetAcPlacement

    static get observedAttributes() {
      return ['mode', 'status', 'temperature', 'sound', 'swing', 'fan', 'placement']
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
            presentNotification(this.shadowRoot, notification, this.present(notification, event.state), event.state)
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
      this.shadowRoot?.addEventListener('keydown', this.onKeyDown)
      this.shadowRoot?.addEventListener('animationiteration', this.onDrip)
      this.updatePlacement()
      this.renderedState = undefined
      this.render()

      // 窄容器下机身等比缩小，保持长款比例；精细指针下轻微 3D 倾斜
      this.stopObservers.forEach(stop => stop())
      this.stopObservers = []
      const unit = this.shadowRoot?.querySelector<HTMLElement>('.acw-unit')
      if (unit) {
        this.stopObservers.push(
          observeAcScale(unit, acShellSize.compact.width, (scale) => {
            unit.style.setProperty('--acw-scale', String(scale))
          }),
          observeAcTilt(unit, (x, y) => {
            unit.style.setProperty('--acw-tilt-x', `${x}deg`)
            unit.style.setProperty('--acw-tilt-y', `${y}deg`)
          }),
        )
      }

      // 温度键：长按连续调温，到上下限就停
      const value = () => this.store?.getState().temperature
      for (const button of this.shadowRoot?.querySelectorAll<HTMLElement>('[data-repeat]') ?? []) {
        const type = button.dataset.repeat === 'increment' ? 'increment' : 'decrement'
        this.stopObservers.push(bindAcPressRepeat(button, () => this.store?.dispatch({ type }), { value }))
      }
    }

    disconnectedCallback() {
      this.unsubscribe?.()
      this.audio?.dispose()
      this.audio = undefined
      this.stopObservers.forEach(stop => stop())
      this.stopObservers = []
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

    private onClick = (event: Event) => {
      if ((event.target as Element | null)?.closest('.acw-remote-toggle')) {
        const panel = this.shadowRoot?.querySelector<HTMLElement>('.acw-remote-panel')
        if (panel)
          this.setRemoteOpen(Boolean(panel.hidden))
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
      if (!this.shadowRoot)
        return
      const value = this.getAttribute('placement') ?? options.placement
      const placement = value === 'top-left' || value === 'top-right' ? value : 'inline'
      const wasFloating = this.placement && this.placement !== 'inline'
      this.placement = placement
      this.dataset.acPlacement = placement
      const toggle = this.shadowRoot.querySelector<HTMLButtonElement>('.acw-remote-toggle')!
      const focusRemote = placement === 'inline' && this.shadowRoot.activeElement === toggle
      toggle.hidden = placement === 'inline'
      // Switching sides retains the disclosure state; entering floating mode starts compact.
      if (placement === 'inline' || !wasFloating)
        this.setRemoteOpen(placement === 'inline')
      // Browsers cannot focus a control while its panel is still hidden.
      if (focusRemote)
        this.shadowRoot.querySelector<HTMLButtonElement>('.acw-button-power')?.focus()
    }

    private setRemoteOpen(open: boolean) {
      const panel = this.shadowRoot?.querySelector<HTMLElement>('.acw-remote-panel')
      const toggle = this.shadowRoot?.querySelector<HTMLButtonElement>('.acw-remote-toggle')
      if (!panel || !toggle)
        return
      if (!open && this.shadowRoot?.activeElement && panel.contains(this.shadowRoot.activeElement))
        toggle.focus()
      panel.hidden = !open
      toggle.setAttribute('aria-expanded', String(open))
      toggle.textContent = open ? '收起遥控器' : '打开遥控器'
    }

    private onKeyDown = (event: Event) => {
      const keyboardEvent = event as KeyboardEvent
      if (keyboardEvent.key !== 'Escape' || this.placement === 'inline')
        return
      const panel = this.shadowRoot?.querySelector<HTMLElement>('.acw-remote-panel')
      if (!panel || panel.hidden)
        return
      keyboardEvent.preventDefault()
      keyboardEvent.stopPropagation()
      this.setRemoteOpen(false)
      this.shadowRoot?.querySelector<HTMLButtonElement>('.acw-remote-toggle')?.focus()
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
      }, { soundMode: event.state.sound, fanSpeed: event.state.fan ?? 'auto' })
      if (event.previousState.sound !== event.state.sound)
        this.audio.setSoundMode(event.state.sound)
      if (event.previousState.fan !== event.state.fan)
        this.audio.setFanSpeed(event.state.fan ?? 'auto')
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

  if (targetElement.localName === tagName) {
    if (options.placement)
      targetElement.setAttribute('placement', options.placement)
    return targetElement
  }

  const element = document.createElement(tagName)
  if (options.storageKey)
    element.setAttribute('storage-key', options.storageKey)
  if (options.title)
    element.setAttribute('title', options.title)
  if (options.placement)
    element.setAttribute('placement', options.placement)

  targetElement.appendChild(element)
  return element
}
