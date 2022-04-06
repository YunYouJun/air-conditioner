import React from 'react'
import { createRoot } from 'react-dom/client'

import '@unocss/reset/tailwind.css'
// your custom styles here
import './styles/index.scss'

import 'uno.css'

import { Provider } from 'react-redux'
import TagManager from 'react-gtm-module'
import App from './App'
import { store } from './app/store'
import reportWebVitals from './reportWebVitals'

const tagManagerArgs = {
  gtmId: 'GTM-NFMC9GL',
}
TagManager.initialize(tagManagerArgs)

const container = document.getElementById('root')!
const root = createRoot(container)
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
