import React from 'react'

import { Fade } from '../Fade'
import { AcDisplay } from './AcDisplay'
import { EnergyLabel } from './EnergyLabel'
import { EnergySavingLabel } from './EnergySavingLabel'
import type { AcMode } from '~/types'

import * as pkg from '~/../package.json'

import './AirConditioner.scss'

// import { adsenseLink, jumpToAdsense } from "../adsense";

export const acColor = {
  border: '#e0e0e0',
  display: '#cccccc',
  wind: '#bbbbbb',
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
    ></div>
  )
}

/**
 * 空调 Logo
 * @param props
 */
const AcLogo: React.FC = () => {
  return (
    <div className="text-center mt-28">
      <a
        className='block'
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
 * @returns
 */
const AirOutlet: React.FC = () => {
  return <div className="mt-1" style={{ border: `1px solid ${acColor.border}` }}></div>
}

/**
 * 空调状态
 * @param props
 */
const AcStatus: React.FC<{ status: boolean }> = (props) => {
  // 空调状态小灯
  const led = { backgroundColor: props.status ? '#38F709' : acColor.border }

  return (
    <div
      className="absolute h-1 w-1 rounded-full top-32 right-2"
      style={{
        backgroundColor: led.backgroundColor || 'transparent',
      }}
    ></div>
  )
}

/**
 * 风特效
 * @param props
 */
const WindEffect = React.forwardRef((props, ref) => {
  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className="wind-effect flex justify-center my-5">
      <div
        className="wind-line h-10 w-1"
        style={{ backgroundColor: acColor.wind, transform: 'rotate(10deg)' }}
      ></div>
      <div className="wind-line h-10 w-1 mx-20" style={{ backgroundColor: acColor.wind }}></div>
      <div
        className="wind-line h-10 w-1"
        style={{ backgroundColor: acColor.wind, transform: 'rotate(-10deg)' }}
      ></div>
    </div>
  )
})

/**
 * 空调
 */
const AirConditioner: React.FC<{
  mode: AcMode
  status: boolean
  temperature: number
}> = (props) => {
  return (
    <div>
      <AcBorder>
        <Fade in={props.status}>
          <AcDisplay mode={props.mode} />
        </Fade>
        <AcLogo />
        <AirOutlet />
        <AcStatus status={props.status} />
        <EnergyLabel titleLength={6} />
        {import.meta.env.VITE_DISABLE_ADSENSE ? null : <EnergySavingLabel />}
      </AcBorder>
      <Fade in={props.status}>
        <WindEffect />
      </Fade>
    </div>
  )
}

export default AirConditioner
