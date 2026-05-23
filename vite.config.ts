import { defineConfig } from 'vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  base: '/NOCTIS/',
  plugins: [
    basicSsl()
  ],
  server: {
    https: true,
    host: true, // Exposes the server on local network IPs as well
    port: 5173  // Standard Vite dev server port
  }
})
