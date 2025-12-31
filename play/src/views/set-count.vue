<script setup lang="ts">
import { shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import PageLayout from '@/components/PageLayout'

export interface PageState {
  /**
   * Incoming data from previous page
   */
  incoming?: {
    count?: number
  }

  /**
   * Outgoing data to previous page
   */
  outgoing?: {
    count: number
  }
}

const router = useRouter()
const pageState = router.historyState<PageState>('/set-count')

const count = shallowRef(pageState.take()?.incoming?.count ?? 0)

function handleConfirm() {
  pageState.setDeferred({ outgoing: { count: count.value } })
  router.back()
}
</script>

<template>
  <PageLayout>
    <div
      style="display: flex; flex-direction: column; gap: 20px; max-width: 800px; margin: 20px auto"
    >
      <VarCounter
        v-model="count"
        style="margin: 0 auto"
      />
      <div style="display: flex; justify-content: center; gap: 10px">
        <VarButton @click="$router.back()">
          返回
        </VarButton>
        <VarButton
          type="primary"
          @click="handleConfirm"
        >
          确认
        </VarButton>
      </div>
    </div>
  </PageLayout>
</template>
