import type { ShallowRef } from 'vue'
import type { RouterPlugin, RouterPluginInstall } from 'vue-router-plugin-system'
import { shallowRef } from 'vue'
import { withInstall } from 'vue-router-plugin-system'

function IsNavigatingPlugin(): RouterPlugin & RouterPluginInstall {
  return withInstall(({ router, onUninstall }) => {
    const isNavigating = (router.isNavigating = shallowRef(false))

    router.beforeEach(() => {
      isNavigating.value = true
    })
    router.afterEach(() => {
      isNavigating.value = false
    })

    onUninstall(() => {
      isNavigating.value = false
    })
  })
}

export { IsNavigatingPlugin as default, IsNavigatingPlugin }

declare module 'vue-router' {
  interface Router {
    isNavigating: ShallowRef<boolean>
  }
}
