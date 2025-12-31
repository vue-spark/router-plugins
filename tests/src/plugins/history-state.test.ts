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
    expect(router.historyState.raw).toBe(routerHistory.state)
  })

  it('should set and get state correctly', async () => {
    const router = await initRouter()
    const routerHistory = router.options.history
    const historyState = router.historyState('test')

    historyState.set({ testKey: 'testValue' })
    expect(historyState.get()).toStrictEqual({ testKey: 'testValue' })

    historyState.set({ testKey: 'testValue2' })
    expect(historyState.get()).toStrictEqual({ testKey: 'testValue2' })

    const namespace = historyState.namespace
    expect(routerHistory.state[namespace]).toStrictEqual(historyState.get())
  })

  it('should update memory state without modifying history state when using setMemory', async () => {
    const router = await initRouter()
    const routerHistory = router.options.history
    const historyState = router.historyState('test')

    historyState.setMemory({ testKey: 'testValue' })
    expect(historyState.get()).toStrictEqual({ testKey: 'testValue' })

    const namespace = historyState.namespace
    expect('testKey' in (routerHistory.state[namespace] as any)).toBeFalsy()

    historyState.set({ testKey2: 'testValue2' })
    expect('testKey' in (routerHistory.state[namespace] as any)).toBeFalsy()
  })

  it('should handle deferred state updates', async () => {
    const router = await initRouter()
    const historyState = router.historyState('test')

    historyState.setDeferred({ deferredKey: 'deferredValue' })
    expect(historyState.get()).toStrictEqual({})

    const failure = await router.push('/home')
    expect(historyState.get()).toStrictEqual(failure ? {} : { deferredKey: 'deferredValue' })
  })

  it('should cancel deferred state updates', async () => {
    const router = await initRouter()
    const historyState = router.historyState('test')

    historyState.setDeferred({ cancelKey: 'cancelValue' })
    historyState.cancelDeferred()

    const failure = await router.push('/home')
    if (failure) throw failure
    expect(historyState.get()).toStrictEqual({})
  })

  it('should take state correctly', async () => {
    const router = await initRouter()
    const historyState = router.historyState<{ takeKey: string }>('test')

    historyState.set({ takeKey: 'takeValue' })
    const value = historyState.take().takeKey
    expect(value).toBe('takeValue')
    expect(historyState.get()).toStrictEqual({})
  })

  it('should destroy plugin correctly', async () => {
    const router = await initRouter()
    router.historyState('test').destroy()
    expect(router.options.history.state.test).toBeUndefined()
  })

  it('should get state correctly with withGet', async () => {
    const router = await initRouter()
    const historyState = router.historyState<{ testKey: string }>('test')
    historyState.set({ testKey: 'testValue' })
    historyState.withGet((state) => {
      expect(state.testKey).toBe('testValue')
    })
  })

  it('should take state correctly with withTake', async () => {
    const router = await initRouter()
    const historyState = router.historyState<{ takeKey: string }>('test')
    historyState.set({ takeKey: 'takeValue' })
    historyState.withTake((state) => {
      expect(state.takeKey).toBe('takeValue')
    })
    expect(historyState.get()).toStrictEqual({})
  })
})
