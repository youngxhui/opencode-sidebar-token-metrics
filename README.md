# opencode-sidebar-token-metrics

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

## Development

```sh
# syntax/bundle check
npm run check          # or: bun run check

# try it locally without publishing
ln -s "$(pwd)/src/tui.tsx" ~/.config/opencode/plugins/token-metrics/tui.tsx
```

Plugin id: `top.youngxhui.sidebar.tokenmetrics`

## License

MIT
