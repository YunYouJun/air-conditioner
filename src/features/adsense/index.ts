import ReactGA from "react-ga";

/**
 * 喜马拉雅广告链接
 */
export const ximalayaLink =
  "https://m.ximalaya.com/sleepaudio/6?mixedTrackIds=331526646&utm_source=smxkt";

/**
 * 跳转至喜马拉雅
 * 「你想用钱来收买我吗？这是对我的侮辱！我本想这样大声呵斥他，但钱实在是太多了」
 */
export function jumpToXimalaya() {
  console.log(
    "你想用钱来收买我吗？这是对我的侮辱！我本想这样大声呵斥他，但钱实在是太多了。"
  );
  ReactGA.ga("send", {
    hitType: "event",
    eventCategory: "Outbound Link",
    eventAction: "click",
    eventLabel: "Ximalaya Adsense",
  });
  window.open(ximalayaLink);
}
