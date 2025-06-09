export interface HighlightCodeProps {
  /**
   * 需要显示的代码
   */
  code: string
  /**
   * 代码语言
   * @default 'ts'
   */
  language?: string
  /**
   * 容器高度
   */
  height?: string | number
  /**
   * 容器最大高度
   */
  maxHeight?: string | number
  /**
   * 容器最小高度
   * @default 100
   */
  minHeight?: string | number
}
