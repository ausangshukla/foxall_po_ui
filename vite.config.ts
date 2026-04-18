import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: mode === 'test' ? {
    // Disable HMR in test mode — each Selenium page visit opens a WebSocket
    // to Vite's HMR server, and when the browser navigates away the connection
    // lingers in CLOSE_WAIT on the Vite process. After enough scenarios the
    // file-descriptor limit is exhausted and the Vite server stops accepting
    // new connections, causing tests to hang.
    hmr: false,
  } : undefined,
}))
