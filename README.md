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
      selectors: {
        window: true,
        '.scrollable': true,
      },
    }),
  ],
})
```

## Plugin List

### <a id="HistoryStatePlugin">HistoryStatePlugin</a>

Supports passing and restoring state data during browser navigation (forward/backward) after caching pages with `<KeepAlive>`.

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
  onActivated(() => {
    // get() retrieves state data only, persists after refresh
    // const shouldRefresh = router.historyState.get('refreshList')

    // take() removes the data reference after retrieval, returns undefined on subsequent calls
    const shouldRefresh = router.historyState.take('refreshList')

    // Refetch list when needed
    if (shouldRefresh) {
      fetchList()
    }
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

  const router = useRouter()
  function handleBack() {
    // Set memory-only historical state
    // router.setMemory({ refreshList: true })

    // Set deferred historical state after navigation
    router.setDeferred({ refreshList: true })

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
interface HistoryStateManager {
  /**
   * Equivalent to `router.options.history.state`
   */
  readonly raw: VueRouter.HistoryState
  /**
   * Namespace name of the state
   */
  readonly namespace: string

  /**
   * Sets state data, synchronizes to `router.options.history.state` immediately
   * Only supports shallow copy
   */
  set: {
    <T extends {}>(state: Partial<T>): void
    <T = unknown>(key: string, value: T | undefined): T | undefined
  }

  /***
   * Sets memory-only state data, won't update `router.options.history.state`
   */
  setMemory: HistoryStateManager['set']

  /**
   * Defers state setting, synchronizes to `router.options.history.state` on next successful navigation
   * Can be called multiple times before next navigation, deferred states are buffered
   * Buffer resets on both successful and failed navigation
   */
  setDeferred: HistoryStateManager['set']
  /**
   * Cancels deferred state settings, resets buffer immediately
   */
  cancelDeferred: () => void
  /**
   * Synchronizes buffered state to `router.options.history.state` immediately
   */
  applyDeferred: () => void

  /**
   * Retrieves state data
   */
  get: {
    <T extends {}>(): Partial<T>
    <T = unknown>(key: string): T | undefined
  }

  /**
   * Retrieves and removes state data
   */
  take: {
    <T extends {}>(): Partial<T>
    <T = unknown>(key: string): T | undefined
  }

  /**
   * Destroys state data in current namespace
   */
  destroy: () => void
}

interface Router {
  historyState: HistoryStateManager & ((namespace: string) => HistoryStateManager)
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
      selectors: {
        window: true,
        '.scrollable': true,
      },
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
   * Scroll element selectors, supports special selector `window`
   */
  selectors: Record<string, boolean | ScrollHandler>
  /**
   * Scroll behavior
   */
  behavior?: ScrollBehavior
  /**
   * Restore scroll position only when navigating backward (suitable for mobile)
   *
   * **Note: Requires NavigationDirectionPlugin**
   */
  scrollOnlyBackward?: boolean
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

### From v0.x to v1.x

- Remove all plugin registration shorthands, only support on-demand importing required plugins.
- Plugins are developed based on [vue-router-plugin-system](https://github.com/vue-spark/vue-router-plugin-system) (old plugin registration method is deprecated). See its documentation for details.
- Single plugin import path changed to `@vue-spark/router-plugins/[plugin-name]`.
- `selectors` configuration item in ScrollerPlugin has no default value and is now required.
