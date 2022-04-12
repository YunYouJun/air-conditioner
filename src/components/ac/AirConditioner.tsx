import type { FC } from 'react'
import React from 'react'
import { Box, Fade, Typography } from '@mui/material'
import { EnergyLabel, EnergySavingLabel } from './EnergyLabel'
import type { AcMode } from '~/types'

import * as pkg from '~/../package.json'

import './AirConditioner.scss'
import { useAcCtx } from '~/context'

// import { adsenseLink, jumpToAdsense } from "../adsense";

const acColor = {
  border: '#e0e0e0',
  display: '#cccccc',
  wind: '#bbbbbb',
}

const AcBorder: React.FC = (props) => {
  return (
    <Box
      bgcolor="background.paper"
      height={150}
      border={1}
      borderColor={acColor.border}
      borderRadius={10}
      boxShadow={3}
      position="relative"
      style={{
        borderRadius: 10,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
      }}
      {...props}
    ></Box>
  )
}

/**
 * 空调温度
 * @returns
 */
const AcTemperature: FC = () => {
  const { state } = useAcCtx()
  return (
    <Typography variant="h4" align="center">
      <span className="font-digit ac-temperature">{state.temperature}</span>
      <small className="font-digit">°C</small>
    </Typography>
  )
}

/**
 * 显示屏（温度/图标）
 * @param props
 */
const AcDisplay = React.forwardRef((props: { mode: AcMode }, ref) => {
  return (
    <Box
      {...props}
      ref={ref}
      position="absolute"
      top={25}
      right={30}
      color={acColor.display}
    >
      <Typography align="left" variant="subtitle2">
        <span>{props.mode === 'cold' ? '❄' : '☀️'}</span>️️
      </Typography>
      <AcTemperature />
    </Box>
  )
})

/**
 * 空调 Logo
 * @param props
 */
const AcLogo: React.FC = () => {
  return (
    <div className="text-center mt-28">
      <a
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
  return <Box mt={1} border={1} borderColor={acColor.border}></Box>
}

/**
 * 空调状态
 * @param props
 */
const AcStatus: React.FC<{ status: boolean }> = (props) => {
  // 空调状态小灯
  const led = { backgroundColor: props.status ? '#38F709' : acColor.border }

  return (
    <Box
      style={{
        backgroundColor: led.backgroundColor || 'transparent',
      }}
      position="absolute"
      height={4}
      width={4}
      borderRadius="50%"
      top={130}
      right={10}
    ></Box>
  )
}

/**
 * 风特效
 * @param props
 */
const WindEffect = React.forwardRef((props, ref) => {
  return (
    <Box {...props} ref={ref} mt={3} display="flex" justifyContent="center">
      <Box
        style={{ transform: 'rotate(10deg)' }}
        bgcolor={acColor.wind}
        width={5}
        height={40}
      ></Box>
      <Box mx={10} bgcolor={acColor.wind} width={5} height={40}></Box>
      <Box
        style={{ transform: 'rotate(-10deg)' }}
        bgcolor={acColor.wind}
        width={5}
        height={40}
      ></Box>
    </Box>
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
    <Box>
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
      <Fade in={props.status} timeout={{ enter: 2500, exit: 1500 }}>
        <WindEffect />
      </Fade>
    </Box>
  )
}

export default AirConditioner
