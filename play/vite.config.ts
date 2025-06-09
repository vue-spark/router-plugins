import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { VarletUIResolver } from 'unplugin-vue-components/resolvers'
import vueComponents from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/router-plugins/',
  server: {
    host: true,
  },
  css: {
    transformer: 'lightningcss',
  },
  plugins: [
    vue(),
    vueJsx(),
    vueComponents({
      dts: 'src/types/components.d.ts',
      resolvers: [VarletUIResolver({ importStyle: false })],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
