import React from 'react'
import ReactDOM from 'react-dom/client'

import '@unocss/reset/tailwind.css'
// your custom styles here
import './styles/css-vars.scss'
import './styles/index.scss'
import 'uno.css'

import TagManager from 'react-gtm-module'
import App from './App'
import reportWebVitals from './reportWebVitals'

const tagManagerArgs = {
  gtmId: 'GTM-NFMC9GL',
}
TagManager.initialize(tagManagerArgs)

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
