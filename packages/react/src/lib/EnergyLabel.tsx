import type { AcDotRow } from '@yunlefun-home/air-conditioner-core'
import type { CSSProperties, ReactNode } from 'react'
import { acEnergyLabel } from '@yunlefun-home/air-conditioner-core'

function DotRow(props: { row: AcDotRow, children?: ReactNode }) {
  const { row } = props
  return (
    <div className="acw-dot-row" style={{ '--acw-dot-color': row.color } as CSSProperties}>
      {Array.from({ length: row.num }, (_, n) => (
        <span
          key={n}
          className="acw-dot"
          style={{ width: `${row.size}px`, height: `${row.size}px`, margin: `${row.my}px ${row.mx}px` }}
        />
      ))}
      {props.children}
    </div>
  )
}

/**
 * 能效标签：点阵与等级条布局来自 core，与 Vue / Web Component 保持一致。
 */
export function EnergyLabel() {
  return (
    <div className="acw-energy-label">
      {/* 顶部白点 */}
      {acEnergyLabel.top.map((row, ri) => <DotRow key={`top-${ri}`} row={row} />)}

      {/* 能效等级区 */}
      <div className="acw-energy-grades">
        <div className="acw-energy-arrow">
          <div className="acw-arrow-bar" />
          <div className="acw-arrow-tip" />
          <div className="acw-arrow-bar acw-arrow-bar-sm" />
        </div>
        {acEnergyLabel.levels.map((level, i) => (
          <div key={i} className="acw-energy-level" style={{ backgroundColor: level.background, width: level.width }} />
        ))}
      </div>

      {/* 文字明细区 */}
      <div className="acw-energy-detail">
        {acEnergyLabel.detail.map((row, ri) => (
          <DotRow key={`detail-${ri}`} row={row}>
            {ri === 0 && <div className="acw-energy-detail-line" />}
          </DotRow>
        ))}
      </div>

      {/* 底部白点 */}
      <DotRow row={acEnergyLabel.footer} />
    </div>
  )
}
