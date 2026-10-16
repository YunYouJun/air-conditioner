import type {
  AcMode,
  AcNotification,
  AcState,
  AirConditionerStore,
} from '@yunlefun-home/air-conditioner-core'
import { createAirConditionerStore, defaultAcState, renderAcMotionCssVars } from '@yunlefun-home/air-conditioner-core'

export type WidgetAcMode = 'cold' | 'hot'

export interface WidgetAcState {
  status: boolean
  mode: WidgetAcMode
  temperature: number
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
  title?: string
  initialState?: Partial<WidgetAcState>
  storage?: WidgetAcStorage | null
  storageKey?: string
  onNotify?: (notification: WidgetAcNotification, event: WidgetAcChangeEvent) => void
}

export interface MountAirConditionerOptions extends DefineAirConditionerElementOptions {}

const defaultTagName = 'air-conditioner-widget'

const styleText = `
:host {
  display: inline-block;
  color: #1f2933;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

*, *::before, *::after {
  box-sizing: border-box;
}

.acw-root {
  display: grid;
  gap: 16px;
  justify-items: center;
  width: min(420px, 100%);
}

.acw-unit {
  width: min(100%, 360px);
}

.acw-shell {
  position: relative;
  height: 152px;
  border: 1px solid #d9dee7;
  border-bottom-right-radius: 20px;
  border-bottom-left-radius: 20px;
  background: #fff;
  box-shadow: 0 16px 32px rgba(15, 23, 42, 0.12);
}

.acw-badge {
  position: absolute;
  top: 14px;
  left: 14px;
  display: grid;
  grid-template-columns: repeat(3, 4px);
  gap: 4px;
  padding: 12px;
  border-radius: 3px;
  background: #4ea5f5;
}

.acw-badge span {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #fff;
}

.acw-display {
  position: absolute;
  top: 28px;
  right: 28px;
  color: #9aa3ad;
  text-align: right;
  opacity: 0.45;
  transition: opacity var(--acw-motion-duration-base) var(--acw-motion-ease-exit);
}

.acw-unit[data-status="on"] .acw-display {
  opacity: 1;
  transition-timing-function: var(--acw-motion-ease-enter);
}

.acw-display strong {
  display: inline-block;
  min-width: 48px;
  font-size: 42px;
  line-height: 1;
}

.acw-display small {
  font-size: 18px;
}

/* 温度切换：升温从下方滚入、降温从上方滚入 */
.acw-display strong[data-dir="up"] {
  animation: acw-digit-up var(--acw-motion-duration-base) var(--acw-motion-ease-enter) both;
}

.acw-display strong[data-dir="down"] {
  animation: acw-digit-down var(--acw-motion-duration-base) var(--acw-motion-ease-enter) both;
}

.acw-mode {
  display: block;
  margin-bottom: 3px;
  font-size: 12px;
  text-transform: uppercase;
}

/* 模式切换：文字从上方轻轻落下 */
.acw-mode[data-animate] {
  animation: acw-digit-down var(--acw-motion-duration-base) var(--acw-motion-ease-spring) both;
}

@keyframes acw-digit-up {
  from {
    opacity: 0;
    transform: translateY(40%);
  }
}

@keyframes acw-digit-down {
  from {
    opacity: 0;
    transform: translateY(-40%);
  }
}

.acw-logo {
  position: absolute;
  right: 0;
  bottom: 22px;
  left: 0;
  color: #8b95a1;
  font-size: 12px;
  text-align: center;
}

/* 出风口：开机时缝隙变暗、导风板向外翻开；关机时等出风淡出后再合上 */
.acw-vent {
  position: absolute;
  right: 28px;
  bottom: 13px;
  left: 28px;
  height: 5px;
  border-radius: 0 0 4px 4px;
  background: linear-gradient(to bottom, rgba(15, 23, 42, 0.16), rgba(15, 23, 42, 0.03));
  opacity: 0;
  transition: opacity var(--acw-motion-duration-slow) var(--acw-motion-ease-standard) var(--acw-motion-duration-base);
}

.acw-louver {
  position: absolute;
  right: 28px;
  bottom: 6px;
  left: 28px;
  height: 10px;
  border-radius: 0 0 10px 10px;
  background: #fff;
  transform-origin: 50% 0;
  transition: transform var(--acw-motion-duration-slow) var(--acw-motion-ease-standard) var(--acw-motion-duration-base);
}

.acw-louver::before {
  content: "";
  position: absolute;
  inset: 0;
  border: 1px solid #d9dee7;
  border-top: 0;
  border-radius: inherit;
  background: linear-gradient(to bottom, rgba(15, 23, 42, 0.06), transparent);
  opacity: 0;
  transition: opacity var(--acw-motion-duration-slow) var(--acw-motion-ease-standard) var(--acw-motion-duration-base);
}

.acw-unit[data-status="on"] .acw-vent,
.acw-unit[data-status="on"] .acw-louver,
.acw-unit[data-status="on"] .acw-louver::before {
  transition-delay: 0ms;
}

.acw-unit[data-status="on"] .acw-vent,
.acw-unit[data-status="on"] .acw-louver::before {
  opacity: 1;
}

.acw-unit[data-status="on"] .acw-louver {
  transform: translateY(4px) perspective(80px) rotateX(-38deg);
}

/* 状态指示灯：光晕放在伪元素上，只过渡 opacity / transform */
.acw-led {
  position: absolute;
  right: 14px;
  bottom: 20px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #d9dee7;
}

.acw-led::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: #38f709;
  box-shadow: 0 0 10px rgba(56, 247, 9, 0.72);
  opacity: 0;
  transform: scale(0.4);
  transition:
    opacity var(--acw-motion-duration-fast) var(--acw-motion-ease-standard),
    transform var(--acw-motion-duration-fast) var(--acw-motion-ease-spring);
}

.acw-unit[data-status="on"] .acw-led::after {
  opacity: 1;
  transform: none;
}

/* 开机：导风板打开后出风再淡入；关机：出风先淡出 */
.acw-wind {
  display: flex;
  justify-content: center;
  gap: 58px;
  height: 56px;
  margin-top: 14px;
  opacity: 0;
  transition: opacity var(--acw-motion-duration-base) var(--acw-motion-ease-exit);
}

.acw-unit[data-status="on"] .acw-wind {
  opacity: 1;
  transition: opacity var(--acw-motion-duration-slow) var(--acw-motion-ease-enter) var(--acw-motion-duration-base);
}

.acw-wind span {
  position: relative;
  overflow: hidden;
  width: 5px;
  height: 44px;
  border-radius: 999px;
  background: rgba(174, 183, 193, 0.3);
}

/* 气流：冷 / 暖两层渐变条沿出风线向下流动，切换模式时交叉淡化 */
.acw-wind span::before,
.acw-wind span::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 60%;
  border-radius: inherit;
  background: linear-gradient(to bottom, transparent, #8cc4f2, transparent);
  transform: translateY(-110%);
  transition: opacity var(--acw-motion-duration-base) var(--acw-motion-ease-standard);
  animation: acw-wind-flow var(--acw-motion-duration-flow) cubic-bezier(0.45, 0, 0.55, 1) var(--acw-wind-delay, 0ms) infinite;
  /* 关机时暂停，静止状态不跑循环 */
  animation-play-state: paused;
}

.acw-wind span::after {
  background: linear-gradient(to bottom, transparent, #f6ad7b, transparent);
  opacity: 0;
}

.acw-unit[data-mode="hot"] .acw-wind span::before {
  opacity: 0;
}

.acw-unit[data-mode="hot"] .acw-wind span::after {
  opacity: 1;
}

.acw-unit[data-status="on"] .acw-wind span::before,
.acw-unit[data-status="on"] .acw-wind span::after {
  animation-play-state: running;
}

.acw-wind span:first-child {
  --acw-wind-delay: -600ms;
  transform: rotate(10deg);
}

.acw-wind span:last-child {
  --acw-wind-delay: -1200ms;
  transform: rotate(-10deg);
}

@keyframes acw-wind-flow {
  from {
    transform: translateY(-110%);
  }

  to {
    transform: translateY(180%);
  }
}

.acw-remote {
  display: grid;
  gap: 10px;
  justify-items: center;
}

.acw-remote-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.acw-button {
  position: relative;
  min-width: 54px;
  min-height: 44px;
  border: 0;
  border-radius: 7px;
  background: #edf2f7;
  color: #1f2933;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  /* 松开：带一点回弹 */
  transition: transform var(--acw-motion-duration-fast) var(--acw-motion-ease-spring);
}

/* 悬停 / 按下的明暗变化放在遮罩层上，只过渡 opacity */
.acw-button::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: currentColor;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--acw-motion-duration-fast) var(--acw-motion-ease-standard);
}

.acw-button:hover::after {
  opacity: 0.08;
}

.acw-button:active {
  transform: scale(0.92);
  transition-duration: var(--acw-motion-duration-instant);
  transition-timing-function: var(--acw-motion-ease-standard);
}

.acw-button:active::after {
  opacity: 0.16;
  transition-duration: var(--acw-motion-duration-instant);
}

.acw-button:focus-visible {
  outline: 2px solid #1976d2;
  outline-offset: 3px;
}

.acw-button-cold {
  background: #1976d2;
  color: #fff;
}

.acw-button-hot {
  background: #f59e0b;
  color: #fff;
}

.acw-button-power {
  background: #16a34a;
  color: #fff;
}

.acw-button-temp {
  width: 54px;
  border-radius: 50%;
  font-size: 22px;
}

.acw-notification-region {
  width: 100%;
}

/* 常驻的 live region 为空时不占用网格间距 */
.acw-notification-region:empty {
  margin-top: -16px;
}

.acw-notification {
  width: 100%;
  min-height: 38px;
  padding: 10px 12px;
  border-radius: 6px;
  background: #edf8f0;
  color: #155724;
  font-size: 13px;
  animation: acw-notify-in var(--acw-motion-duration-base) var(--acw-motion-ease-enter) both;
}

@keyframes acw-notify-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
}

.acw-notification[data-severity="error"] {
  background: #fdecec;
  color: #8a1f17;
}

/* 减少动效：时长已由 token 缩短；这里关掉循环与位移类动画，只保留短促的淡入淡出 */
@media (prefers-reduced-motion: reduce) {
  .acw-wind span::before,
  .acw-wind span::after {
    height: 100%;
    transform: none;
    animation: none;
  }

  .acw-display strong[data-dir],
  .acw-mode[data-animate] {
    animation: none;
  }

  .acw-unit[data-status="on"] .acw-louver {
    transform: translateY(2px);
  }

  .acw-button:active {
    transform: none;
  }

  .acw-notification {
    animation-name: acw-fade-in;
  }
}

@keyframes acw-fade-in {
  from {
    opacity: 0;
  }
}
`

function boolAttribute(value: string | null, fallback: boolean): boolean {
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

function getInitialState(element: HTMLElement, defaults?: Partial<AcState>): Partial<AcState> {
  const state: Partial<AcState> = {
    ...defaults,
    mode: modeAttribute(element.getAttribute('mode')) ?? defaults?.mode,
    status: boolAttribute(element.getAttribute('status'), defaults?.status ?? defaultAcState.status),
    temperature: numberAttribute(element.getAttribute('temperature')) ?? defaults?.temperature,
  }
  // 未指定的字段不能以 undefined 覆盖持久化 / 默认状态（否则 mode 会变成 undefined）
  for (const key of Object.keys(state) as (keyof AcState)[]) {
    if (state[key] === undefined)
      delete state[key]
  }
  return state
}

/**
 * 只在挂载时写入一次的骨架；之后的状态变化通过 `updateWidget` 增量更新，
 * 这样 CSS 过渡才能播放，按钮的键盘焦点也不会因整块重建而丢失。
 */
const widgetTemplate = `
  <style>${styleText}
${renderAcMotionCssVars(':host')}
  </style>
  <div class="acw-root">
    <div class="acw-unit">
      <div class="acw-shell">
        <div class="acw-badge" aria-hidden="true"><span></span><span></span><span></span></div>
        <div class="acw-display" aria-live="polite">
          <span class="acw-mode"></span>
          <strong></strong><small>°C</small>
        </div>
        <div class="acw-logo"></div>
        <div class="acw-vent" aria-hidden="true"></div>
        <div class="acw-louver" aria-hidden="true"></div>
        <span class="acw-led"></span>
      </div>
      <div class="acw-wind">
        <span></span><span></span><span></span>
      </div>
    </div>
    <div class="acw-remote" role="group" aria-label="Air conditioner remote control">
      <div class="acw-remote-row">
        <button type="button" class="acw-button acw-button-cold" aria-label="cold" data-action="cold">Cold</button>
        <button type="button" class="acw-button acw-button-power" aria-label="power" data-action="toggleStatus">Power</button>
        <button type="button" class="acw-button acw-button-hot" aria-label="hot" data-action="hot">Hot</button>
      </div>
      <button type="button" class="acw-button acw-button-temp" aria-label="add" data-action="increment">+</button>
      <button type="button" class="acw-button acw-button-temp" aria-label="reduce" data-action="decrement">-</button>
    </div>
    <div class="acw-notification-region" role="status"></div>
  </div>
`

/**
 * 用新节点替换旧节点，以便重新播放进入动画。
 */
function replaceAnimated<K extends keyof HTMLElementTagNameMap>(current: Element, tagName: K, className: string, text: string, attribute?: [string, string]) {
  const next = document.createElement(tagName)
  if (className)
    next.className = className
  next.textContent = text
  if (attribute)
    next.setAttribute(...attribute)
  current.replaceWith(next)
}

function updateWidget(root: ShadowRoot, state: AcState, previous: AcState | undefined, title: string) {
  const unit = root.querySelector<HTMLElement>('.acw-unit')!
  unit.dataset.mode = state.mode
  unit.dataset.status = state.status ? 'on' : 'off'

  const mode = root.querySelector('.acw-mode')!
  if (!previous)
    mode.textContent = state.mode
  else if (previous.mode !== state.mode)
    replaceAnimated(mode, 'span', 'acw-mode', state.mode, ['data-animate', ''])

  const temperature = root.querySelector('.acw-display strong')!
  if (!previous)
    temperature.textContent = String(state.temperature)
  else if (previous.temperature !== state.temperature)
    replaceAnimated(temperature, 'strong', '', String(state.temperature), ['data-dir', state.temperature > previous.temperature ? 'up' : 'down'])

  root.querySelector('.acw-logo')!.textContent = title
  root.querySelector('.acw-led')!.setAttribute('aria-label', state.status ? 'on' : 'off')
  root.querySelector('.acw-wind')!.setAttribute('aria-hidden', state.status ? 'false' : 'true')
}

function showNotification(root: ShadowRoot, notification: AcNotification) {
  const region = root.querySelector('.acw-notification-region')!
  const element = document.createElement('div')
  element.className = 'acw-notification'
  element.dataset.severity = notification.severity
  element.textContent = notification.message
  region.replaceChildren(element)
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

    static get observedAttributes() {
      return ['mode', 'status', 'temperature']
    }

    connectedCallback() {
      if (!this.shadowRoot) {
        this.attachShadow({ mode: 'open' }).innerHTML = widgetTemplate
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
        this.dispatchEvent(new CustomEvent<WidgetAcChangeEvent>('ac-change', {
          detail: event,
          bubbles: true,
          composed: true,
        }))
      })
      this.shadowRoot?.addEventListener('click', this.onClick)
      this.renderedState = undefined
      this.render()
    }

    disconnectedCallback() {
      this.unsubscribe?.()
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
      const target = event.target as HTMLElement | null
      const action = target?.dataset.action
      if (!action || !this.store)
        return

      if (action === 'cold' || action === 'hot')
        this.store.dispatch({ type: 'mode', mode: action })
      else if (action === 'toggleStatus')
        this.store.dispatch({ type: 'toggleStatus' })
      else if (action === 'increment' || action === 'decrement')
        this.store.dispatch({ type: action })
    }

    private render() {
      const state = this.store?.getState() ?? defaultAcState
      const title = this.getAttribute('title') ?? options.title ?? 'Yun AC'
      if (this.shadowRoot)
        updateWidget(this.shadowRoot, state, this.renderedState, title)
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
