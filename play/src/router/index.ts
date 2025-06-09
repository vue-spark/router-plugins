import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
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
