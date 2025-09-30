import { defineConfig } from 'vite'

export default defineConfig({
  root: 'docs',
  base: '/novono/',
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
})
