import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/list',
      children: [
        {
          path: '/list',
          component: () => import('@/views/list.vue'),
        },
        {
          path: '/list/detail',
          component: () => import('@/views/detail.vue'),
        },
      ],
    },
  ],
})

export default router
