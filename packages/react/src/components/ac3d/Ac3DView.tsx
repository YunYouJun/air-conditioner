import type { AcForm } from '@yunlefun-home/air-conditioner-core'
import type { AcScene, AcSceneState } from './scene'
import { acModelFiles } from '@yunlefun-home/air-conditioner-core'
import React, { useEffect, useRef } from 'react'
import { peekAudioController } from '~/components/RemoteControl/audio'
import { getAssetsUrl } from '~/utils'
import { createAcScene } from './scene'

export interface Ac3DViewProps {
  state: AcSceneState
  form: AcForm
  /** WebGL 不可用或模型加载失败 */
  onError: (error: unknown) => void
}

/**
 * 3D 空调（#184）：和原生版共用同一个 Blender 模型（GLB），按需加载 Three.js。
 */
const Ac3DView: React.FC<Ac3DViewProps> = ({ state, form, onError }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<AcScene>(undefined)
  const onErrorRef = useRef(onError)
  onErrorRef.current = onError

  useEffect(() => {
    let scene: AcScene
    try {
      scene = createAcScene(canvasRef.current!, {
        modelUrl: form => getAssetsUrl(`/models/${acModelFiles[form]}`),
        onDrip: () => peekAudioController()?.drip(),
        onError: error => onErrorRef.current(error),
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      })
    }
    catch (error) {
      onErrorRef.current(error)
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

  return <canvas ref={canvasRef} className="ac-3d__canvas" data-form={form} />
}

export default Ac3DView
