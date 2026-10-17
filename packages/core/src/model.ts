import type { AcState } from './types'

/**
 * 3D 模型的两种形态：挂机与柜机。
 *
 * 模型由 `apps/macos/Model/build_cute_ac.py` 在 Blender 里生成：原生应用读 USDZ，网页读同一个场景导出的 GLB。
 * 这里的约定与 Swift 共享包里的 `ACModel` 一一对应，改动时两边一起改（有测试检查）。
 */
export type AcForm = 'wall' | 'tower'

export const acForms: readonly AcForm[] = ['wall', 'tower']

export const acFormLabels: Record<AcForm, string> = {
  wall: '挂机',
  tower: '柜机',
}

/** 网页用的模型文件名（站点的 `public/models/` 下） */
export const acModelFiles: Record<AcForm, string> = {
  wall: 'CuteAC.glb',
  tower: 'CuteACTower.glb',
}

/** 渲染器要控制的命名节点，两种形态相同 */
export const acModelParts = {
  /** 导风板：挂机是一整块，柜机是一组百叶（子节点） */
  louver: 'Louver',
  /** 0.25 × 0.1、UV 为 0–1 的平面，贴温度画面 */
  display: 'Display',
  /** 指示灯 */
  led: 'Led',
} as const

/**
 * 开机时导风板怎么动：都绕本地 X 轴转；`node` 是导风板整体转，`children` 是每片百叶各自转。
 */
export interface AcLouverMotion {
  pivot: 'node' | 'children'
  /** 开机时的角度（度），关机为 0 */
  openAngle: number
}

export const acLouverMotion: Record<AcForm, AcLouverMotion> = {
  wall: { pivot: 'node', openAngle: 40 },
  tower: { pivot: 'children', openAngle: 30 },
}

/**
 * 出风的起点（相对导风板的世界坐标，Y 轴朝上、+Z 朝向观看者）、出风口的宽度和出风方向：
 * 挂机向下吹，柜机从百叶侧面吹出。
 */
export interface AcAirflowAnchor {
  offset: readonly [number, number, number]
  extent: number
  direction: 'down' | 'side'
}

export const acAirflowAnchors: Record<AcForm, AcAirflowAnchor> = {
  wall: { offset: [0, -0.1, 0.05], extent: 1.5, direction: 'down' },
  tower: { offset: [0.24, 0, 0.08], extent: 0.5, direction: 'side' },
}

/** 指示灯与显示窗的颜色：开机时是模式色，关机是灰色（与 `ACPalette` 一致） */
export const acModelColors = {
  cold: '#5aa9ff',
  hot: '#ff9f5a',
  off: '#8e97aa',
} as const

export function getAcLedColor(state: Pick<AcState, 'status' | 'mode'>): string {
  return state.status ? acModelColors[state.mode] : acModelColors.off
}

export function isAcForm(value: unknown): value is AcForm {
  return value === 'wall' || value === 'tower'
}
