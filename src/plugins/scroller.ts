import type { ShallowReactive } from 'vue'
import type * as VueRouter from 'vue-router'
import type { RouterPlugin, RouterPluginInstall } from 'vue-router-plugin-system'
import type { Awaitable } from '../types'
import { nextTick, shallowReactive } from 'vue'
import { withInstall } from 'vue-router-plugin-system'
import { isBrowser } from '../utils'

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
  router: VueRouter.Router
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
   * 默认的滚动行为
   */
  behavior?: ScrollBehavior
  /**
   * 滚动元素选择器，支持特殊选择器 `window` 和 `document`
   */
  selectors: string[]
  /**
   * 滚动恢复处理函数
   * - 返回 `true` 时使用记录的滚动位置
   * - 返回假值时时跳过本次滚动
   * - 返回 `ScrollPositionCoordinates` 时使用自定义滚动位置
   */
  scrollHandler?: ScrollHandler
}

const DEFAULT_SCROLL_POSITION = {
  top: 0,
  left: 0,
} as const

function querySelector(selector: string): ScrollableElement | null {
  if (!isBrowser) return null

  switch (selector) {
    case 'window': {
      return window
    }
    case 'document': {
      return document.documentElement
    }
    case 'body': {
      return document.body
    }
    default: {
      return document.querySelector(selector)
    }
  }
}

async function traversePositions(
  options: ScrollerOptions,
  callback: (ctx: { selector: string, element: ScrollableElement }) => Awaitable<void>,
): Promise<void> {
  for (const selector of options.selectors) {
    const element = querySelector(selector)
    element && (await callback({ selector, element }))
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
  for (const selector of options.selectors) {
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
    ...ctx
  }: Pick<ScrollHandlerContext, 'router' | 'to' | 'from'> & {
    positions: ScrollPositionCoordinatesGroup | undefined
  },
): Promise<void> {
  await traversePositions(options, async ({ selector, element }) => {
    let pos = positions?.[selector]
    if (options.scrollHandler) {
      const result = await options.scrollHandler({
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

    // pos 没有时滚动行为需要设为 instant
    const behavior = pos ? options.behavior : 'instant'
    element.scrollTo({ ...(pos || DEFAULT_SCROLL_POSITION), behavior })
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

    const removeResolveGuard = router.beforeResolve((_, from) => {
      positionsMap.set(from.fullPath, capturePositions(options))
    })

    const removeAfterGuard = router.afterEach((to, from) => {
      // 需要保证视图挂载完成后才能还原滚动位置
      nextTick(() => {
        const positions = positionsMap.get(to.fullPath)
        applyPositions(options, { router, to, from, positions })
      })
    })

    router.scroller = {
      positionsMap,
      trigger() {
        const route = router.currentRoute.value
        if (!route) return

        const positions = positionsMap.get(route.fullPath)
        traversePositions(options, ({ selector, element }) => {
          element.scrollTo({
            ...(positions?.[selector] || DEFAULT_SCROLL_POSITION),
            behavior: 'instant',
          })
        })
      },
    }

    onUninstall(() => {
      positionsMap.clear()
      removeResolveGuard()
      removeAfterGuard()
    })
  })
}

export { ScrollerPlugin as default, ScrollerPlugin }

declare module 'vue-router' {
  interface Router {
    scroller: Scroller
  }
}
