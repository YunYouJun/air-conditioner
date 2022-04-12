export type AcMode = 'cold' | 'hot'

export interface AcState {
  /**
   * 状态
   */
  status: boolean
  /**
   * 模式
   */
  mode: AcMode
  /**
   * 温度
   */
  temperature: number
}
