import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

function renderApp(container) {
  const root = createRoot(container)

  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}

// WordPress / external embed API
window.InvoiceWidget = {
  init: (id = 'invoice-root') => {
    const el = document.getElementById(id)

    if (!el) {
      console.error(`InvoiceWidget: container not found #${id}`)
      return
    }

    renderApp(el)
  }
}

// Auto mount for dev (Vite local)
const devRoot = document.getElementById('root')
if (devRoot) {
  renderApp(devRoot)
}