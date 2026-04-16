import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    lib: {
      entry: 'src/main.jsx',
      name: 'InvoiceWidget',
      fileName: (format) => `invoice-widget.${format}.js`
    },
    rollupOptions: {
      external: [],
    }
  }
})