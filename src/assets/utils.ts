/**
 * 是否为生产环境
 */
export const isProd = process.env.NODE_ENV === "production";

/**
 * 获取资源 URL
 * @param url
 */
export function getAssetsUrl(url: string) {
  const jsdelivrCDN =
    "https://cdn.jsdelivr.net/gh/YunYouJun/air-conditioner/public";
  return (isProd ? jsdelivrCDN : process.env.PUBLIC_URL) + url;
}

export function getWeather() {
  navigator.geolocation.getCurrentPosition((position) => {
    console.log(position.coords.longitude, position.coords.latitude);
  });
  navigator.geolocation.getCurrentPosition((position) => {
    fetch(
      `https://devapi.qweather.com/v7/weather/now?location=${position.coords.longitude},${position.coords.latitude}&key=9586c8f29b81478cba3b57eeaeadf33f`
    );
  });
}
