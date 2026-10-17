import { adsense } from '~/config'
import './EnergySavingLabel.scss'

/**
 * 节能产品惠民工程：网站独有的宣传贴纸，作为子元素贴在组件库的空调机身上
 */
export function EnergySavingLabel() {
  // const adsenseLink = 'https://sponsors.yunyoujun.cn'
  return (
    <a
      className="adsense-link"
      href={adsense.link}
      target="_blank"
      rel="noreferrer"
    >
      <div className="energy-saving-label">
        <div className="energy-saving-label_bg">
          <span className="energy-saving-label_title">
            节能产品&nbsp;&nbsp;惠民工程
          </span>
          <div className={`${adsense.icon} adsense-logo flex rounded-lg w-16 my-4 op-80`}></div>
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
