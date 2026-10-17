import { useCallback, useEffect, useState } from 'react'

interface DocumentPictureInPicture {
  requestWindow: (options?: { width?: number, height?: number }) => Promise<Window>
  window: Window | null
}

function getPictureInPicture(): DocumentPictureInPicture | undefined {
  return (window as Window & { documentPictureInPicture?: DocumentPictureInPicture }).documentPictureInPicture
}

/** 悬浮窗大小：刚好放下遥控器 */
const size = { width: 260, height: 500 }

/**
 * 把页面的样式带进悬浮窗：同源样式表复制规则，其余（字体等外链）复制 <link>。
 */
function copyStyles(target: Window) {
  for (const sheet of [...document.styleSheets]) {
    try {
      const style = target.document.createElement('style')
      style.textContent = [...sheet.cssRules].map(rule => rule.cssText).join('\n')
      target.document.head.append(style)
    }
    catch {
      if (sheet.href) {
        const link = target.document.createElement('link')
        link.rel = 'stylesheet'
        link.href = sheet.href
        target.document.head.append(link)
      }
    }
  }
  target.document.documentElement.className = document.documentElement.className
  target.document.title = '云空调遥控器'
  target.document.body.classList.add('ac-pip')
}

/**
 * 「遥控器悬浮窗」：支持 Document Picture-in-Picture 的浏览器（Chrome / Edge 116+）
 * 把遥控器放进一个始终置顶的小窗，切到别的应用也能随手调温；悬浮窗和页面共用
 * 同一份状态。不支持的浏览器打开原来的独立遥控器弹窗（`/rc`，靠 localStorage 同步）。
 */
export function useFloatingRemote() {
  const [pip, setPip] = useState<Window | null>(null)
  const supported = typeof window !== 'undefined' && !!getPictureInPicture()

  const close = useCallback(() => {
    pip?.close()
    setPip(null)
  }, [pip])

  const open = useCallback(async () => {
    const popup = () => window.open(`${import.meta.env.BASE_URL}rc`, '_blank', `width=${size.width + 40}, height=${size.height + 20}`)
    const api = getPictureInPicture()
    if (!api) {
      popup()
      return
    }
    let target: Window
    try {
      target = await api.requestWindow(size)
    }
    catch {
      // 有的环境暴露了 API 却开不了窗（如嵌入式浏览器），退回弹出窗口
      popup()
      return
    }
    copyStyles(target)
    // 关掉悬浮窗（或页面离开）时，遥控器回到挂座上
    target.addEventListener('pagehide', () => setPip(null), { once: true })
    setPip(target)
  }, [])

  // 暗色模式切换时，悬浮窗跟着变
  useEffect(() => {
    if (!pip)
      return
    const observer = new MutationObserver(() => {
      pip.document.documentElement.className = document.documentElement.className
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [pip])

  return { supported, window: pip, open, close }
}
