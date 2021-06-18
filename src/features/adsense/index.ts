import ReactGA from "react-ga";

/**
 * 广告链接
 */
export const adsenseLink =
  "https://sourl.cn/ExRSyF";

/**
 * 跳转至公众号广告
 * 「你想用钱来收买我吗？这是对我的侮辱！我本想这样大声呵斥他，但钱实在是太多了」
 */
export function jumpToAdsense() {
  console.log(
    "你想用钱来收买我吗？这是对我的侮辱！我本想这样大声呵斥他，但钱实在是太多了。"
  );
  ReactGA.ga("send", {
    hitType: "event",
    eventCategory: "Outbound Link",
    eventAction: "click",
    eventLabel: "Summer Adsense",
  });
  window.open(adsenseLink);
}
