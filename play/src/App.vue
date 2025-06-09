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
.page-in-enter-active,
.page-in-leave-active,
.page-out-enter-active,
.page-out-leave-active {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: var(--color-body);
  overflow: hidden;
  will-change: transform;
  transition: transform 0.3s linear;
}

.page-in-leave-from {
  z-index: -1;
}
.page-in-enter-from {
  z-index: 10;
  transform: translateX(100%);
}
.page-in-enter-to {
  z-index: 10;
}

.page-out-enter-from {
  z-index: -1;
}
.page-out-leave-from {
  z-index: 10;
}
.page-out-leave-to {
  z-index: 10;
  transform: translateX(100%);
}
</style>
