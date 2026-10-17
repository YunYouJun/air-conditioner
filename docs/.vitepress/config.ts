import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Air Conditioner',
  description: '便携小空调组件库文档',
  cleanUrls: true,
  themeConfig: {
    search: {
      provider: 'local',
    },
    nav: [
      { text: 'Guide', link: '/guide/react' },
      { text: 'Design', link: '/design/architecture' },
      { text: 'API', link: '/api/' },
      { text: '更新日志', link: '/changelog' },
      { text: 'GitHub', link: 'https://github.com/YunYouJun/air-conditioner' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'React', link: '/guide/react' },
            { text: 'Vue', link: '/guide/vue' },
            { text: 'Web Component', link: '/guide/web-component' },
            { text: 'macOS', link: '/guide/macos' },
          ],
        },
      ],
      '/design/': [
        {
          text: 'Design',
          items: [
            { text: 'Architecture', link: '/design/architecture' },
            { text: 'Testing', link: '/design/testing' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API',
          items: [
            { text: 'Overview', link: '/api/' },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/YunYouJun/air-conditioner' },
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © YunYouJun.',
    },
  },
})
