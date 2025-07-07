import HistoryStatePlugin from '@src/plugins/history-state'
import { describe, expect, it } from 'vitest'
import { initRouterFactory } from '../utils'

describe.concurrent('historyStatePlugin', () => {
  const initRouter = initRouterFactory({
    pluginsFactory() {
      return [HistoryStatePlugin()]
    },
  })

  it('should expose historyState', async () => {
    const router = await initRouter()
    const routerHistory = router.options.history
    const namespace = router.historyState.namespace
    expect(router.historyState.raw).toBe(routerHistory.state)
    expect(routerHistory.state[namespace]).toStrictEqual(router.historyState.get())
  })

  it('should set and get state correctly', async () => {
    const router = await initRouter()
    const routerHistory = router.options.history

    router.historyState.set('testKey', 'testValue')
    expect(router.historyState.get('testKey')).toBe('testValue')

    router.historyState.set({ testKey: 'testValue2' })
    expect(router.historyState.get('testKey')).toBe('testValue2')

    const namespace = router.historyState.namespace
    expect(routerHistory.state[namespace]).toStrictEqual(router.historyState.get())
  })

  it('should update memory state without modifying history state when using setMemory', async () => {
    const router = await initRouter()
    const routerHistory = router.options.history

    router.historyState.setMemory('testKey', 'testValue')
    expect(router.historyState.get('testKey')).toBe('testValue')

    const namespace = router.historyState.namespace
    expect('testKey' in (routerHistory.state[namespace] as any)).toBeFalsy()

    router.historyState.set('testKey2', 'testValue2')
    expect('testKey' in (routerHistory.state[namespace] as any)).toBeFalsy()
  })

  it('should handle deferred state updates', async () => {
    const router = await initRouter()
    router.historyState.setDeferred('deferredKey', 'deferredValue')
    expect(router.historyState.get('deferredKey')).toBeUndefined()

    const failure = await router.push('/home')
    expect(router.historyState.get('deferredKey')).toBe(failure ? undefined : 'deferredValue')
  })

  it('should cancel deferred state updates', async () => {
    const router = await initRouter()
    router.historyState.setDeferred('cancelKey', 'cancelValue')
    router.historyState.cancelDeferred()

    const failure = await router.push('/home')
    if (failure) throw failure
    expect(router.historyState.get('cancelKey')).toBeUndefined()
  })

  it('should take state correctly', async () => {
    const router = await initRouter()
    router.historyState.set('takeKey', 'takeValue')
    const value = router.historyState.take('takeKey')
    expect(value).toBe('takeValue')
    expect(router.historyState.get('takeKey')).toBeUndefined()
  })

  it('should destroy plugin correctly', async () => {
    const router = await initRouter()
    router.historyState.destroy()
    expect(router.options.history.state[router.historyState.namespace]).toBeUndefined()
  })
})
