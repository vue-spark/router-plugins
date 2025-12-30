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

/**
 * 从 routerHistory.state 中获取 position 值
 * vue-router 的 createWebHistory/createWebHashHistory 会在 state 中维护 position
 */
function getStatePosition(routerHistory: VueRouter.RouterHistory): number | null {
  const position = routerHistory.state?.position
  return typeof position === 'number' ? position : null
}

function NavigationDirectionPlugin(
  options: NavigationDirectionOptions = {},
): RouterPlugin & RouterPluginInstall {
  return withInstall(({ router, onUninstall }) => {
    const { directionResolver = defaultDirectionResolver } = options
    const routerHistory = router.options.history
    const currentDirection = shallowRef<NavigationDirection>(NavigationDirection.unchanged)
    const listeners = new Set<NavigationDirectionCallback>()
    const cleanupFns = new Set<() => void>()

    const { push: originalPush, replace: originalReplace } = routerHistory
    routerHistory.originalPush = originalPush.bind(routerHistory)
    routerHistory.originalReplace = originalReplace.bind(routerHistory)

    // 允许手动覆盖下次导航方向
    let nextDirection: NavigationDirection | null = null
    const setNextDirection = (direction: NavigationDirection): void => {
      nextDirection = direction
    }

    // routerHistory.listen 监听浏览器的 popstate 事件（前进/后退）
    // information.delta 提供方向信息：正数 = 前进，负数 = 后退
    // 这是检测 back/forward 的唯一可靠方式
    let historyDelta: number | null = null
    cleanupFns.add(
      routerHistory.listen((_, __, information) => {
        if (!router.listening) return
        historyDelta = information.delta
      }),
    )

    // 跟踪导航前的 position 值
    // vue-router 在 state 中维护 position：
    // - push: position + 1
    // - replace: position 不变
    // - back/forward: 通过 popstate 的 delta 检测
    let positionBeforeNavigation: number | null = null
    cleanupFns.add(
      router.beforeEach(() => {
        positionBeforeNavigation = getStatePosition(routerHistory)
      }),
    )

    // 在导航成功后进行方向解析
    // beforeEach/beforeResolve 可能被取消或重定向，所以只能在 afterEach 中处理
    cleanupFns.add(
      router.afterEach((to, from, failure) => {
        try {
          if (failure) return

          // 使用以下优先级计算 delta：
          // 1. historyDelta（来自 popstate）- 检测 back/forward，最可靠
          // 2. position 差值 - 检测 push vs replace
          // 3. 回退到 forward - 用于无法确定的情况
          let delta: number

          if (historyDelta !== null) {
            // 优先级 1：使用 popstate 事件的 delta
            // 这是检测 back/forward 导航方向的唯一可靠方式
            delta = historyDelta
          }
          else if (positionBeforeNavigation !== null) {
            // 优先级 2：比较导航前后的 position
            // - position 增加：push 操作（前进方向）
            // - position 不变：replace 操作（unchanged 方向）
            const positionAfter = getStatePosition(routerHistory)
            if (positionAfter !== null) {
              const positionDelta = positionAfter - positionBeforeNavigation
              // positionDelta > 0 表示 push，= 0 表示 replace
              // 注意：back/forward 不会走到这里（会被 historyDelta 捕获）
              delta = positionDelta > 0 ? 1 : 0
            }
            else {
              // position 不可用，回退到 forward
              delta = 1
            }
          }
          else {
            // 优先级 3：回退处理
            // 当无法获取 position 时（如 SSR 或初始化阶段），默认为 forward
            delta = 1
          }

          // 应用 nextDirection 覆盖（如果设置了的话），否则使用 resolver
          const finalDirection = nextDirection ?? directionResolver({ to, from, delta })
          const direction = (currentDirection.value = finalDirection)
          listeners.forEach(listener => listener(direction, to, from))
        }
        finally {
          // 无论成功还是失败，都重置跟踪状态
          historyDelta = null
          positionBeforeNavigation = null
          nextDirection = null
        }
      }),
    )

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
      positionBeforeNavigation = null
      nextDirection = null
      cleanupFns.forEach(fn => fn())
      cleanupFns.clear()
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
