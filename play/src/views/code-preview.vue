<script setup lang="ts">
import { shallowRef } from 'vue'
import HighlightCode from '@/components/HighlightCode'

const collapseItems: { plugin: string, code: string }[] = [
  {
    plugin: 'NavigationDirectionPlugin',
    code: `\
// App.vue
const transitionName = ref<string>()
router.navigationDirection.listen((direction, to, from) => {
  switch (direction) {
    case 'forward': {
      transitionName.value = 'page-in'
      break
    }
    case 'backward': {
      transitionName.value = 'page-out'
      break
    }
    default: {
      transitionName.value = undefined
      break
    }
  }
})
`,
  },

  {
    plugin: 'HistoryStatePlugin',
    code: `\
// set-counter.vue
export interface PageState {
  incoming?: {
    count?: number
  }

  outgoing?: {
    count: number
  }
}

const pageState = router.historyState<PageState>('/set-counter')
// 取出上个页面传入的数据
const count = ref(pageState.take()?.incoming?.count ?? 0)

// 设置下个页面需要的数据
pageState.setDeferred({ outgoing: { count: count.value } })
router.back()

// ----------------------------------------------------------------

// home.vue
const count = ref<number>()

const setCounterPageState = router.historyState<PageState>('/set-counter')
onActivated(() => {
  // 取出 set-counter.vue 传入的数据
  setCounterPageState.withTake(({ outgoing }) => {
    if (outgoing) {
      count.value = outgoing.count
    }
  })
})
`,
  },

  {
    plugin: 'ScrollerPlugin',
    code: `\
// router.ts
import { ScrollerPlugin } from '@vue-spark/router-plugins/scroller'
import { createRouter } from 'vue-router-plugin-system'
import { createWebHistory } from 'vue-router'

createRouter({
  history: createWebHistory(),
  plugins: [
    ScrollerPlugin({
      selectors: ['.scrollable'],
    }),
  ],
  routes: [],
})

// App.vue
// 配合 Transition 动画时需要在 after-enter 事件时手动触发一次当前路由的滚动位置还原
function handleTransitionAfterEnter() {
  router.scroller.trigger()
}
`,
  },
]

const opened = shallowRef<string[]>(collapseItems.map(item => item.plugin))
</script>

<template>
  <PageLayout>
    <div
      style="display: flex; flex-direction: column; gap: 20px; max-width: 800px; margin: 20px auto"
    >
      <VarCollapse v-model="opened">
        <VarCollapseItem
          v-for="item in collapseItems"
          :key="item.plugin"
          :title="item.plugin"
          :name="item.plugin"
        >
          <HighlightCode :code="item.code" />
        </VarCollapseItem>
      </VarCollapse>
    </div>
  </PageLayout>
</template>
