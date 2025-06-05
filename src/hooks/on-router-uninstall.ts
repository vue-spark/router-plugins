import type * as VueRouter from 'vue-router'
import { nextTick, watch } from 'vue'
import { START_LOCATION } from 'vue-router'

type UninstallHandler = () => void
const routers = new WeakMap<VueRouter.Router, Set<UninstallHandler>>()

export function onRouterUninstall(router: VueRouter.Router, handler: UninstallHandler): void {
  if (!routers.has(router)) {
    routers.set(router, new Set())

    const handleUninstall = (): void => {
      routers.get(router)?.forEach(handler => handler())
      routers.delete(router)
    }

    router
      .isReady()
      .then(() => {
        const stop = watch(router.currentRoute, (route) => {
          if (route === START_LOCATION) {
            nextTick(() => stop())
            handleUninstall()
          }
        })
      })
      .catch(handleUninstall)
  }

  routers.get(router)?.add(handler)
}
