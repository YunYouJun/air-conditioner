import React from 'react'

import AirConditioner from '~/components/ac/AirConditioner'
import ComputerCooling from '~/components/ComputerCooling'
import ProTip from '~/components/ProTip'

import RemoteControl from '~/components/RemoteControl'
import { useFloatingRemote } from '~/components/RemoteControl/floating'
import Toast from '~/components/Toast'

import { useAcCtx } from '~/context'
import { useDetectStorage } from '~/hooks'

/**
 * 主页
 */
const Home: React.FC = () => {
  const { state: ac } = useAcCtx()
  const floating = useFloatingRemote()

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
          <AirConditioner
            status={ac.status}
            temperature={ac.temperature}
            mode={ac.mode}
            swing={ac.swing}
            fan={ac.fan}
          />
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
