import TagManager from 'react-gtm-module'

/**
 * 广告链接（云空调后记）
 */
export const adsenseLink = 'https://mp.weixin.qq.com/s/WRZgds9PlH5MBxlhJYOj8g'

/**
 * 跳转至公众号广告
 * 「你想用钱来收买我吗？这是对我的侮辱！我本想这样大声呵斥他，但钱实在是太多了」
 *
 * 统计事件发给已接入的 Google Tag Manager（原来的 react-ga 对应的 Universal
 * Analytics 已于 2023 年停用）。
 */
export function jumpToAdsense() {
  TagManager.dataLayer({
    dataLayer: {
      event: 'outbound_click',
      link_category: 'Outbound Link',
      link_label: 'Summer Adsense',
    },
  })
  window.open(adsenseLink)
}
