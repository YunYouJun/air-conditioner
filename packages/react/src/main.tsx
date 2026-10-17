import React from 'react'
import { createRoot } from 'react-dom/client'

import TagManager from 'react-gtm-module'

import App from './App'
import { AcProvider, ComposeContext } from './context'
import { ToastProvider } from './context/toast'

import '@unocss/reset/tailwind.css'
// 空调、遥控器与组件库共用样式（含动效 token）；放在 reset 之后，避免按键背景被重置
import '~/lib/style.css'
// your custom styles here
import './styles/css-vars.scss'
import './styles/index.scss'
import 'uno.css'

const tagManagerArgs = {
  gtmId: 'GTM-NFMC9GL',
}
TagManager.initialize(tagManagerArgs)

createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ComposeContext items={[AcProvider, ToastProvider]}>
      <App />
    </ComposeContext>
  </React.StrictMode>,
)
