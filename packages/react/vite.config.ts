import * as path from 'node:path'
import process from 'node:process'
import react from '@vitejs/plugin-react'
import Unocss from 'unocss/vite'

import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  // GitHub Pages 部署在 yunyoujun.github.io/air-conditioner/ 子路径下，由 workflow 传入；其余部署在根路径
  base: process.env.VITE_BASE || '/',
  resolve: {
    alias: {
      '@yunlefun-home/air-conditioner-core': path.resolve(import.meta.dirname, '../core/src/index.ts'),
      '~/': `${path.resolve(import.meta.dirname, 'src')}/`,
    },
  },
  // 3D 模式按需导入 Three.js：开发时预先打包好，免得第一次打开 3D 时才发现新依赖、整页重新加载
  optimizeDeps: {
    include: ['three', 'three/addons/loaders/GLTFLoader.js'],
  },
  build: {
    // 3D 模式的按需分包里有整个 Three.js（约 160 kB gzip），不影响首屏
    chunkSizeWarningLimit: 700,
  },
  plugins: [
    react(),

    Unocss(),

    VitePWA({
      registerType: 'autoUpdate',
      // 首屏就要用到的小资源一起预缓存：Logo 和数码管字体（约 40 kB），离线或网络断开时也不会缺图、掉字体
      includeAssets: ['favicon.svg', 'robots.txt', 'yun-logo.svg', 'assets/fonts/*.ttf'],
      workbox: {
        // 3D 模式（Three.js 与模型）只在打开时下载，不预缓存；用过一次后再缓存下来，离线也能用
        globIgnores: ['**/Ac3DView-*.js'],
        runtimeCaching: [
          {
            urlPattern: /\/(?:assets\/Ac3DView-[^/]+\.js|models\/[^/]+\.glb)$/,
            handler: 'CacheFirst',
            options: { cacheName: 'ac-3d' },
          },
        ],
      },
      manifest: {
        name: '便携小空调',
        short_name: '云空调',
        theme_color: '#000000',
        start_url: '.',
        display: 'standalone',
        background_color: '#ffffff',
        icons: [
          {
            src: 'favicon.svg',
            type: 'image/png',
            sizes: '64x64',
          },
        ],
      },
    }),
  ],
})
