import type { RouterPlugin } from './plugin'
import type { NavigationDirectionOptions } from './plugins/navigation-direction'
import type { ScrollerOptions } from './plugins/scroller'
import { definePlugin } from './plugin'
import HistoryStatePlugin from './plugins/history-state'
import IsNavigatingPlugin from './plugins/is-navigating'
import NavigationDirectionPlugin from './plugins/navigation-direction'
import PreviousRoutePlugin from './plugins/previous-route'
import ScrollerPlugin from './plugins/scroller'

export * from './plugin'
export * from './plugins/history-state'
export * from './plugins/is-navigating'
export * from './plugins/navigation-direction'
export * from './plugins/previous-route'
export * from './plugins/scroller'

export interface RouterPluginsOptions {
  navigationDirection?: NavigationDirectionOptions
  scroller?: ScrollerOptions
}

const RouterPlugins: RouterPlugin<[RouterPluginsOptions?]> = /* @__PURE__ */ definePlugin(
  (router, options = {}) => {
    use(IsNavigatingPlugin)
    use(PreviousRoutePlugin)
    use(HistoryStatePlugin)
    use(NavigationDirectionPlugin, options.navigationDirection)
    // must be after navigationDirectionPlugin
    use(ScrollerPlugin, options.scroller)

    function use<Options extends unknown[]>(
      plugin: RouterPlugin<Options>,
      ...options: NoInfer<Options>
    ): void {
      plugin(router, ...(options as any))
    }
  },
)

export { RouterPlugins as default, RouterPlugins }
