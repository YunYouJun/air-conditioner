---
layout: home

hero:
  name: Air Conditioner
  text: 便携小空调组件库
  tagline: React、Vue 与原生 Web Component 的多入口组件方案
  actions:
    - theme: brand
      text: React
      link: /guide/react
    - theme: alt
      text: Web Component
      link: /guide/web-component

features:
  - title: Shared Core
    details: 状态机、温度规则、通知和存储逻辑集中在 @yunlefun-home/air-conditioner-core。
  - title: Framework Adapters
    details: React 与 Vue 只负责框架绑定和组件渲染。
  - title: Native Widget
    details: Web Component 不依赖 React/Vue，适合普通网页和跨框架嵌入。
---

## Packages

- `@yunlefun-home/air-conditioner-core`
- `@air-conditioner/react`
- `@yunlefun-home/air-conditioner`
- `@air-conditioner/widget`

## Development

```bash
pnpm install
pnpm build
pnpm docs:dev
```
