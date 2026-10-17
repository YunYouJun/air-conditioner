import type { AcForm } from '@yunlefun-home/air-conditioner-core'
import type { AcScene, AcSceneState } from './scene'
import { acModelFiles, prefersReducedMotion } from '@yunlefun-home/air-conditioner-core'
import React, { useEffect, useRef } from 'react'
import { peekAudioController } from '~/components/RemoteControl/audio'
import { getAssetsUrl } from '~/utils'
import { createAcScene } from './scene'

export interface Ac3DViewProps {
  state: AcSceneState
  form: AcForm
  /** 一开始侧转的角度（弧度），从平面版「转过来」时用 */
  initialYaw?: number
  /** 要转到的角度（弧度）；变化时带缓动地转过去 */
  turn?: number
  /** 第一个模型显示出来 */
  onReady?: () => void
  /** 已经回正时再双击：变回平面版 */
  onFlatten?: () => void
  /** WebGL 不可用或模型加载失败 */
  onError: (error: unknown) => void
}

/**
 * 3D 空调（#184）：和原生版共用同一个 Blender 模型（GLB），按需加载 Three.js。
 */
const Ac3DView: React.FC<Ac3DViewProps> = (props) => {
  const { state, form, turn } = props
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<AcScene>(undefined)
  // 回调和初始角度只在创建场景时读取；之后的变化通过 ref 拿到最新值
  const latest = useRef(props)
  latest.current = props

  useEffect(() => {
    let scene: AcScene
    try {
      scene = createAcScene(canvasRef.current!, {
        modelUrl: form => getAssetsUrl(`/models/${acModelFiles[form]}`),
        onDrip: () => peekAudioController()?.drip(),
        onError: error => latest.current.onError(error),
        onReady: () => latest.current.onReady?.(),
        onFlatten: () => latest.current.onFlatten?.(),
        initialYaw: latest.current.initialYaw,
        reducedMotion: prefersReducedMotion(),
      })
    }
    catch (error) {
      latest.current.onError(error)
      return
    }
    sceneRef.current = scene
    return () => {
      scene.dispose()
      sceneRef.current = undefined
    }
  }, [])

  const { status, mode, temperature, swing, fan } = state
  useEffect(() => {
    sceneRef.current?.update({ status, mode, temperature, swing, fan })
  }, [status, mode, temperature, swing, fan])

  useEffect(() => {
    sceneRef.current?.setForm(form)
  }, [form])

  useEffect(() => {
    if (turn !== undefined)
      sceneRef.current?.turnTo(turn)
  }, [turn])

  return <canvas ref={canvasRef} className="ac-3d__canvas" data-form={form} />
}

export default Ac3DView
