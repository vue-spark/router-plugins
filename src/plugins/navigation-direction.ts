import type { ShallowRef } from 'vue'
import type * as VueRouter from 'vue-router'
import type { RouterPlugin } from '../plugin'
import { onScopeDispose, shallowRef } from 'vue'
import { onRouterUninstall } from '../hooks/on-router-uninstall'
import { definePlugin } from '../plugin'

export type NavigationDirectionResolver = (ctx: {
  to: VueRouter.RouteLocationNormalizedGeneric
  from: VueRouter.RouteLocationNormalizedGeneric
  delta: number
}) => NavigationDirection

export type NavigationDirectionCallback = (
  direction: NavigationDirection,
  to: VueRouter.RouteLocationNormalizedGeneric,
  from: VueRouter.RouteLocationNormalizedGeneric,
) => void

export interface INavigationDirection {
  currentDirection: ShallowRef<NavigationDirection | undefined>
  listen: (callback: NavigationDirectionCallback) => () => void
}

export interface NavigationDirectionOptions {
  directionResolver?: NavigationDirectionResolver
}

export enum NavigationDirection {
  forward = 'forward',
  backward = 'backward',
  unchanged = 'unchanged',
}

const defaultDirectionResolver: NavigationDirectionResolver = ({ delta }) => {
  return delta
    ? delta > 0
      ? NavigationDirection.forward
      : NavigationDirection.backward
    : NavigationDirection.unchanged
}

const NavigationDirectionPlugin: RouterPlugin<[NavigationDirectionOptions?]> =
  /* @__PURE__ */ definePlugin((router, options = {}) => {
    const { directionResolver = defaultDirectionResolver } = options
    const routerHistory = router.options.history
    const currentDirection = shallowRef<NavigationDirection>()
    const listeners = new Set<NavigationDirectionCallback>()

    let historyReplaced = false
    const { push: originalPush, replace: originalReplace } = routerHistory
    routerHistory.push = (...args) => {
      historyReplaced = false
      return originalPush.apply(routerHistory, args)
    }
    routerHistory.replace = (...args) => {
      historyReplaced = true
      return originalReplace.apply(routerHistory, args)
    }

    let historyDelta: number | null = null
    const removeHistoryListener = routerHistory.listen((_, __, information) => {
      if (!router.listening) return
      historyDelta = information.delta
    })

    const removeRouterGuard = router.afterEach((to, from, failure) => {
      try {
        if (failure) return

        // 优先以 historyDelta 为准，其次可以根据 historyReplaced 判断是否为替换路由
        const delta = historyDelta ?? (historyReplaced ? 0 : 1)
        const direction = (currentDirection.value = directionResolver({ to, from, delta }))
        listeners.forEach(listener => listener(direction, to, from))
      }
      finally {
        historyDelta = null
      }
    })

    const removeListener = (callback: NavigationDirectionCallback): void => {
      listeners.delete(callback)
    }
    const addListener = (callback: NavigationDirectionCallback): (() => void) => {
      listeners.add(callback)
      onScopeDispose(() => removeListener(callback), true)
      return () => {
        removeListener(callback)
      }
    }

    router.navigationDirection = {
      currentDirection,
      listen: addListener,
    }

    onRouterUninstall(router, () => {
      currentDirection.value = undefined
      listeners.clear()
      historyDelta = null
      removeHistoryListener()
      removeRouterGuard()
    })
  })

export { NavigationDirectionPlugin as default, NavigationDirectionPlugin }

declare module 'vue-router' {
  interface Router {
    navigationDirection: INavigationDirection
  }
}
