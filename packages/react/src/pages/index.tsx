import type { AcForm } from '@yunlefun-home/air-conditioner-core'
import { acFormLabels, acForms, isAcForm } from '@yunlefun-home/air-conditioner-core'
import React, { useLayoutEffect, useState } from 'react'

import { useLocalStorage } from 'usehooks-ts'
import * as pkg from '~/../package.json'
import { supportsWebGL } from '~/components/ac3d'
import AcStage from '~/components/AcStage'
import ComputerCooling from '~/components/ComputerCooling'
import { EnergySavingLabel } from '~/components/EnergySavingLabel'
import ProTip from '~/components/ProTip'

import RemoteControl from '~/components/RemoteControl'
import { getAudioController, peekAudioController } from '~/components/RemoteControl/audio'
import { useFloatingRemote } from '~/components/RemoteControl/floating'
import Toast from '~/components/Toast'

import { useAcCtx } from '~/context'
import { useDetectStorage } from '~/hooks'
import { AirConditioner } from '~/lib/AirConditioner'
import { finishBoot } from '~/utils/boot'

/**
 * 主页
 */
const Home: React.FC = () => {
  const { state: ac } = useAcCtx()
  const floating = useFloatingRemote()
  // 3D 模式（#184）：记住选择；WebGL 不可用或加载失败时退回 CSS 版
  const [view, setView] = useLocalStorage<'2d' | '3d'>('ac-view', '2d')
  const [storedForm, setForm] = useLocalStorage<AcForm>('ac-form', 'wall')
  const form = isAcForm(storedForm) ? storedForm : 'wall'
  const [webgl] = useState(supportsWebGL)
  const [failed, setFailed] = useState(false)
  const show3D = view === '3d' && webgl && !failed

  useDetectStorage()
  // 画好后让首屏骨架淡出（子组件的布局 effect 先执行，尺寸已经量好）
  useLayoutEffect(finishBoot, [])

  /**
   * 根据模式返回对应的色温
   */
  function getClassByMode() {
    if (ac.status)
      return ac.mode === 'hot' ? 'hot-color' : 'cold-color'
    else
      return ''
  }

  return (
    <>
      <div className={`max-w-600px m-auto ${getClassByMode()}`}>
        <div className="pt-6">
          <h1 className="text-center text-3xl">
            便携小空调
          </h1>
          <ProTip />
          {/* 平面版与 3D 版之间「把空调转过来」；横向拖动平面机身也能把它拧成 3D */}
          <AcStage
            view={view}
            onViewChange={setView}
            can3D={webgl && !failed}
            state={ac}
            form={form}
            onFail={() => setFailed(true)}
            onSnap={() => getAudioController(ac.sound, ac.fan).beep()}
          >
            {/* 与组件库同一个空调，用 3 : 1 的长款机身 */}
            <AirConditioner
              size="wide"
              status={ac.status}
              temperature={ac.temperature}
              mode={ac.mode}
              swing={ac.swing}
              fan={ac.fan}
              title={pkg.description}
              logoUrl={`${import.meta.env.BASE_URL}yun-logo.svg`}
              logoHref={pkg.repository.url}
              onDrip={() => peekAudioController()?.drip()}
            >
              {import.meta.env.VITE_DISABLE_ADSENSE ? null : <EnergySavingLabel />}
            </AirConditioner>
          </AcStage>
          {/* 紧贴出风口：节能建议从这里被风吹出来 */}
          <Toast />
          <div className="ac-actions">
            <button
              type="button"
              className="ac-chip"
              aria-pressed={!!floating.window}
              title={floating.supported ? '把遥控器放进始终置顶的小窗' : '在新窗口打开遥控器'}
              onClick={() => (floating.window ? floating.close() : floating.open())}
            >
              <span className="i-mdi-remote ac-chip__icon" aria-hidden="true" />
              {floating.window ? '收回遥控器' : floating.supported ? '遥控器悬浮窗' : '独立遥控器'}
            </button>
            <button
              type="button"
              className="ac-chip"
              aria-pressed={show3D}
              disabled={!webgl || failed}
              title={!webgl ? '这个浏览器不支持 WebGL' : failed ? '3D 模型没加载出来' : show3D ? '换回平面版（3D 里回正后双击也可以）' : '和桌面版共用同一个 3D 模型（也可以横向拖动空调把它拧过来）'}
              onClick={() => setView(show3D ? '2d' : '3d')}
            >
              {/* 平面时是一个方块，打开 3D 时「弹」成立体方块 */}
              <svg className="ac-cube ac-chip__icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path className="ac-cube__edges" d="M5 9 9 5M15 9l4-4M15 19l4-4" />
                <rect className="ac-cube__back" x="7" y="7" width="10" height="10" rx="1" />
                <rect className="ac-cube__front" x="7" y="7" width="10" height="10" rx="1" />
              </svg>
              3D
            </button>
            {show3D && (
              <div className="ac-segment" role="group" aria-label="机型">
                {acForms.map(item => (
                  <button key={item} type="button" aria-pressed={form === item} onClick={() => setForm(item)}>
                    {acFormLabels[item]}
                  </button>
                ))}
              </div>
            )}
            <ComputerCooling />
          </div>
          <RemoteControl floating={floating.window} />
          {/* 遥控器被拿去悬浮窗时，原位留一个挂座 */}
          {floating.window && (
            <div className="ac-remote-dock">
              <span className="i-mdi-remote ac-remote-dock__icon" aria-hidden="true" />
              <p>遥控器在悬浮窗里</p>
              <button type="button" className="ac-chip" onClick={floating.close}>放回</button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Home
