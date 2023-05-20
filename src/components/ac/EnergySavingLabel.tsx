/**
 * 节能产品惠民工程
 */
export function EnergySavingLabel() {
  // const adsenseLink = 'https://sponsors.yunyoujun.cn'
  const adsenseLink = 'https://www.bilibili.com/blackboard/activity-gkKsCvz81a.html?bsource=yunlefun'

  return (
    <a
      className="adsense-link"
      href={adsenseLink}
      target="_blank" rel="noreferrer"
    >
      <div className="energy-saving-label">
        <div className="energy-saving-label_bg">
          <span className="energy-saving-label_title">
            节能产品&nbsp;&nbsp;惠民工程
          </span>
          <img
            className="flex adsense-logo rounded-lg w-16 my-4"
            src="https://zelda-weapons.yunle.fun/icon.jpg"
            alt="夏日清凉"
          />
          <span className="mb-2">万物皆可塞尔达</span>
          {/* <span className="adsense-logo" title="夏日清凉">
            💰
          </span> */}
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
