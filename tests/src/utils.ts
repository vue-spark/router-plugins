import type { FunctionRouterPlugin } from '@src/plugin'
import type { Router, RouteRecordRaw } from 'vue-router'
import { h, nextTick } from 'vue'
import { createMemoryHistory, createRouter, START_LOCATION } from 'vue-router'

export function initRouterFactory<Options = never>({
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
  plugins,
}: {
  routes?: RouteRecordRaw[]
  plugins?: FunctionRouterPlugin[] | ((router: Router, options?: Options) => void)
} = {}) {
  return async (options?: Options) => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes,
    })

    // Because memoryHistory doesn't initialize the jump,
    // we need to manually push it once
    await router.push('/')

    if (plugins) {
      if (typeof plugins === 'function') {
        plugins(router, options)
      }
      else {
        plugins.forEach(p => p(router, options))
      }
    }

    return router
  }
}

export async function mockRouterUninstall(router: Router): Promise<void> {
  router.currentRoute.value = START_LOCATION
  await nextTick()
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
