/**
 * 是否为生产环境
 */
export const isProd = import.meta.env.PROD

/**
 * 获取资源 URL
 * @param url
 */
export function getAssetsUrl(url: string) {
  const jsdelivrCDN
    = 'https://cdn.jsdelivr.net/gh/YunYouJun/air-conditioner/public'
  return (isProd ? jsdelivrCDN : import.meta.env.BASE_URL) + url.startsWith('/')
    ? url.slice(1)
    : url
}
