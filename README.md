# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Embedding in WordPress

This project now builds as a UMD widget and exposes `window.InvoiceWidget.init()`.

1. Run `npm run build`.
2. Upload the generated `dist/invoice-widget.umd.js` and `dist/invoice-widget.css` files to your WordPress server or media library.
3. Add a container element in your WordPress page/post where you want the widget to appear:

   ```html
   <div id="invoice-root"></div>
   ```

4. Load the widget script and initialize it after the container is available:

   ```html
   <script src="/path/to/invoice-widget.umd.js" defer></script>
   <link rel="stylesheet" href="/path/to/style.css" />
   <script>
     document.addEventListener('DOMContentLoaded', function() {
       window.InvoiceWidget.init('invoice-root')
     })
   </script>
   ```

If you prefer an iframe embed, create a simple static HTML page that includes the widget and embed that page via WordPress iframe shortcode or block.
