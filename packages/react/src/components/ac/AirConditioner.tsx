import type { AcMode } from '~/types'

import React from 'react'
import * as pkg from '~/../package.json'
import { AcDisplay } from './AcDisplay'
import { EnergyLabel } from './EnergyLabel'

import { EnergySavingLabel } from './EnergySavingLabel'

import './AirConditioner.scss'

// import { adsenseLink, jumpToAdsense } from "../adsense";

export const acColor = {
  border: '#e0e0e0',
  display: '#cccccc',
}

const AcBorder: React.FC<React.PropsWithChildren> = (props) => {
  return (
    <div
      className="bg-white h-38 shadow relative"
      style={{
        border: `1px solid ${acColor.border}`,
        borderRadius: 10,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
      }}
      {...props}
    >
    </div>
  )
}

/**
 * 空调 Logo
 */
const AcLogo: React.FC = () => {
  return (
    <div className="text-center mt-28">
      <a
        className="block"
        href={pkg.repository.url}
        title={pkg.description}
        target="_blank"
        rel="noreferrer noopener"
      >
        <img
          className="m-auto"
          style={{
            width: 12,
          }}
          src="/yun-logo.svg"
          alt="logo"
        />
      </a>
    </div>
  )
}

/**
 * 出风口线
 */
const AirOutlet: React.FC = () => {
  return <div className="mt-1" style={{ border: `1px solid ${acColor.border}` }}></div>
}

/**
 * 出风口与导风板（开机时打开）
 */
const AirLouver: React.FC = () => {
  return (
    <>
      <div className="ac-vent" aria-hidden="true"></div>
      <div className="ac-louver" aria-hidden="true"></div>
    </>
  )
}

/**
 * 空调状态
 * @param props
 */
const AcStatus: React.FC<{ status: boolean }> = (props) => {
  // 空调状态小灯：亮起的光晕由样式里的伪元素过渡
  return (
    <div
      className="ac-led absolute h-1 w-1 rounded-full top-32 right-2"
      aria-label={props.status ? 'on' : 'off'}
    >
    </div>
  )
}

/**
 * 风特效
 */
const WindEffect: React.FC<{ hidden: boolean }> = (props) => {
  return (
    <div className="wind-effect flex justify-center my-5" aria-hidden={props.hidden}>
      <div className="wind-line h-10 w-1"></div>
      <div className="wind-line h-10 w-1 mx-20"></div>
      <div className="wind-line h-10 w-1"></div>
    </div>
  )
}

/**
 * 空调
 */
const AirConditioner: React.FC<{
  mode: AcMode
  status: boolean
  temperature: number
}> = (props) => {
  return (
    <div className="ac-unit" data-mode={props.mode} data-status={props.status ? 'on' : 'off'}>
      <AcBorder>
        <AcDisplay mode={props.mode} />
        <AcLogo />
        <AirOutlet />
        <AirLouver />
        <AcStatus status={props.status} />
        <EnergyLabel titleLength={6} />
        {import.meta.env.VITE_DISABLE_ADSENSE ? null : <EnergySavingLabel />}
      </AcBorder>
      <WindEffect hidden={!props.status} />
    </div>
  )
}

export default AirConditioner
