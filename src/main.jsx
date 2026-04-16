import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

window.MyReactApp = {
  init: function (containerId) {
    const container = document.getElementById(containerId);

    if (!container) {
      console.error("Container not found:", containerId);
      return;
    }

    const root = ReactDOM.createRoot(container);
    root.render(<App />);
  }
};
