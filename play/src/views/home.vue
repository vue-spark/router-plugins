<script setup lang="ts">
import { onActivated, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import PageLayout from '@/components/PageLayout'

const router = useRouter()
const count = shallowRef<number>()
const signature = shallowRef<string>()

onActivated(() => {
  count.value = router.historyState.get('count') ?? 0
  signature.value = router.historyState.get('signature')
})
</script>

<template>
  <PageLayout>
    <div
      style="display: flex; flex-direction: column; gap: 20px; max-width: 800px; margin: 20px auto"
    >
      <VarPaper :elevation="2">
        <VarCell>
          <b>Router Plugins</b> 通过插件形式扩展了
          <b>Vue Router</b>
          的功能，让开发者在特殊场景下拥有更简单、更友好的开发体验。
        </VarCell>
        <VarCell>请参考下面的操作步骤进行尝试！</VarCell>
        <VarCell>
          <b>首页：</b>演示导航动画(<b>NavigationDirectionPlugin</b>)和页面缓存时跨页面数据传输(<b>HistoryStatePlugin</b>)功能。
        </VarCell>
        <VarCell> <b>收藏、我的：</b>演示跨页面滚动位置自动还原(<b>ScrollerPlugin</b>)。 </VarCell>
        <VarCell> <b>代码示例：</b>插件使用方式的代码示例。 </VarCell>
      </VarPaper>

      <div style="display: flex; flex-direction: column; gap: 10px; align-items: center">
        <VarButton
          type="primary"
          @click="
            () => {
              $router.historyState.setDeferred({ count })
              $router.push('/set-count')
            }
          "
        >
          更新计数
        </VarButton>
        <b>{{ count }}</b>
      </div>

      <div style="display: flex; flex-direction: column; gap: 10px; align-items: center">
        <VarButton
          type="primary"
          @click="$router.push('/signature-pad')"
        >
          前去签名
        </VarButton>

        <div style="width: 100%; height: 400px; background-color: aliceblue">
          <img
            v-if="signature"
            :src="signature"
            style="-webkit-user-drag: none"
          >
        </div>
      </div>
    </div>
  </PageLayout>
</template>
