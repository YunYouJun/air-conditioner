import React from 'react'
import { createRoot } from 'react-dom/client'

import TagManager from 'react-gtm-module'

import App from './App'
import { AcProvider, ComposeContext } from './context'
import { ToastProvider } from './context/toast'

import '@unocss/reset/tailwind.css'
// your custom styles here
import './styles/css-vars.scss'
import './styles/motion.css'
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
