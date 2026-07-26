# Testing

测试分三层，避免拆包时破坏当前功能。

## Unit Tests

`@yunlefun-home/air-conditioner-core` 覆盖：

- 默认状态。
- reducer 动作。
- 温度上下限。
- storage 可用和不可用两种情况。
- 通知事件生成。

`@air-conditioner/widget` 覆盖：

- Custom Element 注册和挂载。
- `ac-change` 事件。
- `ac-notify` 事件。

## End-to-End Tests

Playwright 覆盖现有 React 演示站：

- 首页标题和空调渲染。
- 开关状态切换。
- 冷热模式切换。
- 温度升降。
- 16/31 度边界提示。
- localStorage 持久化。
- `/rc` 独立遥控器。

## Build Checks

发布前运行：

```bash
pnpm -r build
pnpm -r typecheck
pnpm test
pnpm docs:build
pnpm pack --dry-run
```
