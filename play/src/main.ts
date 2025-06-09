import RouterPlugins from '@vue-spark/router-plugins'
import { createApp } from 'vue'
import { BetterRouterView } from 'vue-router-better-view'
import App from './App.vue'
import router from './router'
import '@varlet/touch-emulator'
import 'modern-normalize/modern-normalize.css'
import '@varlet/ui/es/style'
import './App.css'

const app = createApp(App)

app
  .use(router)
  .use(RouterPlugins, {
    scroller: {
      selectors: {
        'window': true,
        'body': true,
        '.scrollable': true,
      },
    },
  })
  .use(BetterRouterView)

app.mount('#app')
