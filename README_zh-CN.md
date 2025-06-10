# @vue-spark/router-plugins

轻量级 Vue Router 4 插件集合——以最小开销扩展路由能力。

[English Document](https://github.com/vue-spark/router-plugins/blob/dev/README_zh-CN.md)

[在线示例](https://vue-spark.github.io/router-plugins/)

## 安装

```sh
npm i @vue-spark/router-plugins
```

### 全部注册

```ts
import RouterPlugins from '@vue-spark/router-plugins'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [],
})

// 建议在创建 router 实例后立即注册插件，防止其他模块在插件加载前访问 router 实例导致异常
RouterPlugins(router, {
  // 插件配置项
})

// 也支持通过 app 注册
app.use(RouterPlugins, {
  // 插件配置项
})
```

### 单个注册

```ts
import ScrollerPlugin from '@vue-spark/router-plugins/plugins/scroller'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [],
})

// 建议在创建 router 实例后立即注册插件，防止其他模块在插件加载前访问 router 实例导致异常
RouterPlugins(ScrollerPlugin, {
  // 插件配置项
})

// 也支持通过 app 注册
app.use(ScrollerPlugin, {
  // 插件配置项
})
```

## 插件列表

### <a id="HistoryStatePlugin">HistoryStatePlugin</a>

用于在使用 `<KeepAlive>` 缓存页面后，支持在浏览器导航（前进/后退）时传递和恢复状态数据。

<details>
<summary>使用示例</summary>

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

  // 立即请求
  fetchList()

  const router = useRouter()
  onActivated(() => {
    // get() 只获取状态数据，刷新后仍然存在
    // const shouldRefresh = router.historyState.get('refreshList')

    // take() 会在获取数据后删除原数据引用，再次获取时会返回 undefined
    const shouldRefresh = router.historyState.take('refreshList')

    // 在需要时重新请求列表
    if (shouldRefresh) {
      fetchList()
    }
  })
</script>

<template>
  <button @click="$router.push('/list/detail')">新增</button>
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
    // 仅设置内存里的历史状态
    // router.setMemory({ refreshList: true })

    // 在导航后设置历史状态
    router.setDeferred({ refreshList: true })

    router.back()
  }
</script>

<template>
  <button @click="handleBack">返回</button>
</template>
```

</details>

#### 类型定义

```ts
interface HistoryStateManager {
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
    <T = unknown>(key: string, value: T | undefined): T | undefined
  }

  /***
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

interface Router {
  historyState: HistoryStateManager & ((namespace: string) => HistoryStateManager)
}
```

### <a id="NavigationDirectionPlugin">NavigationDirectionPlugin</a>

用于模拟移动端导航方向（前进/后退/刷新），辅助动画与缓存控制。

<details>
<summary>使用示例</summary>

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
      @after-enter="$router.scroller.trigger()"
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

#### 配置项

```ts
interface NavigationDirectionOptions {
  /**
   * 导航方向解析器
   */
  directionResolver?: NavigationDirectionResolver
}
```

#### 类型定义

```ts
enum NavigationDirection {
  forward = 'forward',
  backward = 'backward',
  unchanged = 'unchanged',
}

interface INavigationDirection {
  /**
   * 当前导航方向，即最后一次导航方向
   */
  currentDirection: ShallowRef<NavigationDirection>
  /**
   * 设置下次导航方向，将会在下次导航成功时生效，导航失败时需要重新设置
   */
  setNextDirection: (direction: NavigationDirection) => void
  /**
   * 监听导航方向变化，会在 `onScopeDispose` 时自动移除回调
   */
  listen: (callback: NavigationDirectionCallback) => () => void
}

interface Router {
  navigationDirection: INavigationDirection
}
```

### <a id="ScrollerPlugin">ScrollerPlugin</a>

自动保存并恢复滚动位置，适用于长页面或列表页。

<details>
<summary>使用示例</summary>

```ts
// main.ts
import ScrollerPlugin from '@vue-spark/router-plugins/plugins/scroller'
import router from './router'

ScrollerPlugin(router, {
  // 设置滚动位置的元素选择器
  scroller: {
    window: true,
    body: true,
    '.scrollable': true,
  },
})
```

在搭配 `<Transition>` 组件使用时，需要在其 `after-enter` 事件时执行 `router.scroller.trigger()` 手动进行当前路由的滚动位置还原。

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

#### 配置项

````ts
interface ScrollerOptions {
  /**
   * 滚动元素选择器，支持特殊选择器 `window`
   * @default
   * ```ts
   * { window: true, body: true }
   * ```
   */
  selectors?: Record<string, boolean | ScrollHandler>
  /**
   * 滚动行为
   */
  behavior?: ScrollBehavior
  /**
   * 仅当导航后退时还原滚动位置，适合移动端页面
   *
   * **注意：该功能依赖于 `NavigationDirectionPlugin`，若没有安装则无效！**
   */
  scrollOnlyBackward?: boolean
}
````

#### 类型定义

```ts
interface ScrollPositionCoordinates {
  left?: number
  top?: number
}

type ScrollPositionCoordinatesGroup = Record<string, ScrollPositionCoordinates>

interface Scroller {
  /**
   * 滚动位置记录
   */
  positionsMap: ShallowReactive<Map<string, ScrollPositionCoordinatesGroup>>
  /**
   * 手动触发当前路由的滚动位置还原，适用于 `Transition` 组件动画结束后进行调用
   */
  trigger: () => void
}

interface Router {
  scroller: Scroller
}
```

### <a id="IsNavigatingPlugin">IsNavigatingPlugin</a>

用于检测当前是否处于导航状态，适用于过渡动画或加载提示。

<details>
<summary>使用示例</summary>

```html
<template>
  <div :class="{ 'is-navigating': $router.isNavigating.value }">
    <RouterView />
  </div>
</template>
```

</details>

#### 类型定义

```ts
interface Router {
  isNavigating: ShallowRef<boolean>
}
```

### <a id="PreviousRoutePlugin">PreviousRoutePlugin</a>

记录上一个访问的路由信息，适合需要根据来源做逻辑判断的场景。

<details>
<summary>使用示例</summary>

```ts
const router = createRouter({...})

const originalBack = router.back
router.back = () => {
  const currentRoute = router.currentRoute.value
  const previousRoute = router.previousRoute.value
  // 遇到前置路由为根路由且当前路由不是 TabBar 页面时，返回 TabBar 页面
  if (previousRoute && previousRoute.fullPath === '/' && !currentRoute.meta.isTabBar) {
    // 设置下次导航方向，用于变更导航动画
    router.navigationDirection.setNextDirection(NavigationDirection.backward)
    router.replace('/tab-bar')
    return
  }
  originalBack()
}
```

</details>

#### 类型定义

```ts
interface PreviousRoute
  extends Readonly<
    Pick<VueRouter.RouteLocationNormalizedLoaded, 'name' | 'path' | 'fullPath' | 'hash'>
  > {}

interface Router {
  previousRoute: ShallowRef<PreviousRoute | undefined>
}
```
