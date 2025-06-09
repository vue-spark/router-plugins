<script setup lang="ts">
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
.page-out-enter-active,
.page-out-leave-active,
.page-in-enter-active,
.page-in-leave-active {
  will-change: transform;
  transition:
    transform 0.3s ease-in-out,
    opacity 0.31s;
  height: 100%;
  width: 100%;
  top: 0;
  left: 0;
  position: absolute;
  backface-visibility: hidden;
}

.page-out-enter-from {
  transform: translateX(-80%);
}

.page-out-leave-active {
  transform: translateX(100%);
  z-index: 2;
}

.page-in-enter-from {
  transform: translateX(100%);
}

.page-in-leave-active {
  opacity: 1;
  transform: translateX(-80%);
}
</style>
