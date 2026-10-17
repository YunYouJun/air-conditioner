# Architecture

Air Conditioner 使用 monorepo 多包结构，将业务逻辑和框架渲染拆开。

```text
packages/
├── core/    # 状态、动作、存储、通知和音效接口
├── react/   # React 组件库（src/lib）与网站；网站直接用组件库的空调和遥控器
├── vue/     # Vue Provider、composable、组件与演示入口
└── widget/  # 原生 Web Component
```

三种渲染（Vue、React 组件库、Web Component）共用同一份 `style.css`（Vue 包里的是源文件，React 与 Web Component 由脚本同步，有测试检查），各自只有很薄的一层模板。网站（ac.yunyoujun.cn）不再单独实现空调：用 React 组件库的 `AirConditioner`（`size="wide"` 长款机身），网站独有的宣传贴纸作为子元素贴在机身上，3D 模式另外按需加载。新功能只需要改 core 和 `style.css`，四处同时生效。

## Core

`@yunlefun-home/air-conditioner-core` 是唯一的状态来源，导出：

- `AcState`、`AcMode`、`AcAction`
- `defaultAcState`
- `minTemperature`、`maxTemperature`
- `acReducer(state, action)`
- `createAirConditionerStore(options)`

核心包不在模块初始化时访问 DOM，因此可以被 React、Vue、Web Component 和测试环境复用。

## Framework Adapters

React 与 Vue 适配层只负责：

- 将 core store 接入对应框架的响应式系统。
- 暴露组件和 hook/composable。
- 渲染 UI 和处理用户输入。

公共组件不包含站点路由、GTM、AdSense 或部署配置。

## Web Component

`@air-conditioner/widget` 使用原生 Custom Element 和 Shadow DOM：

- 自定义元素：`air-conditioner-widget`
- 属性：`storage-key`、`mode`、`status`、`temperature`、`title`
- 事件：`ac-change`、`ac-notify`

它只依赖 `@yunlefun-home/air-conditioner-core`，不引入 React 或 Vue runtime。
