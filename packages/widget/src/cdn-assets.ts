import { name, version } from '../package.json'

const base = `https://cdn.jsdelivr.net/npm/${name}@${version}/dist/embed`

/** Optional CDN resources pinned to this installed package's exact version. */
export const cdnAssets = {
  assetsBaseUrl: `${base}/assets`,
  logoUrl: `${base}/yun-logo.svg`,
}
