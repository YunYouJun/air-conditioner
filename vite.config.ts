import * as path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import Pages from 'vite-plugin-pages'
import { VitePWA } from 'vite-plugin-pwa'
import Unocss from 'unocss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
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
