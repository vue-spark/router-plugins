<script setup lang="ts">
import { shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import PageLayout from '@/components/PageLayout'

const router = useRouter()
const count = shallowRef(router.historyState.get<number>('count'))

function handleConfirm() {
  router.historyState.setDeferred('count', count.value)
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
