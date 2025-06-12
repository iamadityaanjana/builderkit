import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import rollupNodePolyFill from 'rollup-plugin-node-polyfills';
// https://vite.dev/config/


export default defineConfig({
  plugins: [react(),tailwindcss()],
  resolve: {
    alias: {
      buffer: 'buffer'
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      },
      plugins: [NodeGlobalsPolyfillPlugin({ buffer: true })]
    }
  },
  build: {
    rollupOptions: {
      plugins: [rollupNodePolyFill() as any]
    },
    commonjsOptions: {
      transformMixedEsModules: true
    }
  }
});
