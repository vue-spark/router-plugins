# @vue-spark/router-plugins

Lightweight Vue Router 4 plugin collection - extend routing capabilities with minimal overhead.

> Starting from v1.0.0, the plugin is developed based on [vue-router-plugin-system](https://github.com/vue-spark/vue-router-plugin-system) (the old plugin registration method is deprecated). See its documentation for details.

[中文文档](./README.zh-CN.md)

[Online example](https://vue-spark.github.io/router-plugins/)

## Installation

```sh
npm i @vue-spark/router-plugins
```

### Plugin Registration

#### Method 1：

```ts
import ScrollerPlugin from '@vue-spark/router-plugins/scroller'

// initialize the plugin and install
ScrollerPlugin({
  selectors: ['.scrollable'],
}).install(router)
```

#### Method 2：

```ts
import ScrollerPlugin from '@vue-spark/router-plugins/scroller'

createApp(App)
  // register router first
  .use(router)
  // then register the plugin
  .use(
    ScrollerPlugin({
      selectors: ['.scrollable'],
    }),
  )
```

#### Method 3：

```ts
import ScrollerPlugin from '@vue-spark/router-plugins/scroller'
import { createWebHistory } from 'vue-router'
import { createRouter } from 'vue-router-plugin-system'

const router = createRouter({
  history: createWebHistory(),
  routes: [],
  plugins: [
    // initialize the plugin
    ScrollerPlugin({
      selectors: ['.scrollable'],
    }),
  ],
})
```

## Plugin List

### <a id="HistoryStatePlugin">HistoryStatePlugin</a>

Supports passing and restoring state data during browser navigation (forward/backward).

<details>
<summary>Usage Example</summary>

```html
<!-- list.vue -->
<script
  setup
  lang="ts"
>
  import { shallowRef, onActivated } from 'vue'
  import { useRouter } from 'vue-router'
  import type { PageState as ListDetailPageState } from './detail.vue'

  interface Item {}

  const list = shallowRef<Item[]>([])
  const fetchList = async () => {
    fetch('/api/list').then((res) => {
      list.value = res.json()
    })
  }

  // Fetch immediately
  fetchList()

  const router = useRouter()
  const listDetailPageState = router.historyState<ListDetailPageState>('/list/detail')

  onActivated(() => {
    listDetailPageState.withTake(({ outgoing }) => {
      // Refetch list when needed
      outgoing?.refreshList && fetchList()
    })
  })
</script>

<template>
  <button @click="$router.push('/list/detail')">Add New</button>
  <ul>
    <li v-for="item in list">{{ item }}</li>
  </ul>
</template>
```

```html
<!-- detail.vue -->
<script
  setup
  lang="ts"
>
  import { useRouter } from 'vue-router'

  export interface PageState {
    outgoing?: {
      refreshList?: boolean
    }
  }

  const router = useRouter()
  const pageState = router.historyState<PageState>('/list/detail')

  function handleBack() {
    // Set deferred state data
    pageState.setDeferred({ outgoing: { refreshList: true } })

    router.back()
  }
</script>

<template>
  <button @click="handleBack">Back</button>
</template>
```

</details>

#### Type Definitions

```ts
interface HistoryStateManager<State extends {} = {}> {
  /**
   * Equivalent to `router.options.history.state`
   */
  readonly raw: VueRouter.HistoryState
  /**
   * Namespace name of the state
   */
  readonly namespace: string

  /**
   * Sets state data, synchronizes to `router.options.history.state` immediately, only supports shallow copy
   *
   * **Note: When setting data that cannot be structured cloned by `history.state` (see {@link structuredClone}), `vue-router` will automatically reset the page!**
   */
  set: (state: NoInfer<State>) => void

  /**
   * Sets memory-only state data, won't update `router.options.history.state`, only supports shallow copy
   *
   * **Note: Although this function won't update `history.state`, it's still not recommended to set data that cannot be structured cloned by `history.state` (see {@link structuredClone})!**
   */
  setMemory: HistoryStateManager<NoInfer<State>>['set']

  /**
   * Defers state setting, synchronizes to `router.options.history.state` on next successful navigation
   * Can be called multiple times before next navigation, deferred states are buffered
   * Buffer resets on both successful and failed navigation
   *
   * **Note: When setting data that cannot be structured cloned by `history.state` (see {@link structuredClone}), `vue-router` will automatically reset the page!**
   */
  setDeferred: HistoryStateManager<NoInfer<State>>['set']
  /**
   * Cancels deferred state settings, resets buffer immediately
   */
  cancelDeferred: () => void
  /**
   * Applies deferred state settings, synchronizes to `router.options.history.state` immediately
   */
  applyDeferred: () => void

  /**
   * Gets state data
   */
  get: () => NoInfer<State>
  /**
   * Gets state data and runs callback function
   */
  withGet: <R = void>(cb: (state: NoInfer<State>) => R) => NoInfer<R>

  /**
   * Gets state data and deletes original cache
   */
  take: () => NoInfer<State>
  /**
   * Gets state data and deletes original cache and runs callback function
   */
  withTake: <R = void>(cb: (state: NoInfer<State>) => R) => NoInfer<R>

  /**
   * Destroys state data of current namespace
   */
  destroy: () => void
}

interface Router {
  historyState: {
    <State extends {}>(namespace: string): HistoryStateManager<State>
    readonly raw: VueRouter.HistoryState
  }
}
```

### <a id="NavigationDirectionPlugin">NavigationDirectionPlugin</a>

Simulates mobile navigation direction (forward/backward/refresh) for animation and cache control.

<details>
<summary>Usage Example</summary>

```html
<!-- App.vue -->
<script
  setup
  lang="ts"
>
  import type { ResolveViewKey } from 'vue-router-better-view'
  import { ref, shallowReactive } from 'vue'
  import { useRouter } from 'vue-router'

  const router = useRouter()
  const transitionName = ref<string>()
  const keepAliveValues = shallowReactive(new Set<string>())

  const resolveViewKey: ResolveViewKey = (route) => {
    return route.meta.title ? route.fullPath : null
  }

  router.navigationDirection.listen((direction, to, from) => {
    switch (direction) {
      case 'forward': {
        transitionName.value = 'page-in'
        keepAliveValues.add(to.fullPath)
        break
      }
      case 'backward': {
        transitionName.value = 'page-out'
        keepAliveValues.delete(from.fullPath)
        break
      }
      default: {
        transitionName.value = undefined
        keepAliveValues.delete(from.fullPath)
        keepAliveValues.add(to.fullPath)
        break
      }
    }
  })
</script>

<template>
  <BetterRouterView
    v-slot="{ Component: viewComponent, route }"
    :resolve-view-key
  >
    <Transition
      :name="transitionName"
      :css="!!transitionName"
    >
      <KeepAlive :include="[...keepAliveValues]">
        <Component
          :is="viewComponent"
          :key="route.fullPath"
        />
      </KeepAlive>
    </Transition>
  </BetterRouterView>
</template>

<style scoped>
  .page-in-enter-active,
  .page-in-leave-active,
  .page-out-enter-active,
  .page-out-leave-active {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background-color: #fff;
    overflow: hidden;
    will-change: transform;
    transition:
      transform 0.3s linear,
      /* fix: 避免离场元素闪烁 */ opacity 0.31s;
  }

  .page-in-leave-to {
    /* fix: 避免离场元素闪烁 */
    opacity: 1;
  }
  .page-in-enter-from {
    z-index: 2;
    transform: translateX(100%);
  }
  .page-in-enter-to {
    z-index: 2;
  }

  .page-out-leave-from {
    z-index: 2;
  }
  .page-out-leave-to {
    z-index: 2;
    transform: translateX(100%);
  }
</style>
```

</details>

**MemoryHistory Support**: When using `createMemoryHistory()`, since MemoryHistory doesn't provide browser history delta information, the plugin will identify all navigation operations (including `push` and `replace`) as forward direction. If you need to customize direction recognition logic in MemoryHistory environment, you can use the `directionResolver` option:

```ts
const router = createRouter({
  history: createMemoryHistory(),
  routes,
  plugins: [
    NavigationDirectionPlugin({
      directionResolver: ({ to, from, delta }) => {
        // Custom logic: determine direction based on route changes
        if (to.path !== from.path) {
          // You can determine forward/backward/replace based on business logic
          return NavigationDirection.unchanged // or other logic
        }
        return delta > 0 ? NavigationDirection.forward : NavigationDirection.backward
      },
    }),
  ],
})
```

#### Configuration Options

```ts
interface NavigationDirectionOptions {
  /**
   * Navigation direction resolver
   */
  directionResolver?: NavigationDirectionResolver
}
```

#### Type Definitions

```ts
enum NavigationDirection {
  forward = 'forward',
  backward = 'backward',
  unchanged = 'unchanged',
}

interface INavigationDirection {
  /**
   * Current navigation direction (last navigation)
   */
  currentDirection: ShallowRef<NavigationDirection>
  /**
   * Sets next navigation direction, takes effect on next successful navigation
   * Needs re-setting after failed navigation
   */
  setNextDirection: (direction: NavigationDirection) => void
  /**
   * Listens for navigation direction changes, callback is automatically removed on scope disposal
   */
  listen: (callback: NavigationDirectionCallback) => () => void
}

interface Router {
  navigationDirection: INavigationDirection
}
```

### <a id="ScrollerPlugin">ScrollerPlugin</a>

Automatically saves and restores scroll position for long pages or list pages.

<details>
<summary>Usage Example</summary>

```ts
// router/index.ts
import ScrollerPlugin from '@vue-spark/router-plugins/scroller'
import { createWebHistory } from 'vue-router'
import { createRouter } from 'vue-router-plugin-system'

const router = createRouter({
  history: createWebHistory(),
  routes: [],
  plugins: [
    ScrollerPlugin({
      // set the selectors you want to use
      selectors: ['.scrollable'],
    }),
  ],
})
```

When using with `<Transition>`, manually trigger scroll restoration via `router.scroller.trigger()` in `after-enter` event:

```html
<template>
  <RouterView v-slot="{ Component: viewComponent }">
    <Transition @after-enter="$router.scroller.trigger()">
      <Component :is="viewComponent" />
    </Transition>
  </RouterView>
</template>
```

</details>

#### Configuration Options

```ts
interface ScrollerOptions {
  /**
   * Scroll behavior
   */
  behavior?: ScrollBehavior
  /**
   * Scroll element selectors, supports special selector `window` and `document`
   */
  selectors: string[]
  /**
   * Scroll position handler
   * - Return `true` to use recorded scroll position
   * - Return falsy value to skip scroll restoration
   * - Return `ScrollPositionCoordinates` to use custom scroll position
   */
  scrollHandler?: ScrollHandler
}
```

#### Type Definitions

```ts
interface ScrollPositionCoordinates {
  left?: number
  top?: number
}

type ScrollPositionCoordinatesGroup = Record<string, ScrollPositionCoordinates>

interface Scroller {
  /**
   * Scroll position records
   */
  positionsMap: ShallowReactive<Map<string, ScrollPositionCoordinatesGroup>>
  /**
   * Manually trigger scroll restoration for current route
   * Useful after Transition animations
   */
  trigger: () => void
}

interface Router {
  scroller: Scroller
}
```

### <a id="IsNavigatingPlugin">IsNavigatingPlugin</a>

Detects current navigation state for transition animations or loading indicators.

<details>
<summary>Usage Example</summary>

```html
<template>
  <div :class="{ 'is-navigating': $router.isNavigating.value }">
    <RouterView />
  </div>
</template>
```

</details>

#### Type Definitions

```ts
interface Router {
  isNavigating: ShallowRef<boolean>
}
```

### <a id="PreviousRoutePlugin">PreviousRoutePlugin</a>

Records previous route information for source-based logic decisions.

<details>
<summary>Usage Example</summary>

```ts
const router = createRouter({...})

const originalBack = router.back
router.back = () => {
  const currentRoute = router.currentRoute.value
  const previousRoute = router.previousRoute.value
  // Return to TabBar page when previous route is root and current is not TabBar
  if (previousRoute && previousRoute.fullPath === '/' && !currentRoute.meta.isTabBar) {
    // Set next navigation direction for animation
    router.navigationDirection.setNextDirection(NavigationDirection.backward)
    router.replace('/tab-bar')
    return
  }
  originalBack()
}
```

</details>

#### Type Definitions

```ts
interface PreviousRoute
  extends Readonly<
    Pick<VueRouter.RouteLocationNormalizedLoaded, 'name' | 'path' | 'fullPath' | 'hash'>
  > {}

interface Router {
  previousRoute: ShallowRef<PreviousRoute | undefined>
}
```

## Migration Guide

### From v1.x to v2.x

- `ScrollerPlugin`
  - `scrollOnlyBackward` option is removed, use `scrollHandler` instead to handle scroll restoration.
  - `selectors` option now changes to `string[]`.
- `HistoryStatePlugin`
  - `HistoryStateManager` type changed to `HistoryStateManager<State extends {} = {}>`.
  - `router.historyState` no longer supports default namespace.
  - `set`、`setMemory`、`setDeferred`、`get`、`take` functions no longer support setting/getting single property via `key`.
  - `set`、`setMemory`、`setDeferred`、`get`、`take` functions type changed, see type definitions.

### From v0.x to v1.x

- Remove all plugin registration shorthands, only support on-demand importing required plugins.
- Plugins are developed based on [vue-router-plugin-system](https://github.com/vue-spark/vue-router-plugin-system) (old plugin registration method is deprecated). See its documentation for details.
- Single plugin import path changed to `@vue-spark/router-plugins/[plugin-name]`.
- `selectors` configuration item in ScrollerPlugin has no default value and is now required.
