import HistoryStatePlugin from '@vue-spark/router-plugins/history-state'
import IsNavigatingPlugin from '@vue-spark/router-plugins/is-navigating'
import NavigationDirectionPlugin from '@vue-spark/router-plugins/navigation-direction'
import PreviousRoutePlugin from '@vue-spark/router-plugins/previous-route'
import ScrollerPlugin from '@vue-spark/router-plugins/scroller'
import { createWebHistory } from 'vue-router'
import { createRouter } from 'vue-router-plugin-system'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  plugins: [
    HistoryStatePlugin(),
    IsNavigatingPlugin(),
    NavigationDirectionPlugin(),
    PreviousRoutePlugin(),
    ScrollerPlugin({
      selectors: {
        'window': true,
        '.scrollable': true,
      },
    }),
  ],
  routes: [
    {
      path: '/',
      redirect: '/home',
    },
    {
      path: '/home',
      component: () => import('@/views/home.vue'),
      meta: {
        title: '首页',
        tabBar: true,
        icon: 'home',
      },
    },
    {
      path: '/collection',
      component: () => import('@/views/collection.vue'),
      meta: {
        title: '收藏',
        tabBar: true,
        icon: 'heart',
      },
    },
    {
      path: '/mine',
      component: () => import('@/views/mine.vue'),
      meta: {
        title: '我的',
        tabBar: true,
        icon: 'account-circle',
      },
    },
    {
      path: '/code-preview',
      component: () => import('@/views/code-preview.vue'),
      meta: {
        title: '代码示例',
        tabBar: true,
        icon: 'code-json',
      },
    },

    {
      path: '/set-count',
      component: () => import('@/views/set-count.vue'),
      meta: {
        title: '设置计数器',
      },
    },
    {
      path: '/signature-pad',
      component: () => import('@/views/signature-pad.vue'),
      meta: {
        title: '签名板',
      },
    },
  ],
})

export default router
