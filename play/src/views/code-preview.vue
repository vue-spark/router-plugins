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
const count = ref(0)
router.historyState.setDeferred('count', count.value)
router.back()

// home.vue
const count = ref<number>()
onActivated(() => {
  count.value = router.historyState.get('count') ?? 0
})
`,
  },

  {
    plugin: 'ScrollerPlugin',
    code: `\
// main.ts
app.use(RouterPlugins, {
  scroller: {
    selectors: {
      window: true,
      body: true,
      // 滚动元素选择器
      '.scrollable': true,
    },
  },
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
