<script setup lang="ts">
import type { PageLayoutProps } from './interface'
import { NavigationDirection } from '@vue-spark/router-plugins/navigation-direction'
import { isFunction } from 'nice-fns'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

defineOptions({
  name: 'PageLayout',
})

const props = withDefaults(defineProps<PageLayoutProps>(), {
  appBar: true,
  tabBar: null,
  backTop: true,
  hideBack: null,
  disableBack: false,
})

const router = useRouter()
const route = useRoute()
// 仅在初始化时获取元数据，不随路由变更而刷新
const routeMeta = route.meta

const title = computed(() => props.title || routeMeta.title)

const tabBarEnabled = !!routeMeta.tabBar
const tabBarRoutes = tabBarEnabled ? router.getRoutes().filter(route => route.meta.tabBar) : []
const activeTab = route.path

// 返回上级页面
const hideBack = computed(() => props.hideBack ?? !!tabBarEnabled)
function handleBack() {
  if (hideBack.value) return

  if (isFunction(props.onBack)) {
    props.onBack()
    return
  }

  // 遇到其他网页跳转到非导航页时通过 `replace('/')` 跳转回导航页
  const previousRoute = router.previousRoute.value
  if (previousRoute && previousRoute.fullPath === '/' && !tabBarEnabled) {
    router.navigationDirection.setNextDirection(NavigationDirection.backward)
    router.replace('/')
    return
  }
  router.back()
}
</script>

<template>
  <div class="page-layout">
    <VarAppBar
      class="page-layout__app-bar"
      :title
      title-position="center"
      border
      safe-area-top
    >
      <template
        v-if="!hideBack"
        #left
      >
        <VarButton
          color="transparent"
          text-color="#fff"
          round
          text
          :disabled="disableBack"
          @click="handleBack"
        >
          <VarIcon name="chevron-left" />
        </VarButton>
      </template>

      <template #right>
        <VarLoading
          v-show="$router.isNavigating.value"
          color="#fff"
        />
      </template>
    </VarAppBar>

    <div class="page-layout__main-wrapper">
      <div
        class="page-layout__main scrollable"
        v-bind="$attrs"
      >
        <slot />
      </div>

      <VarBackTop v-if="backTop" />
    </div>

    <VarBottomNavigation
      v-if="tabBarEnabled"
      class="page-layout__tab-bar"
      :active="activeTab"
      border
      safe-area
    >
      <VarBottomNavigationItem
        v-for="item in tabBarRoutes"
        :key="item.path"
        :name="item.path"
        :label="item.meta.title"
        :icon="item.meta.icon"
        @click="$router.replace(item.path)"
      />
    </VarBottomNavigation>
  </div>
</template>

<style scoped>
/* 修复移动端切换切面时会存在布局塌陷问题 */
.page-layout {
  position: absolute;
  top: 0;
  bottom: 0;
}

.page-layout {
  display: flex;
  flex-direction: column;
  width: 100%;

  > &__app-bar,
  > &__tab-bar {
    flex: 0 0 auto;
  }

  > &__main-wrapper {
    flex: 1;
    min-height: 0;

    .page-layout__main {
      position: relative;
      height: 100%;
      overflow-y: auto;
    }
  }
}
</style>
