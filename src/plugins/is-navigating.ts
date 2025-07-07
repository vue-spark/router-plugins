import type { ShallowRef } from 'vue'
import type { RouterPlugin } from 'vue-router-plugin-system'
import { shallowRef } from 'vue'

function IsNavigatingPlugin(): RouterPlugin {
  return ({ router, onUninstall }) => {
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
  }
}

export { IsNavigatingPlugin as default, IsNavigatingPlugin }

declare module 'vue-router' {
  interface Router {
    isNavigating: ShallowRef<boolean>
  }
}
