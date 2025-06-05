import RouterPlugins from '@vue-spark/router-plugins'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import 'modern-normalize/modern-normalize.css'
import 'element-plus/theme-chalk/index.css'
import 'plus-pro-components/theme-chalk/index.css'

const app = createApp(App)

app.use(router).use(RouterPlugins)

app.mount('#app')
