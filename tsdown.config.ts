import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/plugins/*.ts'],
  dts: {
    tsconfig: 'tsconfig.lib.json',
  },
  platform: 'browser',
  unbundle: true,
})
