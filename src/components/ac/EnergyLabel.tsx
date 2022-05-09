/**
 * 文本标签（黑色小点点）
 * @param num
 * @param color
 * @param size 宽高尺寸
 * @param mx
 * @param my
 */
const TextLabel: React.FC<{
  num: number
  color: string
  size: number
  mx: number
  my: number
}> = (props) => {
  // eslint-disable-next-line react/prop-types
  const { color, size, mx, my, num } = props
  const titleLength = [...new Array(num).keys()]
  const titleLabel = titleLength.map(n => (
    <span
      className="text-dot rounded-full"
      key={n}
      style={{
        width: size,
        height: size,
        margin: `${my || 0}px ${mx}px`,
      }}
    ></span>
  ))
  return (
    <div className="flex justify-center" style={{
      '--ac-c-text-dot': color,
    } as any}>
      {titleLabel}
    </div>
  )
}

/**
 * 功耗标签
 */
export const EnergyLabel: React.FC<{ titleLength: number }> = () => {
  return (
    <div
      className="absolute p-1"
      style={{
        backgroundColor: '#4ea5f5',
        borderRadius: 2,
        top: 10,
        left: 10,
        height: 70,
        width: 50,
      }}
    >
      <TextLabel num={6} size={4} mx={2} my={0} color="white" />
      <div
        className="my-1 h-7 w-full bg-white"
        style={{
          padding: '2px 8px',
        }}
      >
        <div className="flex">
          <div style={{ backgroundColor: 'green', width: '40%' }}></div>
          <div
            style={{
              marginLeft: '40%',
              height: 3,
              borderTop: 1.5,
              borderRight: 2,
              borderBottom: 1.5,
              borderLeft: 0,
              borderTopColor: 'transparent',
              borderRightColor: 'green',
              borderBottomColor: 'transparent',
              borderLeftColor: 'transparent',
              borderStyle: 'solid',
            }}
          ></div>
          <div style={{ backgroundColor: 'green', width: '10%' }} ></div>
        </div>
        <div className="energy-label-level" style={{ backgroundColor: 'lightgreen', width: '50%' }} ></div>
        <div className="energy-label-level" style={{ backgroundColor: '#ffc107', width: '60%' }} ></div>
        <div className="energy-label-level" style={{ backgroundColor: 'orange', width: '70%' }} ></div>
        <div className="energy-label-level" style={{ backgroundColor: 'red', width: '80%' }} ></div>
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

/**
 * 节能产品惠民工程
 */
export function EnergySavingLabel() {
  return (
    <a
      className="adsense-link"
      href="https://sponsors.yunyoujun.cn"
      target="_blank" rel="noreferrer"
    >
      <div className="energy-saving-label">
        <div className="energy-saving-label_bg">
          <span className="energy-saving-label_title">
            节能产品&nbsp;&nbsp;惠民工程
          </span>
          {/* <img
            className="adsense-logo"
            src="/images/ximalaya-logo.png"
            alt="夏日清凉"
          /> */}
          <span className="adsense-logo" title="夏日清凉">
            💰
          </span>
          <span className="energy-saving-label_description">
            推广上限价格：XXXX 元
          </span>
          <span className="energy-saving-label_description">
            政府补助金额：XXXX 元
          </span>
          <span className="energy-saving-label_description">
            补助上限价格：XXXX 元
          </span>
        </div>
      </div>
    </a>
  )
}
