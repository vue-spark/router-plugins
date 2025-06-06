import { onRouterUninstall } from '@src/hooks/on-router-uninstall'
import { describe, expect, it, vi } from 'vitest'
import { initRouterFactory, mockRouterUninstall } from '../utils'

describe.concurrent('onRouterUninstall', () => {
  const initRouter = initRouterFactory()

  it('should call handler when route changes to START_LOCATION', async () => {
    const router = await initRouter()
    const handler = vi.fn()

    onRouterUninstall(router, handler)

    await router.isReady()
    await mockRouterUninstall(router)

    expect(handler).toHaveBeenCalled()
  })

  it('should handle error case', async () => {
    const router = await initRouter()
    const handler = vi.fn()

    // mock router.isReady to reject
    router.isReady = () => Promise.reject(new Error('test error'))

    onRouterUninstall(router, handler)

    await router.isReady().catch(() => {})

    expect(handler).toHaveBeenCalled()
  })
})
