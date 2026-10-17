import type { AcDotRow } from '@yunlefun-home/air-conditioner-core'
import type { CSSProperties } from 'react'
import { acEnergyLabel, getAcEnergyLabelText } from '@yunlefun-home/air-conditioner-core'
import { Fragment } from 'react'

function DotRow(props: { row: AcDotRow }) {
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
    </div>
  )
}

/**
 * 能效标签：点阵与等级条布局来自 core，与 Vue / Web Component 保持一致。
 */
export function EnergyLabel() {
  return (
    <div className="acw-energy-label" role="img" aria-label={getAcEnergyLabelText()}>
      {/* 顶部：标识名称（白点）与能效信息码 */}
      <div className="acw-energy-header">
        {acEnergyLabel.top.map((row, ri) => <DotRow key={`top-${ri}`} row={row} />)}
        <span className="acw-energy-qr" />
      </div>

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
        {/* 分隔线放在点阵行外面，否则在 flex 行里宽度为 0 */}
        {acEnergyLabel.detail.map((row, ri) => (
          <Fragment key={`detail-${ri}`}>
            <DotRow row={row} />
            {ri === 0 && <div className="acw-energy-detail-line" />}
          </Fragment>
        ))}
      </div>

      {/* 底部白点 */}
      <DotRow row={acEnergyLabel.footer} />
    </div>
  )
}
