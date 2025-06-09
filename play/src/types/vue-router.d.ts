declare module 'vue-router' {
  interface RouteMeta {
    /**
     * 导航栏标题
     */
    title?: string
    /**
     * 是否启用底部导航栏
     */
    tabBar?: boolean
    /**
     * 底部导航栏图标
     */
    icon?: string
  }
}

export {}
