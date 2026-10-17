import type { AcForm } from '@yunlefun-home/air-conditioner-core'
import type { CSSProperties, PointerEvent, ReactNode } from 'react'
import type { AcSceneState } from './ac3d/scene'
import React, { useEffect, useRef, useState } from 'react'
import Ac3D from './ac3d'
import './AcStage.scss'

export type AcView = '2d' | '3d'

/** 平面版转出 / 转入的角度（度）；3D 模型从同一个角度转回正面，两者正好接上 */
export const acTurnAngle = 32
const acTurnYaw = acTurnAngle * Math.PI / 180
/** 横向拖动平面版：每像素转多少度、转过多少度就「咔」地立起来 */
const dragDegreesPerPixel = 0.12
export const acSnapAngle = 24
/** 转身动画时长（ms），与 AcStage.scss 一致 */
const turnMs = 420

type Phase
  = | { name: 'idle' }
    | { name: 'to3d', ready: boolean }
    | { name: 'to2d' }

export interface AcStageProps {
  /** 想要显示的视图（来自开关或本地记录） */
  view: AcView
  onViewChange: (view: AcView) => void
  /** 3D 是否可用（支持 WebGL 且没有加载失败） */
  can3D: boolean
  state: AcSceneState
  form: AcForm
  /** 3D 加载失败 */
  onFail: () => void
  /** 拖动平面版「咔」地立起来的那一下（播放按键音） */
  onSnap?: () => void
  /** 平面版空调 */
  children: ReactNode
}

/**
 * 空调的舞台：平面版和 3D 版之间不是直接替换，而是「把空调转过来」——
 * 平面机身绕竖轴转开、淡出，3D 模型从同一个角度出现再转回正面；切回平面时反过来。
 *
 * 彩蛋：在平面机身上横向拖动，转过 {@link acSnapAngle}° 就「咔」地立成 3D；
 * 在 3D 里回正后再双击，又变回平面。
 */
const AcStage: React.FC<AcStageProps> = (props) => {
  const { view, can3D, onViewChange } = props
  const want: AcView = view === '3d' && can3D ? '3d' : '2d'
  const [shown, setShown] = useState<AcView>(want)
  const [phase, setPhase] = useState<Phase>({ name: 'idle' })
  /** 转动方向：按钮切换时向右，拖动时跟着拖动方向 */
  const [sign, setSign] = useState<1 | -1>(1)
  const flatRef = useRef<HTMLDivElement>(null)
  /** 拖动「咔」地立起来时的方向，开始转身时读取一次 */
  const snapSign = useRef<1 | -1>(undefined)

  // 想要的视图变了：开始转身。按钮切换时向右转，拖动时跟着拖动方向
  useEffect(() => {
    if (phase.name === 'idle' && want !== shown) {
      setSign(want === '3d' ? snapSign.current ?? 1 : 1)
      snapSign.current = undefined
      setPhase(want === '3d' ? { name: 'to3d', ready: false } : { name: 'to2d' })
    }
    // 3D 还没加载好就被切回平面：直接取消
    else if (phase.name === 'to3d' && !phase.ready && want === '2d') {
      setPhase({ name: 'idle' })
    }
  }, [want, shown, phase])

  // 转身播完再换成目标视图
  useEffect(() => {
    if (phase.name === 'to2d' || (phase.name === 'to3d' && phase.ready)) {
      const timer = setTimeout(() => {
        setShown(phase.name === 'to2d' ? '2d' : '3d')
        setPhase({ name: 'idle' })
      }, turnMs)
      return () => clearTimeout(timer)
    }
  }, [phase])

  // 3D 加载失败：留在平面版
  function fail() {
    setPhase({ name: 'idle' })
    setShown('2d')
    props.onFail()
  }

  // ----------------------------------------------------- 拖动平面版的彩蛋
  const drag = useRef<{ x: number, moved: boolean, snapped: boolean }>(undefined)

  function setTurn(degrees: number) {
    flatRef.current?.style.setProperty('--ac-turn', `${degrees}deg`)
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (shown !== '2d' || phase.name !== 'idle' || event.button !== 0)
      return
    drag.current = { x: event.clientX, moved: false, snapped: false }
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current
    if (!current || current.snapped)
      return
    const dx = event.clientX - current.x
    if (!current.moved) {
      // 小于 6px 当作点击（例如点 Logo 链接）
      if (Math.abs(dx) < 6)
        return
      current.moved = true
      event.currentTarget.setPointerCapture(event.pointerId)
      event.currentTarget.dataset.dragging = ''
    }
    // 不支持 3D 时只能拧一点点，像拧不动一样
    const limit = can3D ? 40 : 10
    const degrees = Math.max(-limit, Math.min(limit, dx * dragDegreesPerPixel))
    setTurn(degrees)
    if (can3D && Math.abs(degrees) >= acSnapAngle) {
      current.snapped = true
      delete event.currentTarget.dataset.dragging
      snapSign.current = degrees > 0 ? 1 : -1
      props.onSnap?.()
      onViewChange('3d')
    }
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current
    if (!current)
      return
    delete event.currentTarget.dataset.dragging
    // 没转够就弹回正面
    if (!current.snapped)
      setTurn(0)
    // 拖动过就别再触发点击（例如 Logo 链接）
    if (current.moved)
      event.currentTarget.addEventListener('click', stopClick, { capture: true, once: true })
    drag.current = undefined
  }

  const showFlat = shown === '2d' || phase.name === 'to2d'
  const showSolid = shown === '3d' || phase.name === 'to3d'
  const flatTurn = phase.name === 'to3d' ? (phase.ready ? 'out' : 'hold') : phase.name === 'to2d' ? 'in' : undefined
  const solidTurn = phase.name === 'to3d' ? (phase.ready ? 'in' : 'pending') : phase.name === 'to2d' ? 'out' : undefined

  return (
    <div className="ac-stage" style={{ '--ac-turn-sign': sign } as CSSProperties}>
      {showFlat && (
        <div
          ref={flatRef}
          className={`ac-stage__flat${shown === '3d' ? ' ac-stage__over' : ''}`}
          data-turn={flatTurn}
          aria-hidden={shown === '3d' || undefined}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {props.children}
        </div>
      )}
      {showSolid && (
        <div
          className={`ac-stage__solid${shown === '2d' ? ' ac-stage__over' : ''}`}
          data-turn={solidTurn}
          aria-hidden={shown === '2d' || undefined}
        >
          <Ac3D
            state={props.state}
            form={props.form}
            initialYaw={shown === '3d' ? 0 : sign * acTurnYaw}
            turn={phase.name === 'to2d' ? sign * acTurnYaw : phase.name === 'to3d' && !phase.ready ? undefined : 0}
            onReady={() => setPhase(current => current.name === 'to3d' ? { name: 'to3d', ready: true } : current)}
            onFlatten={() => onViewChange('2d')}
            onError={fail}
          />
        </div>
      )}
    </div>
  )
}

function stopClick(event: Event) {
  event.preventDefault()
  event.stopPropagation()
}

export default AcStage
