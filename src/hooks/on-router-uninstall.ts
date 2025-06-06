import type * as VueRouter from 'vue-router'
import { nextTick, watch } from 'vue'
import { START_LOCATION } from 'vue-router'

type UninstallHandler = () => void
const routers = new WeakMap<VueRouter.Router, Set<UninstallHandler>>()

export function onRouterUninstall(router: VueRouter.Router, handler: UninstallHandler): void {
  if (!routers.has(router)) {
    routers.set(router, new Set())

    const handleUninstall = (): void => {
      routers.get(router)?.forEach(handler => handler())
      routers.delete(router)
    }

    // vue-router 的 currentRoute.value 初始值是 START_LOCATION，
    // 在初次导航成功时被变更，之后只会在 app 卸载时又会重置为 START_LOCATION，
    // 所以这里通过 isReady() 成功时监听 currentRoute.value，
    // 在值为 START_LOCATION 时认为卸载完成需要执行卸载处理
    router
      .isReady()
      .then(() => {
        const stop = watch(router.currentRoute, (route) => {
          if (route === START_LOCATION) {
            nextTick(() => stop())
            handleUninstall()
          }
        })
      })
      .catch(handleUninstall)
  }

  routers.get(router)?.add(handler)
}
