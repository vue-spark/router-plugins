# Changelog

## [0.1.0-1](https://github.com/vue-spark/router-plugins/compare/v0.1.0-0...v0.1.0-1) (2025-06-09)

### Features

- **navigation-direction:** 新增 `setNextDirection` 方法 ([6665d40](https://github.com/vue-spark/router-plugins/commit/6665d40b8d60ec697f668c321fb18116b2cb6363))
- **navigation-direction:** 添加 originalPush 和 originalReplace 属性到 RouterHistory 接口 ([474df0a](https://github.com/vue-spark/router-plugins/commit/474df0a84a108506f537efd532821babb0b550cc))
- **src/index:** 新增具名导出方式 ([7f405ce](https://github.com/vue-spark/router-plugins/commit/7f405ce42c6e951bcc1f22afeaab7e25599d900c))

### Bug Fixes

- **history-state:** 修复 `HistoryStatePlugin` 手动调用 `routerHistory.replace` 导致 `NavigationDirectionPlugin` 方向判断错误 ([64e5e1d](https://github.com/vue-spark/router-plugins/commit/64e5e1db9b3041bcb8c236261ef61e1e2d4a94e1))
- **scroller:** 修复 `Scroller` 接口中 `positionsMap` 的类型定义 ([cbec261](https://github.com/vue-spark/router-plugins/commit/cbec2619bfa80fa6ccada055f95f647fd52c4589))

### Chores

- **history-state:** 优化代码结构 ([566d855](https://github.com/vue-spark/router-plugins/commit/566d855361ac2d8cbdc6877efcbc940a9c3ffbe7))
- **play:** 优化导航方向动画样式 ([70be3c7](https://github.com/vue-spark/router-plugins/commit/70be3c7794a2c478fef1723df1391ccca0666ba8))
- **play:** 更新示例代码 ([20ac668](https://github.com/vue-spark/router-plugins/commit/20ac668f3eb724693fd17f9530bc04597bc5342c))
- **router:** 添加注释解释了路由卸载钩子的触发条件和实现逻辑 ([b5d8236](https://github.com/vue-spark/router-plugins/commit/b5d82363c400d329ee97a3eaa56bdc4ba7e343a0))

### Refactors

- **navigation-direction:** 更改 `currentDirection` 默认值为 `NavigationDirection.unchanged` ([f3b3f91](https://github.com/vue-spark/router-plugins/commit/f3b3f913e9b348e8c397f18018ca8d3d554dde29))
- **scroller:** 删除了 `autoCollect` 选项功能，优化了 `scrollOnlyBackward` 选项功能 ([e3b164a](https://github.com/vue-spark/router-plugins/commit/e3b164a57f2221c71cdf96b5b3254fa6cffeb427))

### Docs

- **README:** 更新中文和英文文档 ([1ebdc52](https://github.com/vue-spark/router-plugins/commit/1ebdc52722149d5962971a87b407036810ff935e))

## 0.1.0-0 (2025-06-06)

### Features

- init project ([8e143f1](https://github.com/vue-spark/router-plugins/commit/8e143f133ef1e37478ba629fd7af34e7c4f6379f))
