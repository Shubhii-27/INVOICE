import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

let root = null
let rootContainer = null

function renderApp(container) {
  if (!root || rootContainer !== container) {
    root = createRoot(container)
    rootContainer = container
  }

  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}

// WordPress / external embed API
window.InvoiceWidget = {
  init: (target = 'invoice-root') => {
    const container = typeof target === 'string' ? document.getElementById(target) : target

    if (!container) {
      console.error(`InvoiceWidget: container not found ${target}`)
      return
    }

    renderApp(container)
  }
}

// Auto mount for dev (Vite local)
const devRoot = document.getElementById('root')
if (devRoot) {
  renderApp(devRoot)
}