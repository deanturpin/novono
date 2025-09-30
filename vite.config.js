import { defineConfig } from 'vite'
import { copyFileSync } from 'fs'

export default defineConfig({
  root: 'docs',
  base: process.env.NODE_ENV === 'production' ? '/novono/' : '/novono/',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'docs/index.html'
      }
    }
  },
  plugins: [{
    name: 'copy-sw',
    closeBundle() {
      copyFileSync('docs/sw.js', 'dist/sw.js')
    }
  }]
})
