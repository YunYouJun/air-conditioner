import { mountAirConditioner } from './index'

// This entry is a classic script: capture its URL before waiting for the DOM.
const script = document.currentScript as HTMLScriptElement | null
if (script?.src) {
  const assetsBaseUrl = new URL('./assets', script.src).href
  const placement = script.dataset.placement === 'top-left' ? 'top-left' : 'top-right'
  const enableAudio = script.dataset.audio === 'true'
  const storageKey = script.dataset.storageKey || 'ac:embed'
  const mount = () => {
    // Blog themes may execute their scripts again after SPA navigation.
    if (document.querySelector('air-conditioner-embed'))
      return
    mountAirConditioner(document.body, {
      tagName: 'air-conditioner-embed',
      placement,
      assetsBaseUrl,
      logoUrl: new URL('./yun-logo.svg', script.src).href,
      enableAudio,
      storageKey,
    })
  }
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', mount, { once: true })
  else
    mount()
}
