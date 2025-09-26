import NavigationDirectionPlugin, { NavigationDirection } from '@src/plugins/navigation-direction'
import { describe, expect, it, vi } from 'vitest'
import { initRouterFactory, routerBackAsync } from '../utils'

describe.concurrent('navigationDirectionPlugin', () => {
  const initRouter = initRouterFactory({
    pluginsFactory() {
      return [NavigationDirectionPlugin()]
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

  it('should handle forward direction for replace in MemoryHistory', async () => {
    const router = await initRouter()
    const listener = vi.fn()
    router.navigationDirection.listen(listener)

    await router.replace(`/home?ts=${Date.now()}`)

    // In MemoryHistory, replace operations are detected as forward navigation
    // because historyReplaced is always false and historyDelta is null,
    // resulting in delta = 1 (forward direction)
    expect(router.navigationDirection.currentDirection.value).toBe(NavigationDirection.forward)
    expect(listener).toHaveBeenCalledWith(
      NavigationDirection.forward,
      expect.any(Object),
      expect.any(Object),
    )
  })

  it('should use custom direction resolver', async () => {
    const customResolver = vi.fn().mockReturnValue(NavigationDirection.backward)
    const router = await initRouter([
      NavigationDirectionPlugin({ directionResolver: customResolver }),
    ])

    await router.push('/home')

    expect(customResolver).toHaveBeenCalled()
    expect(router.navigationDirection.currentDirection.value).toBe(NavigationDirection.backward)
  })

  it('should allow custom direction resolver to handle replace as unchanged in MemoryHistory', async () => {
    // Custom resolver that detects replace operations by checking route changes
    const customResolver = vi.fn(({ to, from, delta }) => {
      // In MemoryHistory, we can detect replace by checking if the path changed
      // but we want to treat it as unchanged direction
      if (to.path !== from.path && delta === 1) {
        // This could be a replace operation, treat as unchanged
        return NavigationDirection.unchanged
      }
      return delta > 0 ? NavigationDirection.forward : NavigationDirection.backward
    })

    const router = await initRouter([
      NavigationDirectionPlugin({ directionResolver: customResolver }),
    ])
    const listener = vi.fn()
    router.navigationDirection.listen(listener)

    await router.replace(`/home?ts=${Date.now()}`)

    expect(customResolver).toHaveBeenCalled()
    expect(router.navigationDirection.currentDirection.value).toBe(NavigationDirection.unchanged)
    expect(listener).toHaveBeenCalledWith(
      NavigationDirection.unchanged,
      expect.any(Object),
      expect.any(Object),
    )
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

  it('should detect forward navigation via setNextDirection()', async () => {
    const router = await initRouter()
    const listener = vi.fn()
    router.navigationDirection.listen(listener)

    await router.push('/home')

    router.navigationDirection.setNextDirection(NavigationDirection.forward)

    await routerBackAsync(router)

    expect(router.navigationDirection.currentDirection.value).toBe(NavigationDirection.forward)
    expect(listener).toHaveBeenCalledWith(
      NavigationDirection.forward,
      expect.any(Object),
      expect.any(Object),
    )
  })
})
