import type { NavigationDirectionOptions } from '@src/plugins/navigation-direction'
import NavigationDirectionPlugin, { NavigationDirection } from '@src/plugins/navigation-direction'
import { describe, expect, it, vi } from 'vitest'
import { initRouterFactory, routerBackAsync } from '../utils'

describe.concurrent('navigationDirectionPlugin', () => {
  const initRouter = initRouterFactory<NavigationDirectionOptions>({
    plugins: (router, options) => {
      NavigationDirectionPlugin(router, options)
    },
  })

  it('should expose navigationDirection API', async () => {
    const router = await initRouter()
    expect(router.navigationDirection).toBeDefined()
    expect(router.navigationDirection.currentDirection).toBeDefined()
    expect(typeof router.navigationDirection.listen).toBe('function')
  })

  it('should detect forward navigation', async () => {
    const router = await initRouter()
    const listener = vi.fn()
    router.navigationDirection.listen(listener)

    await router.push('/home')

    expect(router.navigationDirection.currentDirection.value).toBe(NavigationDirection.forward)
    expect(listener).toHaveBeenCalledWith(
      NavigationDirection.forward,
      expect.any(Object),
      expect.any(Object),
    )
  })

  it('should detect backward navigation', async () => {
    const router = await initRouter()
    const listener = vi.fn()
    router.navigationDirection.listen(listener)

    await router.push('/home')
    await routerBackAsync(router)

    expect(router.navigationDirection.currentDirection.value).toBe(NavigationDirection.backward)
    expect(listener).toHaveBeenCalledWith(
      NavigationDirection.backward,
      expect.any(Object),
      expect.any(Object),
    )
  })

  it('should handle unchanged direction for replace', async () => {
    const router = await initRouter()
    const listener = vi.fn()
    router.navigationDirection.listen(listener)

    await router.replace(`/home?ts=${Date.now()}`)

    expect(router.navigationDirection.currentDirection.value).toBe(NavigationDirection.unchanged)
    expect(listener).toHaveBeenCalledWith(
      NavigationDirection.unchanged,
      expect.any(Object),
      expect.any(Object),
    )
  })

  it('should use custom direction resolver', async () => {
    const customResolver = vi.fn().mockReturnValue(NavigationDirection.backward)
    const router = await initRouter({ directionResolver: customResolver })

    await router.push('/home')

    expect(customResolver).toHaveBeenCalled()
    expect(router.navigationDirection.currentDirection.value).toBe(NavigationDirection.backward)
  })

  it('should handle multiple listeners', async () => {
    const router = await initRouter()
    const listener1 = vi.fn()
    const listener2 = vi.fn()

    router.navigationDirection.listen(listener1)
    router.navigationDirection.listen(listener2)

    await router.push('/home')

    expect(listener1).toHaveBeenCalled()
    expect(listener2).toHaveBeenCalled()
  })
})
