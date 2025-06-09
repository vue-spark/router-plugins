<script setup lang="ts">
import type { Signature } from '@varlet/ui'
import { shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import PageLayout from '@/components/PageLayout'

const router = useRouter()
const signature$ = shallowRef<Signature>()
const signature = shallowRef<string>()

function handleConfirm() {
  signature.value = signature$.value?.confirm()
  router.historyState.setDeferred('signature', signature.value)
  router.back()
}

function handleReset() {
  signature.value = ''
  signature$.value?.reset()
}
</script>

<template>
  <PageLayout>
    <div
      style="display: flex; flex-direction: column; gap: 20px; max-width: 800px; margin: 20px auto"
    >
      <VarSignature
        ref="signature$"
        style="background-color: aliceblue; height: 400px"
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
        <VarButton
          type="warning"
          @click="handleReset"
        >
          重置
        </VarButton>
      </div>
    </div>
  </PageLayout>
</template>
