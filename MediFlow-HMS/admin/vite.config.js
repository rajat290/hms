import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const workspaceRoot = fileURLToPath(new URL('.', import.meta.url))
const sharedDir = path.resolve(workspaceRoot, '../shared')

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': sharedDir,
    },
  },
  server:{
    port:5174,
    fs: {
      allow: [workspaceRoot, sharedDir],
    },
  }
})
