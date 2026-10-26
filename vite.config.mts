// Plugins
import Components from 'unplugin-vue-components/vite'
import Vue from '@vitejs/plugin-vue'
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import ViteFonts from 'unplugin-fonts/vite'
import VueRouter from 'unplugin-vue-router/vite'

// Utilities
import { defineConfig, loadEnv } from 'vite'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // The Split Bill API runs as a separate service (default port 4110).
  // Proxying `/api` keeps the app same-origin in development: no CORS, and no
  // hardcoded backend URL in the browser bundle. Override the target with
  // `VITE_SPLIT_BILL_TARGET` in `.env.local`.
  const splitBillTarget = env.VITE_SPLIT_BILL_TARGET || 'http://localhost:4110'

  return {
    plugins: [
      VueRouter(),
      Vue({
        template: { transformAssetUrls },
      }),
      // https://github.com/vuetifyjs/vuetify-loader/tree/master/packages/vite-plugin#readme
      Vuetify({
        autoImport: true,
        styles: {
          configFile: 'src/styles/settings.scss',
        },
      }),
      Components(),
      ViteFonts({
        google: {
          families: [ {
            name: 'Roboto',
            styles: 'wght@100;300;400;500;700;900',
          }],
        },
      }),
    ],
    define: { 'process.env': {} },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
      extensions: [
        '.js',
        '.json',
        '.jsx',
        '.mjs',
        '.ts',
        '.tsx',
        '.vue',
      ],
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: splitBillTarget,
          changeOrigin: true,
        },
        // Health check, handy for diagnosing a backend that is not running.
        '/health': {
          target: splitBillTarget,
          changeOrigin: true,
        },
      },
    },
    css: {
      preprocessorOptions: {
        sass: {
          api: 'modern-compiler',
        },
      },
    },
  }
})
