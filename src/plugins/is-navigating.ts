import type { ShallowRef } from 'vue'
import type { RouterPlugin } from '../plugin'
import { shallowRef } from 'vue'
import { onRouterUninstall } from '../hooks/on-router-uninstall'
import { definePlugin } from '../plugin'

const IsNavigatingPlugin: RouterPlugin = /* @__PURE__ */ definePlugin((router) => {
  const isNavigating = (router.isNavigating = shallowRef(false))

  router.beforeEach(() => {
    isNavigating.value = true
  })
  router.afterEach(() => {
    isNavigating.value = false
  })

  onRouterUninstall(router, () => {
    isNavigating.value = false
  })
})

export default IsNavigatingPlugin

declare module 'vue-router' {
  interface Router {
    isNavigating: ShallowRef<boolean>
  }
}
