import type { ShallowRef } from 'vue'
import type * as VueRouter from 'vue-router'
import type { RouterPlugin } from '../plugin'
import type { Awaitable, SetRequired } from '../types'
import { nextTick, shallowReactive, shallowRef } from 'vue'
import { onRouterUninstall } from '../hooks/on-router-uninstall'
import { definePlugin } from '../plugin'
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
  direction: NavigationDirection
  savedPosition: ScrollPositionCoordinates | undefined
}

export interface ScrollHandler {
  (ctx: ScrollHandlerContext): Awaitable<ScrollPositionCoordinates | boolean | void>
}

export interface Scroller {
  positionsMap: Map<string, ScrollPositionCoordinatesGroup>
  isAuto: ShallowRef<boolean>
  trigger: () => void
}

export interface ScrollerOptions {
  /**
   * Auto collect scroll position
   * @default true
   */
  autoCollect?: boolean
  /**
   * Scroll selectors
   * @default
   * ```ts
   * { window: true, body: true }
   * ```
   */
  selectors?: Record<string, boolean | ScrollHandler>
  behavior?: ScrollBehavior
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
  options: SetRequired<ScrollerOptions, 'selectors'>,
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

function capturePositions(
  options: SetRequired<ScrollerOptions, 'selectors'>,
): ScrollPositionCoordinatesGroup {
  const pos: ScrollPositionCoordinatesGroup = {}
  for (const selector of Object.keys(options.selectors)) {
    const el = querySelector(selector)
    if (!el) continue

    pos[selector] = getScrollPosition(el)
  }
  return pos
}

async function applyPositions(
  options: SetRequired<ScrollerOptions, 'selectors'>,
  {
    positions,
    ...ctx
  }: Pick<ScrollHandlerContext, 'to' | 'from' | 'direction'> & {
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
    else if (handler === true) {
      if (options.scrollOnlyBackward && ctx.direction !== NavigationDirection.backward) {
        pos = undefined
      }
    }

    const behavior = pos ? options.behavior : 'instant'
    pos ||= { top: 0, left: 0 }
    element.scrollTo({ ...pos, behavior })
  })
}

const ScrollerPlugin: RouterPlugin<[ScrollerOptions?]> = /* @__PURE__ */ definePlugin(
  (router, userOptions = {}) => {
    if (router.options.scrollBehavior) {
      console.warn(
        '`scrollBehavior` options in Vue Router is overwritten by `ScrollerPlugin`, you can remove it from createRouter()',
      )
    }

    router.options.scrollBehavior = () => {}

    const { autoCollect = true, selectors = { window: true, body: true } } = userOptions
    const options = { ...userOptions, autoCollect, selectors }
    const positionsMap = shallowReactive(new Map<string, ScrollPositionCoordinatesGroup>())
    const isAuto = shallowRef(autoCollect)

    const routerHistory = router.options.history
    const removeRouterGuard = router.beforeResolve((to, from) => {
      if (!isAuto.value) return

      // `beforeResolve` is also called when going back in history, we ignores it
      if (routerHistory.state.current === to.fullPath) return

      positionsMap.set(from.fullPath, capturePositions(options))
    })

    const removeDirectionListener = router.navigationDirection.listen((direction, to, from) => {
      if (!isAuto.value) return

      const positions = positionsMap.get(to.fullPath)
      nextTick(() => applyPositions(options, { to, from, direction, positions }))
    })

    router.scroller = {
      isAuto,
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

    onRouterUninstall(router, () => {
      positionsMap.clear()
      removeRouterGuard()
      removeDirectionListener()
    })
  },
)

export { ScrollerPlugin as default, ScrollerPlugin }

declare module 'vue-router' {
  interface Router {
    scroller: Scroller
  }
}
