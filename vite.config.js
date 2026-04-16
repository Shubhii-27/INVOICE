import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    cssCodeSplit: false,
    lib: {
      entry: 'src/main.jsx',
      name: 'InvoiceWidget',
      formats: ['umd'],
      fileName: () => `invoice-widget.umd.js`
    },
    rollupOptions: {
      external: [],
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'invoice-widget.css'
          }
          return assetInfo.name || '[name].[ext]'
        }
      }
    }
  }
})