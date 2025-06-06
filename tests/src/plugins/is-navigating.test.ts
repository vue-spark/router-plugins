import IsNavigatingPlugin from '@src/plugins/is-navigating'
import { describe, expect, it } from 'vitest'
import { initRouterFactory } from '../utils'

describe.concurrent('isNavigatingPlugin', () => {
  const initRouter = initRouterFactory({ plugins: [IsNavigatingPlugin] })

  it('should expose isNavigating as a shallow ref', async () => {
    const router = await initRouter()
    expect(router.isNavigating).toBeDefined()
    expect(router.isNavigating.value).toBe(false)
  })

  it('should set isNavigating to true during navigation', async () => {
    const router = await initRouter()

    router.beforeEach((_, __, next) => {
      expect(router.isNavigating.value).toBe(true)
      next()
    })

    router.afterEach(() => {
      expect(router.isNavigating.value).toBe(false)
    })

    await router.push('/home')
  })

  it('should handle interrupted navigation', async () => {
    const router = await initRouter()

    router.beforeEach(() => {
      expect(router.isNavigating.value).toBe(true)
      // Interrupt navigation
      return false
    })

    router.afterEach(() => {
      expect(router.isNavigating.value).toBe(false)
    })

    await router.push('/home')
  })

  it('should handle multiple navigation guards', async () => {
    const router = await initRouter()
    let count = 0

    router.beforeEach(() => {
      count++
      expect(router.isNavigating.value).toBe(true)
    })

    router.beforeEach(() => {
      count++
      expect(router.isNavigating.value).toBe(true)
    })

    await router.push('/home')
    expect(count).toBe(2)
    expect(router.isNavigating.value).toBe(false)
  })
})
