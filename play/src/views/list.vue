<script setup lang="ts">
import { onActivated, ref } from 'vue'
import { useRouter } from 'vue-router'

const now = ref(new Date())

const router = useRouter()
onActivated(() => {
  const refreshNow = router.historyState.take<boolean>('refreshNow')
  if (refreshNow) {
    now.value = new Date()
  }
})
</script>

<template>
  <div>
    <ElButton @click="$router.push('/list/detail')">
      Goto Detail
    </ElButton>

    <p>{{ now.toLocaleString() }}</p>
  </div>
</template>
