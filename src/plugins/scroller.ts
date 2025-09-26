import type { ShallowReactive } from 'vue'
import type * as VueRouter from 'vue-router'
import type { RouterPlugin, RouterPluginInstall } from 'vue-router-plugin-system'
import type { Awaitable } from '../types'
import type { INavigationDirection } from './navigation-direction'
import { nextTick, shallowReactive } from 'vue'
import { withInstall } from 'vue-router-plugin-system'
import { isFunction } from '../utils'
import { NavigationDirection } from './navigation-direction'

/**
 * Scroll position similar to
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/ScrollToOptions | `ScrollToOptions`}.
 * Note that not all browsers support `behavior`.
 */
export interface ScrollPositionCoordinates {
  left?: number
  top?: number
}

export type ScrollPositionCoordinatesGroup = Record<string, ScrollPositionCoordinates>

export type ScrollableElement = Element | Window

export interface ScrollHandlerContext {
  to: VueRouter.RouteLocationNormalized
  from: VueRouter.RouteLocationNormalized
  element: ScrollableElement
  selector: string
  savedPosition: ScrollPositionCoordinates | undefined
}

export interface ScrollHandler {
  (ctx: ScrollHandlerContext): Awaitable<ScrollPositionCoordinates | boolean | void>
}

export interface Scroller {
  /**
   * 滚动位置记录
   */
  positionsMap: ShallowReactive<Map<string, ScrollPositionCoordinatesGroup>>
  /**
   * 手动触发当前路由的滚动位置还原，适用于 `Transition` 组件动画结束后进行调用
   */
  trigger: () => void
}

export interface ScrollerOptions {
  /**
   * 滚动元素选择器，支持特殊选择器 `window`
   */
  selectors: Record<string, boolean | ScrollHandler>
  /**
   * 滚动行为
   */
  behavior?: ScrollBehavior
  /**
   * 仅当导航后退时还原滚动位置，适合移动端页面
   *
   * **注意：该功能依赖于 `NavigationDirectionPlugin`，若没有安装则无效！**
   */
  scrollOnlyBackward?: boolean
}

function querySelector(selector: string): ScrollableElement | null {
  if (typeof window === 'undefined') return null
  const document = window.document
  if (selector === 'body') return document.body
  if (selector === 'window') return window
  return document.querySelector(selector)
}

async function traversePositions(
  options: ScrollerOptions,
  callback: (ctx: {
    selector: string
    handler: boolean | ScrollHandler
    element: ScrollableElement
  }) => Awaitable<void>,
): Promise<void> {
  for (const [selector, handler] of Object.entries(options.selectors)) {
    const element = querySelector(selector)
    element && (await callback({ selector, handler, element }))
  }
}

function getScrollPosition(el: ScrollableElement): ScrollPositionCoordinates {
  if (el === window || el instanceof Window) {
    return { left: el.scrollX, top: el.scrollY }
  }
  return { left: el.scrollLeft, top: el.scrollTop }
}

function capturePositions(options: ScrollerOptions): ScrollPositionCoordinatesGroup {
  const pos: ScrollPositionCoordinatesGroup = {}
  for (const selector of Object.keys(options.selectors)) {
    const el = querySelector(selector)
    if (!el) continue

    pos[selector] = getScrollPosition(el)
  }
  return pos
}

async function applyPositions(
  options: ScrollerOptions,
  {
    positions,
    direction,
    ...ctx
  }: Pick<ScrollHandlerContext, 'to' | 'from'> & {
    direction: NavigationDirection | undefined
    positions: ScrollPositionCoordinatesGroup | undefined
  },
): Promise<void> {
  await traversePositions(options, async ({ selector, handler, element }) => {
    let pos = positions?.[selector]
    if (isFunction(handler)) {
      const result = await handler({
        ...ctx,
        selector,
        element,
        savedPosition: pos,
      })
      if (!result) return

      if (result !== true) {
        pos = result
      }
    }
    // 开启 scrollOnlyBackward 时，导航不是 NavigationDirection.backward 时需要清除位置记录
    else if (
      handler &&
      direction &&
      options.scrollOnlyBackward &&
      direction !== NavigationDirection.backward
    ) {
      pos = undefined
    }

    if (!handler) return

    // pos 没有时滚动行为需要设为 instant
    const behavior = pos ? options.behavior : 'instant'
    pos ||= { top: 0, left: 0 }
    element.scrollTo({ ...pos, behavior })
  })
}

function ScrollerPlugin(options: ScrollerOptions): RouterPlugin & RouterPluginInstall {
  return withInstall(({ router, onUninstall }) => {
    if (router.options.scrollBehavior) {
      console.warn(
        '`scrollBehavior` options in Vue Router is overwritten by `ScrollerPlugin`, you can remove it from createRouter()',
      )
    }

    router.options.scrollBehavior = () => {}

    const positionsMap = shallowReactive(new Map<string, ScrollPositionCoordinatesGroup>())

    const removeRouterResolveGuard = router.beforeResolve((_, from) => {
      positionsMap.set(from.fullPath, capturePositions(options))
    })

    const removeRouterAfterGuard = router.afterEach((to, from) => {
      // 需要保证视图挂载完成后才能还原滚动位置
      nextTick(() => {
        const positions = positionsMap.get(to.fullPath)
        const navigationDirection: INavigationDirection | undefined = router.navigationDirection
        const direction = navigationDirection && navigationDirection.currentDirection.value
        applyPositions(options, { to, from, direction, positions })
      })
    })

    router.scroller = {
      positionsMap,
      trigger() {
        const route = router.currentRoute.value
        if (!route) return

        const positions = positionsMap.get(route.fullPath)
        if (positions) {
          traversePositions(options, ({ selector, element }) => {
            const pos = positions[selector]
            element.scrollTo({ ...pos, behavior: 'instant' })
          })
        }
      },
    }

    onUninstall(() => {
      positionsMap.clear()
      removeRouterResolveGuard()
      removeRouterAfterGuard()
    })
  })
}

export { ScrollerPlugin as default, ScrollerPlugin }

declare module 'vue-router' {
  interface Router {
    scroller: Scroller
  }
}
