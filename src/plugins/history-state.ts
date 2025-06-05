/* eslint-disable ts/no-empty-object-type */
import type * as VueRouter from 'vue-router'
import type { RouterPlugin } from '../plugin'
import { onRouterUninstall } from '../hooks/on-router-uninstall'
import { definePlugin } from '../plugin'
import { assign, isString } from '../utils'

export interface HistoryStateManager {
  readonly raw: VueRouter.HistoryState
  readonly namespace: string

  set: {
    <T extends {}>(state: Partial<T>): void
    <T = unknown>(key: string, value: T | undefined): T | undefined
  }
  setMemory: HistoryStateManager['set']

  setDeferred: HistoryStateManager['set']
  cancelDeferred: () => void
  applyDeferred: () => void

  get: {
    <T extends {}>(): Partial<T>
    <T = unknown>(key: string): T | undefined
  }

  take: {
    <T extends {}>(): Partial<T>
    <T = unknown>(key: string): T | undefined
  }

  destroy: () => void
}

function createStateManager(router: VueRouter.Router, namespace: string): HistoryStateManager {
  const routerHistory = router.options.history
  let historyState: {} = assign({}, routerHistory.state[namespace])
  let memoryState: {} = assign({}, historyState)
  let deferredQueue: [keyOrState: any, value?: any][] = []

  // when historyState is changed, sync it to routerHistory.state
  const syncHistoryState = (destroy?: boolean): void => {
    assign(routerHistory.state, { [namespace]: destroy ? undefined : historyState })
    routerHistory.replace(routerHistory.location, routerHistory.state)
  }

  const setState = (
    keyOrState: any,
    value?: any,
    options: { onlyMemory?: boolean, sync?: boolean } = {},
  ): void => {
    const state = isString(keyOrState) ? { [keyOrState]: value } : keyOrState
    assign(memoryState, state)

    // only sync to history state when not onlyMemory
    if (options.onlyMemory) return

    assign(historyState, state)
    options.sync && syncHistoryState()
  }

  const applyDeferred = (): void => {
    if (!deferredQueue.length) return

    const queue = deferredQueue
    deferredQueue = []
    queue.forEach(([keyOrState, value]) => setState(keyOrState, value))
    syncHistoryState()
  }

  // immediately sync the state
  syncHistoryState()

  // sync the state when navigation is done
  const removeRouterGuard = router.afterEach((_, __, failure) => {
    !failure && applyDeferred()
  })

  return {
    get raw() {
      return routerHistory.state
    },

    get namespace() {
      return namespace
    },

    set(keyOrState: any, value?: any) {
      setState(keyOrState, value, { sync: true })
    },

    setMemory(keyOrState: any, value?: any) {
      setState(keyOrState, value, { onlyMemory: true })
    },

    setDeferred(keyOrState: any, value?: any) {
      deferredQueue.push([keyOrState, value])
    },

    cancelDeferred() {
      deferredQueue = []
    },

    applyDeferred,

    get(key?: string): any {
      const state = { ...memoryState } as any
      return key != null ? state[key] : state
    },

    take(key?: string): any {
      try {
        if (key != null) {
          const value = memoryState[key as keyof {}]
          delete historyState[key as keyof {}]
          delete memoryState[key as keyof {}]
          return value
        }

        const state = memoryState
        historyState = {}
        memoryState = {}
        return { ...state }
      }
      finally {
        syncHistoryState()
      }
    },

    destroy(): void {
      historyState = {}
      memoryState = {}
      deferredQueue = []
      syncHistoryState(true)
      removeRouterGuard()
    },
  }
}

const DEFAULT_NAMESPACE = '__routerPlugins__historyStatePlugin__'
const HistoryStatePlugin: RouterPlugin = /* @__PURE__ */ definePlugin((router) => {
  const stateManagerMap = new Map<string, HistoryStateManager>()
  stateManagerMap.set(DEFAULT_NAMESPACE, createStateManager(router, DEFAULT_NAMESPACE))

  const stateManagerFactory = (namespace: string): HistoryStateManager => {
    if (namespace && !stateManagerMap.has(namespace)) {
      stateManagerMap.set(namespace, createStateManager(router, namespace))
    }
    return stateManagerMap.get(namespace || DEFAULT_NAMESPACE)!
  }

  router.historyState = Object.assign(stateManagerFactory, stateManagerMap.get(DEFAULT_NAMESPACE)!)

  onRouterUninstall(router, () => {
    stateManagerMap.forEach(stateManager => stateManager.destroy())
    stateManagerMap.clear()
  })
})

export default HistoryStatePlugin

declare module 'vue-router' {
  interface Router {
    historyState: HistoryStateManager & ((namespace: string) => HistoryStateManager)
  }
}
