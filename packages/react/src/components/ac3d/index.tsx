import type { ErrorInfo, PropsWithChildren, ReactNode } from 'react'
import type { Ac3DViewProps } from './Ac3DView'
import React, { Component, lazy, Suspense, useState } from 'react'
import './Ac3D.scss'

// Three.js 只在打开 3D 模式时才下载
const Ac3DView = lazy(() => import('./Ac3DView'))

/** 浏览器是否能创建 WebGL 上下文 */
export function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  }
  catch {
    return false
  }
}

/** 脚本下载失败（例如离线）时退回 CSS 版 */
class LoadBoundary extends Component<PropsWithChildren<{ onError: (error: unknown) => void }>, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown, _info: ErrorInfo) {
    this.props.onError(error)
  }

  render(): ReactNode {
    return this.state.failed ? null : this.props.children
  }
}

const Ac3D: React.FC<Ac3DViewProps> = (props) => {
  // 容器尺寸跟着「已经换上的」机型走：新模型下载期间不先变形，换上后再把高度过渡过去
  const [shownForm, setShownForm] = useState(props.form)

  return (
    <div className="ac-3d" data-form={shownForm}>
      <LoadBoundary onError={props.onError}>
        <Suspense fallback={<div className="ac-3d__loading">正在搬空调…</div>}>
          <Ac3DView
            {...props}
            onForm={(form) => {
              setShownForm(form)
              props.onForm?.(form)
            }}
          />
        </Suspense>
      </LoadBoundary>
    </div>
  )
}

export default Ac3D
