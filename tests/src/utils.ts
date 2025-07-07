import type { Router, RouteRecordRaw } from 'vue-router'
import type { RouterPlugin } from 'vue-router-plugin-system'
import { h } from 'vue'
import { createMemoryHistory } from 'vue-router'
import { createRouter } from 'vue-router-plugin-system'

export function initRouterFactory({
  routes = [
    {
      path: '/',
      component: { render: () => h('div', 'root') },
    },
    {
      path: '/home',
      component: { render: () => h('div', 'home') },
    },
  ],
  pluginsFactory = () => [],
}: {
  routes?: RouteRecordRaw[]
  pluginsFactory?: () => RouterPlugin[]
} = {}) {
  return async (plugins = pluginsFactory()) => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes,
      plugins,
    })

    // Because memoryHistory doesn't initialize the jump,
    // we need to manually push it once
    await router.push('/')

    return router
  }
}

export async function routerBackAsync(router: Router): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>()
  const removeRouterGuard = router.afterEach(() => {
    resolve()
    removeRouterGuard()
  })
  router.back()
  await promise
}
