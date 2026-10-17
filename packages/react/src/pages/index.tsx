import type { AcForm } from '@yunlefun-home/air-conditioner-core'
import { acFormLabels, acForms, isAcForm } from '@yunlefun-home/air-conditioner-core'
import React, { useState } from 'react'

import { useLocalStorage } from 'usehooks-ts'
import * as pkg from '~/../package.json'
import Ac3D, { supportsWebGL } from '~/components/ac3d'
import ComputerCooling from '~/components/ComputerCooling'
import { EnergySavingLabel } from '~/components/EnergySavingLabel'
import ProTip from '~/components/ProTip'

import RemoteControl from '~/components/RemoteControl'
import { peekAudioController } from '~/components/RemoteControl/audio'
import { useFloatingRemote } from '~/components/RemoteControl/floating'
import Toast from '~/components/Toast'

import { useAcCtx } from '~/context'
import { useDetectStorage } from '~/hooks'
import { AirConditioner } from '~/lib/AirConditioner'

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
          {show3D
            ? <Ac3D state={ac} form={form} onError={() => setFailed(true)} />
            : (
                // 与组件库同一个空调，用 3 : 1 的长款机身
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
              )}
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
              title={!webgl ? '这个浏览器不支持 WebGL' : failed ? '3D 模型没加载出来' : show3D ? '换回平面版' : '和桌面版共用同一个 3D 模型，拖动可以转一转'}
              onClick={() => setView(show3D ? '2d' : '3d')}
            >
              <span className="i-mdi-cube-outline ac-chip__icon" aria-hidden="true" />
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
