<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
function handleBack(refreshNow = false) {
  router.historyState.setMemory({ refreshNow })
  router.back()
}
</script>

<template>
  <div>
    <h4>Detail</h4>

    <ElButton @click="handleBack()">
      Back
    </ElButton>

    <ElButton @click="handleBack(true)">
      Back & Refresh Now
    </ElButton>
  </div>
</template>
