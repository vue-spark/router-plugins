import type { ShallowRef } from 'vue'
import type * as VueRouter from 'vue-router'
import type { RouterPlugin } from '../plugin'
import { shallowRef } from 'vue'
import { onRouterUninstall } from '../hooks/on-router-uninstall'
import { definePlugin } from '../plugin'

export interface PreviousRoute
  extends Readonly<
    Pick<VueRouter.RouteLocationNormalizedLoaded, 'name' | 'path' | 'fullPath' | 'hash'>
  > {}

function pickPreviousRoute(route: VueRouter.RouteLocationNormalizedLoaded): PreviousRoute {
  return Object.freeze({
    name: route.name,
    path: route.path,
    fullPath: route.fullPath,
    hash: route.hash,
  })
}

const PreviousRoutePlugin: RouterPlugin = /* @__PURE__ */ definePlugin((router) => {
  const previousRoute = (router.previousRoute = shallowRef())

  router.afterEach((_, from, failure) => {
    if (failure) return
    previousRoute.value = pickPreviousRoute(from)
  })

  onRouterUninstall(router, () => {
    previousRoute.value = undefined
  })
})

export default PreviousRoutePlugin

declare module 'vue-router' {
  interface Router {
    previousRoute: ShallowRef<PreviousRoute | undefined>
  }
}
