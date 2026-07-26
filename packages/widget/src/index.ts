import type {
  AcMode,
  AcNotification,
  AcState,
  AirConditionerStore,
} from '@yunlefun-home/air-conditioner-core'
import { createAirConditionerStore, defaultAcState } from '@yunlefun-home/air-conditioner-core'

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

.acw-mode {
  display: block;
  margin-bottom: 3px;
  font-size: 12px;
  text-transform: uppercase;
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

.acw-led {
  position: absolute;
  right: 14px;
  bottom: 20px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #d9dee7;
}

.acw-unit[data-status="on"] .acw-led {
  background: #38f709;
  box-shadow: 0 0 10px rgba(56, 247, 9, 0.72);
}

.acw-wind {
  display: flex;
  justify-content: center;
  gap: 58px;
  height: 56px;
  margin-top: 14px;
  opacity: 0;
  transition: opacity 180ms ease;
}

.acw-unit[data-status="on"] .acw-wind {
  opacity: 0.35;
}

.acw-wind span {
  width: 5px;
  height: 44px;
  border-radius: 999px;
  background: #aeb7c1;
}

.acw-wind span:first-child {
  transform: rotate(10deg);
}

.acw-wind span:last-child {
  transform: rotate(-10deg);
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
  min-width: 54px;
  min-height: 44px;
  border: 0;
  border-radius: 7px;
  background: #edf2f7;
  color: #1f2933;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}

.acw-button:hover {
  background: #e1e8ef;
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

.acw-notification {
  width: 100%;
  min-height: 38px;
  padding: 10px 12px;
  border-radius: 6px;
  background: #edf8f0;
  color: #155724;
  font-size: 13px;
}

.acw-notification[data-severity="error"] {
  background: #fdecec;
  color: #8a1f17;
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
  return {
    ...defaults,
    mode: modeAttribute(element.getAttribute('mode')) ?? defaults?.mode,
    status: boolAttribute(element.getAttribute('status'), defaults?.status ?? defaultAcState.status),
    temperature: numberAttribute(element.getAttribute('temperature')) ?? defaults?.temperature,
  }
}

function renderWidget(state: AcState, notification: AcNotification | undefined, title: string): string {
  return `
    <style>${styleText}</style>
    <div class="acw-root">
      <div class="acw-unit" data-mode="${state.mode}" data-status="${state.status ? 'on' : 'off'}">
        <div class="acw-shell">
          <div class="acw-badge" aria-hidden="true"><span></span><span></span><span></span></div>
          <div class="acw-display" aria-live="polite">
            <span class="acw-mode">${state.mode}</span>
            <strong>${state.temperature}</strong><small>°C</small>
          </div>
          <div class="acw-logo">${title}</div>
          <span class="acw-led" aria-label="${state.status ? 'on' : 'off'}"></span>
        </div>
        <div class="acw-wind" aria-hidden="${state.status ? 'false' : 'true'}">
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
      ${notification ? `<div class="acw-notification" data-severity="${notification.severity}" role="status">${notification.message}</div>` : ''}
    </div>
  `
}

export function defineAirConditionerElement(options: DefineAirConditionerElementOptions = {}): CustomElementConstructor {
  const tagName = options.tagName ?? defaultTagName
  const existing = customElements.get(tagName)
  if (existing)
    return existing

  class AirConditionerWidgetElement extends HTMLElement {
    private store?: AirConditionerStore
    private unsubscribe?: () => void
    private notification?: AcNotification

    static get observedAttributes() {
      return ['mode', 'status', 'temperature']
    }

    connectedCallback() {
      if (!this.shadowRoot)
        this.attachShadow({ mode: 'open' })

      this.store = createAirConditionerStore({
        ...options,
        storageKey: this.getAttribute('storage-key') ?? options.storageKey,
        initialState: getInitialState(this, options.initialState),
        onNotify: (notification, event) => {
          this.notification = notification
          this.render()
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
        this.shadowRoot.innerHTML = renderWidget(state, this.notification, title)
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
