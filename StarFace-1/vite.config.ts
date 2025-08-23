
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const port = Number(process.env.PORT) || 5173

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,              // listen on all interfaces
    port,                    // use Replit's PORT (usually 5000)
    strictPort: true,        // fail instead of picking a random port
    hmr: { clientPort: 443 },// HMR over HTTPS in Replit
    allowedHosts: [
      '.repl.co',
      '.replit.dev',
      // you can also paste the exact host shown in the error:
      // '37c3e598-73f6-45c3-90e3-31d74592185a-00-3gj2y901a89ij.riker.replit.dev'
    ],
  },
  preview: {
    port,
    strictPort: true,
    allowedHosts: ['.repl.co', '.replit.dev'],
  },
})
