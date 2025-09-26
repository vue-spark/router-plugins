/* eslint-disable ts/no-empty-object-type */
import type * as VueRouter from 'vue-router'
import type { RouterPlugin, RouterPluginInstall } from 'vue-router-plugin-system'
import { withInstall } from 'vue-router-plugin-system'
import { assign, isBrowser, isString } from '../utils'

export interface HistoryStateManager {
  /**
   * 等同于 `router.options.history.state`
   */
  readonly raw: VueRouter.HistoryState
  /**
   * 状态所属的命名空间名称
   */
  readonly namespace: string

  /**
   * 设置状态数据，会立即同步到 `router.options.history.state`，数据仅支持浅拷贝
   */
  set: {
    <T extends {}>(state: Partial<T>): void
    <T = unknown>(key: string, value: T | undefined): void
  }

  /**
   * 仅设置内存里的状态数据，不会被更新到 `router.options.history.state`
   */
  setMemory: HistoryStateManager['set']

  /**
   * 延迟设置状态数据，会等待 `router` 下次导航成功时再同步到 `router.options.history.state`，
   * 可以在导航前多次调用，延迟设置的状态数据会放入缓冲区，无论下次导航成功或失败都会重置缓冲区
   */
  setDeferred: HistoryStateManager['set']
  /**
   * 取消延迟设置的状态数据，直接重置缓冲区
   */
  cancelDeferred: () => void
  /**
   * 立即同步缓冲区中的状态数据到 `router.options.history.state`
   */
  applyDeferred: () => void

  /**
   * 获取状态数据
   */
  get: {
    <T extends {}>(): Partial<T>
    <T = unknown>(key: string): T | undefined
  }

  /**
   * 获取状态数据并删除原始缓存
   */
  take: {
    <T extends {}>(): Partial<T>
    <T = unknown>(key: string): T | undefined
  }

  /**
   * 销毁当前命名空间的状态数据
   */
  destroy: () => void
}

function createStateManager(router: VueRouter.Router, namespace: string): HistoryStateManager {
  const routerHistory = router.options.history
  let historyState: {} = assign({}, routerHistory.state[namespace])
  let memoryState: {} = assign({}, historyState)
  let deferredBuffer: [keyOrState: any, value?: any][] = []

  const replaceHistoryState = (): void => {
    routerHistory.replace(routerHistory.location, routerHistory.state)
  }

  // 当 historyState 变更时需要同步到 routerHistory.state
  const syncHistoryState = (destroy?: boolean): void => {
    assign(routerHistory.state, { [namespace]: destroy ? undefined : historyState })
    replaceHistoryState()
  }

  const setState = (
    keyOrState: any,
    value?: any,
    options: { onlyMemory?: boolean, sync?: boolean } = {},
  ): void => {
    const state = isString(keyOrState) ? { [keyOrState]: value } : keyOrState
    assign(memoryState, state)

    // onlyMemory 为 true 时跳过 historyState 更新
    if (options.onlyMemory) return

    assign(historyState, state)
    options.sync && syncHistoryState()
  }

  const applyDeferred = (): void => {
    if (!deferredBuffer.length) return

    const buffer = deferredBuffer
    deferredBuffer = []
    buffer.forEach(([keyOrState, value]) => setState(keyOrState, value))
    syncHistoryState()
  }

  // 立即同步一次 historyState
  syncHistoryState()

  // 当 routerHistory 是 MemoryHistory 时需要手动触发初次导航才会进入到 ready 状态，
  // 这里在 isReady 成功后同步一次 historyState
  if (!isBrowser || routerHistory.state !== history.state) {
    router.isReady().then(() => syncHistoryState())
  }

  // 导航成功时同步延迟设置的状态数据
  const removeRouterGuard = router.afterEach((_, __, failure) => {
    !failure && applyDeferred()

    // 不论成功失败都重置缓冲区
    deferredBuffer = []
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
      deferredBuffer.push([keyOrState, value])
    },

    cancelDeferred() {
      deferredBuffer = []
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
      deferredBuffer = []
      syncHistoryState(true)
      removeRouterGuard()
    },
  }
}

const DEFAULT_NAMESPACE = '__routerPlugins__historyStatePlugin__'
function HistoryStatePlugin(): RouterPlugin & RouterPluginInstall {
  return withInstall(({ router, onUninstall }) => {
    const stateManagerMap = new Map<string, HistoryStateManager>()

    let defaultStateManager: HistoryStateManager | null = createStateManager(
      router,
      DEFAULT_NAMESPACE,
    )
    stateManagerMap.set(DEFAULT_NAMESPACE, defaultStateManager)

    const stateManagerFactory = (namespace: string): HistoryStateManager => {
      if (namespace && !stateManagerMap.has(namespace)) {
        stateManagerMap.set(namespace, createStateManager(router, namespace))
      }
      return stateManagerMap.get(namespace || DEFAULT_NAMESPACE)!
    }

    router.historyState = assign(stateManagerFactory, defaultStateManager)

    // 重写只读属性
    Object.defineProperties(router.historyState, {
      raw: {
        get() {
          return defaultStateManager?.raw
        },
      },
      namespace: {
        get() {
          return defaultStateManager?.namespace
        },
      },
    })

    onUninstall(() => {
      defaultStateManager = null
      stateManagerMap.forEach(stateManager => stateManager.destroy())
      stateManagerMap.clear()
    })
  })
}

export { HistoryStatePlugin as default, HistoryStatePlugin }

declare module 'vue-router' {
  interface Router {
    historyState: HistoryStateManager & ((namespace: string) => HistoryStateManager)
  }
}
