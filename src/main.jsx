import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

import { register } from 'register-service-worker'

register(`/service-worker.js`, {
  ready() {
    console.log('App is being served from cache by a service worker.')
  },
  registered() {
    console.log('Service worker has been registered.')
  },
})