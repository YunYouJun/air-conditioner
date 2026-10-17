import { getAcEnergyLabelText } from '@yunlefun-home/air-conditioner-core'
import React from 'react'

interface TextLabelProps {
  num: number
  color: string
  /**
   * 宽高尺寸
   */
  size: number
  mx: number
  my: number
}

/**
 * 文本标签（黑色小点点）
 */
const TextLabel: React.FC<TextLabelProps> = (props) => {
  const { color, size, mx, my, num } = props
  const titleLength = [...Array.from({ length: num }).keys()]
  const titleLabel = titleLength.map(n => (
    <span
      className="text-dot rounded-full"
      key={n}
      style={{
        width: size,
        height: size,
        margin: `${my || 0}px ${mx}px`,
      }}
    >
    </span>
  ))
  return (
    <div
      className="flex justify-center"
      style={{
        '--ac-c-text-dot': color,
      } as any}
    >
      {titleLabel}
    </div>
  )
}

/**
 * 能效标签：中国能效标识的缩影，按现行 GB 21455-2019 分 5 级，带能效信息码
 * （`.acw-energy-qr`，样式来自组件库）。按 50 × 80 设计，在 600 × 200 的机身上
 * 缩小到约 45 × 72，和实物占挂机正面的比例相当。
 */
export const EnergyLabel: React.FC<{ titleLength: number }> = () => {
  return (
    <div
      className="absolute p-1"
      role="img"
      aria-label={getAcEnergyLabelText()}
      style={{
        backgroundColor: '#4ea5f5',
        borderRadius: 2,
        top: 10,
        left: 10,
        // 接近实物 66 × 109 mm 的比例，放得下顶部的能效信息码
        height: 80,
        width: 50,
        boxSizing: 'border-box',
        transform: 'scale(0.9)',
        transformOrigin: '0 0',
      }}
    >
      <div className="flex items-center justify-between">
        <TextLabel num={4} size={4} mx={1.5} my={0} color="white" />
        <span className="acw-energy-qr" />
      </div>
      <div
        className="my-1 h-7 w-full bg-white flex flex-col justify-evenly"
        style={{
          padding: '2px 8px',
          boxSizing: 'border-box',
        }}
      >
        <div className="flex" style={{ height: 3 }}>
          <div style={{ backgroundColor: 'green', width: '40%' }}></div>
          <div
            style={{
              marginLeft: '40%',
              height: 3,
              // 朝左的小三角；只用展开属性，避免与简写混用
              borderWidth: '1.5px 2px 1.5px 0',
              borderColor: 'transparent green transparent transparent',
              borderStyle: 'solid',
            }}
          >
          </div>
          <div style={{ backgroundColor: 'green', width: '10%' }}></div>
        </div>
        {/* 2–5 级（共 5 级，1 级是上面的绿色条） */}
        <div className="energy-label-level" style={{ backgroundColor: 'lightgreen', width: '50%' }}></div>
        <div className="energy-label-level" style={{ backgroundColor: '#fdd835', width: '60%' }}></div>
        <div className="energy-label-level" style={{ backgroundColor: 'orange', width: '70%' }}></div>
        <div className="energy-label-level" style={{ backgroundColor: 'red', width: '80%' }}></div>
      </div>
      <div
        className="w-full h-5 bg-white"
        style={{
          marginBottom: 2,
          paddingTop: 0.8,
        }}
      >
        <TextLabel num={11} size={2} mx={0.8} my={2} color="black" />
        <div className="w-full h-0" style={{ borderTop: '1px solid', margin: '0.8px 0' }}></div>
        <TextLabel num={9} size={1.5} mx={0.8} my={2} color="black" />
        <TextLabel num={10} size={1.2} mx={0.8} my={0} color="black" />
      </div>
      <TextLabel num={8} size={2} mx={0.8} my={0} color="white" />
    </div>
  )
}
