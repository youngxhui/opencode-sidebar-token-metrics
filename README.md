# opencode-sidebar-token-metrics

**English** | [简体中文](#简体中文)

An [OpenCode](https://opencode.ai) TUI plugin that adds a live metrics block to the sidebar:

```
Speed 12.4 tok/s
Cache 87%
TTFT 3.9s
```

| Metric | Meaning |
| --- | --- |
| **Speed** | Average generation speed: `(output + reasoning tokens) / total generation time` across completed assistant messages. |
| **Cache** | Prompt cache hit rate: `cacheRead / (input + cacheRead + cacheWrite)`. |
| **TTFT** | Average time-to-first-token: for each assistant message, the earliest `content` item's `time.created` minus the message's `time.created`. Summary messages and messages with no content yet are skipped. |

## Install

```sh
opencode plugin add opencode-sidebar-token-metrics
```

Or add it to your `~/.config/opencode/cli.json`:

```json
{
  "plugins": ["opencode-sidebar-token-metrics"]
}
```

Restart the OpenCode TUI to see the metrics block.

## Requirements

- OpenCode v2
- Terminal wide enough to show the sidebar (the block renders in `sidebar.content`)

`solid-js`, `@opentui/core`, and `@opentui/solid` are peer dependencies resolved by the OpenCode runtime — you do not install them yourself.

The published entrypoint is **pre-built** (`dist/tui.js`, compiled with TypeScript using the `@opentui/solid` JSX runtime), so the OpenCode runtime never has to transpile TSX with an ambiguous JSX setting.

## Development

```sh
# build dist/tui.js (also runs automatically via prepack before npm pack/publish)
bun run build

# try it locally without publishing
ln -s "$(pwd)/dist/tui.js" ~/.config/opencode/plugins/token-metrics/tui.js
```

`dist/` is a build artifact and is gitignored; `prepack` regenerates it on every pack/publish.

Plugin id: `top.youngxhui.sidebar.tokenmetrics`

## License

MIT

---

# 简体中文

[English](#opencode-sidebar-token-metrics) | **简体中文**

一个 [OpenCode](https://opencode.ai) TUI 插件，在侧边栏添加实时指标块：

```
Speed 12.4 tok/s
Cache 87%
TTFT 3.9s
```

| 指标 | 含义 |
| --- | --- |
| **Speed** | 平均生成速度：所有已完成的 assistant 消息的 `(output + reasoning tokens) / 总生成耗时`。 |
| **Cache** | 提示词缓存命中率：`cacheRead / (input + cacheRead + cacheWrite)`。 |
| **TTFT** | 平均首 token 返回时延（Time To First Token）：对每条 assistant 消息，取其最早 `content` 项的 `time.created` 减去消息自身的 `time.created`。跳过 summary 消息和尚无 content 的消息。 |

## 安装

```sh
opencode plugin add opencode-sidebar-token-metrics
```

或者在 `~/.config/opencode/cli.json` 中添加：

```json
{
  "plugins": ["opencode-sidebar-token-metrics"]
}
```

重启 OpenCode TUI 即可看到指标块。

## 环境要求

- OpenCode v2
- 终端宽度足以显示侧边栏（该块渲染在 `sidebar.content` 槽位）

`solid-js`、`@opentui/core`、`@opentui/solid` 是 peer 依赖，由 OpenCode 运行时解析 —— 无需自行安装。

发布包的入口是**预构建产物**（`dist/tui.js`，用 TypeScript 配合 `@opentui/solid` JSX runtime 编译），因此 OpenCode 运行时无需再转译 TSX，也就不会遇到 JSX runtime 歧义问题。

## 本地开发

```sh
# 构建 dist/tui.js（npm pack/publish 前会通过 prepack 自动执行）
bun run build

# 不发布、直接本地试用
ln -s "$(pwd)/dist/tui.js" ~/.config/opencode/plugins/token-metrics/tui.js
```

`dist/` 是构建产物，已被 gitignore；`prepack` 会在每次 pack/publish 时重新生成。

插件 id：`top.youngxhui.sidebar.tokenmetrics`

## 许可证

MIT
