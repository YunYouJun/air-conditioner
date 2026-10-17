import * as path from 'node:path'
import process from 'node:process'
import react from '@vitejs/plugin-react'
import Unocss from 'unocss/vite'

import { defineConfig } from 'vite'
import Pages from 'vite-plugin-pages'
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
  plugins: [
    react(),

    Unocss(),

    // https://github.com/hannoeru/vite-plugin-pages
    Pages(),

    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt'],
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
