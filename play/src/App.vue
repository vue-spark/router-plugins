<script setup lang="ts">
import { ElLoading } from 'element-plus'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Logo from '@/assets/logo.svg'

const router = useRouter()
router.beforeEach(async () => {
  // await sleep(1e3)
})

watch(router.isNavigating, (value) => {
  value ? ElLoading.service({ text: 'Navigating...' }) : ElLoading.service().close()
})

const transitionName = ref<string>()
router.navigationDirection.listen((direction) => {
  switch (direction) {
    case 'forward':
      transitionName.value = 'page-in'
      break
    case 'backward':
      transitionName.value = 'page-out'
      break
    default:
      transitionName.value = undefined
  }
})

const isAnimating = ref(false)
</script>

<template>
  <PlusLayout
    class="layout"
    :class="{ 'is-animating': isAnimating }"
    :header-props="{
      title: 'Router Plugins',
      logo: Logo,
      hasUserInfo: false,
    }"
    :has-breadcrumb="false"
    :has-sidebar="false"
  >
    <div class="view-container">
      <RouterView v-slot="{ Component: viewComponent, route }">
        <Transition
          :name="transitionName"
          :css="!!transitionName"
          @before-enter="isAnimating = true"
          @after-enter="isAnimating = false"
        >
          <KeepAlive>
            <Component
              :is="viewComponent"
              :key="route.fullPath"
            />
          </KeepAlive>
        </Transition>
      </RouterView>
    </div>
  </PlusLayout>
</template>

<style scoped>
.layout {
  .view-container {
    position: relative;
  }

  &.is-animating {
    :deep(.plus-layout-content) {
      .el-main {
        overflow: hidden;
      }
    }
  }
}

.page-out-enter-active,
.page-out-leave-active,
.page-in-enter-active,
.page-in-leave-active {
  will-change: transform;
  transition: transform 0.25s ease-out;
  height: 100%;
  width: 100%;
  top: 0;
  left: 0;
  position: absolute;
  backface-visibility: hidden;
  perspective: 1000;
}

.page-out-enter-from {
  transform: translateX(-30%);
}

.page-out-leave-active {
  transform: translateX(100%);
  z-index: 2;
}

.page-in-enter-from {
  transform: translateX(100%);
}

.page-in-leave-active {
  transform: translateX(-30%);
}
</style>
