import * as path from 'node:path'
import react from '@vitejs/plugin-react'
import Unocss from 'unocss/vite'

import { defineConfig } from 'vite'
import Pages from 'vite-plugin-pages'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@yunlefun-home/air-conditioner-core': path.resolve(__dirname, '../core/src/index.ts'),
      '~/': `${path.resolve(__dirname, 'src')}/`,
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
