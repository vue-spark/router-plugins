import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'happy-dom',
    alias: {
      '@src': resolve(__dirname, 'src'),
    },
    include: ['tests/**/*.test.ts'],
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['src/types/**', 'src/utils/**'],
    },
  },
})
