import { createApp } from 'vue'
import { BetterRouterView } from 'vue-router-better-view'
import App from './App.vue'
import router from './router'
import '@varlet/touch-emulator'
import 'modern-normalize/modern-normalize.css'
import '@varlet/ui/es/style'
import './main.css'

const app = createApp(App)

app.use(router).use(BetterRouterView)

app.mount('#app')
