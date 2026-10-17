/**
 * 是否为生产环境
 */
export const isProd = import.meta.env.PROD

/**
 * 获取资源 URL（带上部署的 base 路径，如 GitHub Pages 的 /air-conditioner/）
 * @param url
 */
export function getAssetsUrl(url: string) {
  return import.meta.env.BASE_URL + url.replace(/^\//, '')
}
