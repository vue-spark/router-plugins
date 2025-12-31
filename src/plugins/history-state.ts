/* eslint-disable ts/no-empty-object-type */
import type * as VueRouter from 'vue-router'
import type { RouterPlugin, RouterPluginInstall } from 'vue-router-plugin-system'
import { withInstall } from 'vue-router-plugin-system'
import { assign, isBrowser } from '../utils'

export interface HistoryStateManager<State extends {} = {}> {
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
   *
   * **注意：当设置的数据无法被 `history.state` 结构化克隆（{@link structuredClone}）时，`vue-router` 会自动重置页面！**
   */
  set: (state: NoInfer<State>) => void

  /**
   * 仅设置内存里的状态数据，不会被更新到 `router.options.history.state`
   *
   * **注意：虽然该函数不会更新 `history.state`，但是仍然不推荐设置无法被其结构化克隆（{@link structuredClone}）的数据！**
   */
  setMemory: HistoryStateManager<NoInfer<State>>['set']

  /**
   * 延迟设置状态数据，会等待 `router` 下次导航成功时再同步到 `router.options.history.state`，
   * 可以在导航前多次调用，延迟设置的状态数据会放入缓冲区，无论下次导航成功或失败都会重置缓冲区
   *
   * **注意：当设置的数据无法被 `history.state` 结构化克隆（{@link structuredClone}）时，`vue-router` 会自动重置页面！**
   */
  setDeferred: HistoryStateManager<NoInfer<State>>['set']
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
  get: () => NoInfer<State>
  /**
   * 获取状态数据后执行回调函数
   */
  withGet: <R = void>(cb: (state: NoInfer<State>) => R) => NoInfer<R>

  /**
   * 获取状态数据并删除原始缓存
   */
  take: () => NoInfer<State>
  /**
   * 获取状态数据并删除原始缓存后执行回调函数
   */
  withTake: <R = void>(cb: (state: NoInfer<State>) => R) => NoInfer<R>

  /**
   * 销毁当前命名空间的状态数据
   */
  destroy: () => void
}

function createStateManager(router: VueRouter.Router, namespace: string): HistoryStateManager {
  const routerHistory = router.options.history
  let historyState: {} = assign({}, routerHistory.state[namespace])
  let memoryState: {} = assign({}, historyState)
  let deferredBuffer: {}[] = []

  // 当 historyState 变更时需要同步到 routerHistory.state
  const syncHistoryState = (destroy?: boolean): void => {
    assign(routerHistory.state, { [namespace]: destroy ? undefined : historyState })
    routerHistory.replace(routerHistory.location, routerHistory.state)
  }

  const setState = (state: any, options: { onlyMemory?: boolean, sync?: boolean } = {}): void => {
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
    buffer.forEach(state => setState(state))
    syncHistoryState()
  }

  // 立即同步一次 historyState
  syncHistoryState()

  // 当 routerHistory 是 MemoryHistory 时需要手动触发初次导航才会进入到 ready 状态，
  // 这里在 isReady 成功后同步一次 historyState
  if (!isBrowser || routerHistory.state !== window.history.state) {
    router.isReady().then(() => syncHistoryState())
  }

  // 导航成功时同步延迟设置的状态数据
  const removeAfterGuard = router.afterEach((_, __, failure) => {
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

    set(state) {
      setState(state, { sync: true })
    },

    setMemory(state) {
      setState(state, { onlyMemory: true })
    },

    setDeferred(state) {
      deferredBuffer.push(state)
    },

    cancelDeferred() {
      deferredBuffer = []
    },

    applyDeferred,

    get(): any {
      return { ...memoryState }
    },
    withGet(cb) {
      return cb(this.get())
    },

    take(): any {
      try {
        return { ...memoryState }
      }
      finally {
        historyState = {}
        memoryState = {}
        syncHistoryState()
      }
    },
    withTake(cb) {
      return cb(this.take())
    },

    destroy(): void {
      historyState = {}
      memoryState = {}
      deferredBuffer = []
      syncHistoryState(true)
      removeAfterGuard()
    },
  }
}

function HistoryStatePlugin(): RouterPlugin & RouterPluginInstall {
  return withInstall(({ router, onUninstall }) => {
    const stateManagerMap = new Map<string, HistoryStateManager>()

    const stateManagerFactory = (namespace: string): HistoryStateManager<any> => {
      if (!namespace) {
        throw new Error('namespace is required')
      }
      if (!stateManagerMap.has(namespace)) {
        stateManagerMap.set(namespace, createStateManager(router, namespace))
      }
      return stateManagerMap.get(namespace)!
    }

    router.historyState = assign(stateManagerFactory, { raw: {} })
    // 重写只读属性
    Object.defineProperty(router.historyState, 'raw', {
      get() {
        return router.options.history.state
      },
    })

    onUninstall(() => {
      stateManagerMap.forEach(stateManager => stateManager.destroy())
      stateManagerMap.clear()
    })
  })
}

export { HistoryStatePlugin as default, HistoryStatePlugin }

declare module 'vue-router' {
  interface Router {
    historyState: {
      <State extends {}>(namespace: string): HistoryStateManager<State>
      readonly raw: VueRouter.HistoryState
    }
  }
}
