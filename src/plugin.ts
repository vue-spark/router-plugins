import type { App, ObjectPlugin } from 'vue'
import type * as VueRouter from 'vue-router'

export type FunctionRouterPlugin<Options = any[]> = (
  router: VueRouter.Router,
  ...options: Options extends unknown[] ? Options : [Options]
) => void

export type RouterPlugin<Options = any[]> = FunctionRouterPlugin<Options> & ObjectPlugin<Options>

function getAppRouter(app: App): VueRouter.Router {
  const router = app.config.globalProperties.$router
  if (!router) {
    throw new Error('Please install vue-router first.')
  }
  return router
}

export function definePlugin<Options = any[]>(
  function_: FunctionRouterPlugin<Options>,
): RouterPlugin<Options> {
  return Object.assign(function_, {
    install(app: App, ...options: any) {
      function_(getAppRouter(app), ...options)
    },
  } as ObjectPlugin<Options>)
}
