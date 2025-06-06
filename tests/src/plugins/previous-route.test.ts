import PreviousRoutePlugin from '@src/plugins/previous-route'
import { describe, expect, it } from 'vitest'
import { initRouterFactory } from '../utils'

describe.concurrent('previousRoutePlugin', () => {
  const initRouter = initRouterFactory({ plugins: [PreviousRoutePlugin] })

  it('should expose previousRoute as a shallow ref', async () => {
    const router = await initRouter()
    expect(router.previousRoute).toBeDefined()
    expect(router.previousRoute.value).toBeUndefined()
  })

  it('should update previousRoute after multiple navigation', async () => {
    const router = await initRouter()

    await router.push('/home')
    expect(router.previousRoute.value?.path).toBe('/')

    await router.push('/')
    expect(router.previousRoute.value?.path).toBe('/home')
    expect(router.previousRoute.value?.name).toBeUndefined()
  })

  it('should preserve full route information', async () => {
    const router = await initRouter()

    await router.push('/home?query=1')
    await router.replace('/home')
    expect(router.previousRoute.value).toEqual({
      path: '/home',
      fullPath: '/home?query=1',
      name: undefined,
      hash: '',
    })
  })
})
