export interface PageLayoutProps {
  /**
   * 是否启用导航栏
   * @default true
   */
  appBar?: boolean
  /**
   * 导航栏标题
   * @default route.meta.title
   */
  title?: string

  /**
   * 是否启用底部导航栏
   * @default route.meta.tabBar
   */
  tabBar?: boolean | null

  /**
   * 是否启用返回顶部按钮
   * @default true
   */
  backTop?: boolean

  /**
   * 启用导航栏时有效，隐藏返回按钮，可通过 `slots['navBar:left']` 插槽自定义
   * @default route.meta.tabBar
   */
  hideBack?: boolean | null
  /**
   * 禁用返回按钮
   */
  disableBack?: boolean
  /**
   * 点击返回按钮时触发
   * @default router.back()
   */
  onBack?: () => void
}
