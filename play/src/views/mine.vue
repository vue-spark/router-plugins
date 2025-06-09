<script setup lang="ts">
import { Snackbar } from '@varlet/ui'
import { onActivated, onDeactivated } from 'vue'
import PageLayout from '@/components/PageLayout'

onActivated(() => {
  Snackbar.info({
    content: '起始第 1000 行，再次进入观察滚动位置',
    duration: 10e3,
  })
})

onDeactivated(() => {
  Snackbar.clear()
})
</script>

<template>
  <PageLayout>
    <div style="position: relative; height: 200vh; text-align: center">
      <p
        v-for="i in 1000"
        :key="i"
      >
        <b>《我的》</b>第
        <span
          :style="{
            display: 'inline-block',
            width: '4em',
            fontWeight: 'bold',
            color: i % 2 === 0 ? 'red' : 'blue',
          }"
        >
          {{ 1000 + 1 - i }} </span>行
      </p>
    </div>
  </PageLayout>
</template>
