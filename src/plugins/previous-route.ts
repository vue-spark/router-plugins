import type { ShallowRef } from 'vue'
import type * as VueRouter from 'vue-router'
import type { RouterPlugin } from 'vue-router-plugin-system'
import { shallowRef } from 'vue'

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

function PreviousRoutePlugin(): RouterPlugin {
  return ({ router, onUninstall }) => {
    const previousRoute = (router.previousRoute = shallowRef())

    router.afterEach((_, from, failure) => {
      if (failure) return
      previousRoute.value = pickPreviousRoute(from)
    })

    onUninstall(() => {
      previousRoute.value = undefined
    })
  }
}

export { PreviousRoutePlugin as default, PreviousRoutePlugin }

declare module 'vue-router' {
  interface Router {
    previousRoute: ShallowRef<PreviousRoute | undefined>
  }
}
