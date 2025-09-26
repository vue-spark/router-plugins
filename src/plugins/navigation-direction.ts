import type { ShallowRef } from 'vue'
import type * as VueRouter from 'vue-router'
import type { RouterPlugin, RouterPluginInstall } from 'vue-router-plugin-system'
import { onScopeDispose, shallowRef } from 'vue'
import { withInstall } from 'vue-router-plugin-system'

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
  /**
   * 当前导航方向，即最后一次导航方向
   */
  currentDirection: ShallowRef<NavigationDirection>
  /**
   * 设置下次导航方向，将会在下次导航成功时生效，导航失败时需要重新设置
   */
  setNextDirection: (direction: NavigationDirection) => void
  /**
   * 监听导航方向变化，会在 {@link onScopeDispose `onScopeDispose`} 时自动移除回调
   */
  listen: (callback: NavigationDirectionCallback) => () => void
}

export interface NavigationDirectionOptions {
  /**
   * 导航方向解析器
   */
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

function NavigationDirectionPlugin(
  options: NavigationDirectionOptions = {},
): RouterPlugin & RouterPluginInstall {
  return withInstall(({ router, onUninstall }) => {
    const { directionResolver = defaultDirectionResolver } = options
    const routerHistory = router.options.history
    const currentDirection = shallowRef<NavigationDirection>(NavigationDirection.unchanged)
    const listeners = new Set<NavigationDirectionCallback>()

    const { push: originalPush, replace: originalReplace } = routerHistory

    routerHistory.originalPush = originalPush
    routerHistory.originalReplace = originalReplace

    // router.push 和 router.replace 在非 MemoryHistory 时会更新 history.state.replaced 属性，
    // MemoryHistory 时固定为 false，这里可以通过其感知是否为替换模式
    let historyReplaced: boolean = false
    routerHistory.push = (...args) => {
      try {
        return originalPush.apply(routerHistory, args)
      }
      finally {
        historyReplaced = (routerHistory.state.replaced as boolean | null) ?? false
      }
    }
    routerHistory.replace = (...args) => {
      try {
        return originalReplace.apply(routerHistory, args)
      }
      finally {
        historyReplaced = (routerHistory.state.replaced as boolean | null) ?? false
      }
    }

    // routerHistory.listen 可以监听浏览器的前进后退，提供的 information.delta 可以用于判断方向
    let historyDelta: number | null = null
    const removeHistoryListener = routerHistory.listen((_, __, information) => {
      if (!router.listening) return
      historyDelta = information.delta
    })

    // 特殊场景下可能需要预设下次的导航方向，这里提供的 setNextDirection 可以实现此类需求
    let nextDirection: NavigationDirection | null = null
    const setNextDirection = (direction: NavigationDirection): void => {
      nextDirection = direction
    }

    // 由于 beforeEach 和 beforeResolve 都可能被取消或重定向，这里只能在导航成功后才可以进行方向解析
    const removeRouterGuard = router.afterEach((to, from, failure) => {
      try {
        if (failure) return

        // 优先以 historyDelta 为准，其次可以根据 historyReplaced 判断是否为替换路由
        const delta = historyDelta ?? (historyReplaced ? 0 : 1)
        // 若设置了 nextDirection 则跳过本次的方向解析
        const finalDirection = nextDirection ?? directionResolver({ to, from, delta })
        const direction = (currentDirection.value = finalDirection)
        listeners.forEach(listener => listener(direction, to, from))
      }
      finally {
        // 不论导航成功还是失败，都需要重置这些数据
        historyDelta = null
        historyReplaced = false
        nextDirection = null
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
      setNextDirection,
      listen: addListener,
    }

    onUninstall(() => {
      currentDirection.value = NavigationDirection.unchanged
      listeners.clear()
      historyDelta = null
      nextDirection = null
      removeHistoryListener()
      removeRouterGuard()
    })
  })
}

export { NavigationDirectionPlugin as default, NavigationDirectionPlugin }

declare module 'vue-router' {
  interface Router {
    navigationDirection: INavigationDirection
  }

  interface RouterHistory {
    /**
     * @deprecated
     */
    originalPush: RouterHistory['push']
    /**
     * @deprecated
     */
    originalReplace: RouterHistory['replace']
  }
}
