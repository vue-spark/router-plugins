/// <reference lib="DOM" />
// @vitest-environment happy-dom
import type { ScrollerOptions } from '../scroller'
import { describe, expect, it, vi } from 'vitest'
import { h, nextTick } from 'vue'
import { initRouterFactory, routerBackAsync } from '../../__tests__/utils'
import NavigationDirectionPlugin from '../navigation-direction'
import ScrollerPlugin from '../scroller'

describe('scrollerPlugin', () => {
  const initRouter = initRouterFactory<ScrollerOptions>({
    routes: [
      {
        path: '/',
        component: { render: () => h('div', { style: { height: '200vh' } }, 'root') },
      },
      {
        path: '/home',
        component: { render: () => h('div', { style: { height: '200vh' } }, 'home') },
      },
    ],
    plugins: (router, options = {}) => {
      NavigationDirectionPlugin(router)
      ScrollerPlugin(router, { selectors: { window: true }, ...options })
    },
  })

  it('should expose scroller object with reactive properties', async () => {
    const router = await initRouter()
    expect(router.scroller).toBeDefined()
    expect(router.scroller.isAuto).toBeDefined()
    expect(router.scroller.positionsMap).toBeInstanceOf(Map)
  })

  it('should capture scroll positions on navigation', async () => {
    const router = await initRouter()

    window.scrollTo(0, 100)

    await router.push('/home')

    const savedPositions = router.scroller.positionsMap.get('/')!
    expect(savedPositions.window).toEqual({ left: 0, top: 100 })
  })

  it('should restore scroll positions on back navigation', async () => {
    const router = await initRouter()

    window.scrollTo(0, 150)

    await router.push('/home')
    await routerBackAsync(router)
    await nextTick()

    expect(window.scrollY).toBe(150)
  })

  it('should handle scroll handlers', async () => {
    const customHandler = vi.fn().mockReturnValue({ top: 200 })
    const router = await initRouter({
      selectors: {
        window: customHandler,
      },
    })

    window.scrollTo({ top: 500 })

    await router.push('/home')
    await routerBackAsync(router)

    expect(customHandler).toHaveBeenCalled()
    expect(window.scrollY).toBe(200)
  })

  it('should respect scrollOnlyBackward option', async () => {
    const router = await initRouter({
      scrollOnlyBackward: true,
    })

    window.scrollTo(0, 200)
    await router.push('/home')

    window.scrollTo(0, 500)
    await routerBackAsync(router)
    await nextTick()

    expect(window.scrollY).toBe(200)

    await router.push('/home')
    await nextTick()

    expect(window.scrollY).toBe(0)
  })
})
