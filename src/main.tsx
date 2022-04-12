import React from 'react'
import ReactDOM from 'react-dom'

import '@unocss/reset/tailwind.css'
// your custom styles here
import './styles/css-vars.scss'
import './styles/index.scss'
import 'uno.css'

import TagManager from 'react-gtm-module'
import App from './App'
import reportWebVitals from './reportWebVitals'
import { AcProvider, ComposeContext } from './context'
import { ToastProvider } from './context/toast'

const tagManagerArgs = {
  gtmId: 'GTM-NFMC9GL',
}
TagManager.initialize(tagManagerArgs)

ReactDOM.render(
  <React.StrictMode>
    <ComposeContext items={[AcProvider, ToastProvider]}>
      <App />
    </ComposeContext>
  </React.StrictMode>,
  document.getElementById('root'),
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
