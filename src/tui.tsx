import { createEffect, createMemo, createSignal, onCleanup } from "solid-js"
import { Plugin, usePlugin } from "@opencode/plugin/tui"

interface ContentItem {
  type: string
  time?: { created?: number; completed?: number }
}

interface SessionLikeMessage {
  type: string
  summary?: boolean
  time: { created: number; completed?: number }
  tokens?: {
    input: number
    output: number
    reasoning: number
    cache: { read: number; write: number }
  }
  content?: ReadonlyArray<ContentItem>
}

interface Metrics {
  /** 平均每秒生成速度（output + reasoning tokens / 累计生成时长） */
  tps?: number
  /** 缓存命中率 = cacheRead / (input + cacheRead + cacheWrite) */
  cacheHit?: number
  /** 平均首 token 返回时延（TTFT：最早 content 起始时间 − 消息创建时间） */
  ttft?: number
}

/**
 * 单条消息的首 token 时延（毫秒）。
 * 消息 `time.created` 是请求发出时刻，`content` 中最早一项的 `time.created`
 * 是首个 token（reasoning/text）开始落盘的时刻，二者之差即该轮的 TTFT。
 * 尚未产出任何 content 的消息返回 undefined。
 */
function messageTtft(message: SessionLikeMessage): number | undefined {
  if (message.summary) return undefined
  let first: number | undefined
  for (const item of message.content ?? []) {
    const created = item.time?.created
    if (typeof created !== "number") continue
    if (first === undefined || created < first) first = created
  }
  if (first === undefined) return undefined
  const delay = first - message.time.created
  return delay > 0 ? delay : undefined
}

function computeMetrics(messages: readonly SessionLikeMessage[]): Metrics {
  let generated = 0
  let elapsedMs = 0
  let freshInput = 0
  let cacheRead = 0
  let cacheWrite = 0
  let ttftTotal = 0
  let ttftCount = 0

  for (const message of messages) {
    if (message.type !== "assistant") continue

    const ttft = messageTtft(message)
    if (ttft !== undefined) {
      ttftTotal += ttft
      ttftCount += 1
    }

    const tokens = message.tokens
    if (!tokens) continue
    freshInput += tokens.input
    cacheRead += tokens.cache.read
    cacheWrite += tokens.cache.write

    const completed = message.time.completed
    if (completed === undefined) continue
    const elapsed = completed - message.time.created
    if (elapsed <= 0) continue
    generated += tokens.output + tokens.reasoning
    elapsedMs += elapsed
  }

  const metrics: Metrics = {}
  if (generated > 0 && elapsedMs > 0) {
    metrics.tps = generated / (elapsedMs / 1000)
  }
  const totalInput = freshInput + cacheRead + cacheWrite
  if (totalInput > 0) {
    metrics.cacheHit = cacheRead / totalInput
  }
  if (ttftCount > 0) {
    metrics.ttft = ttftTotal / ttftCount
  }
  return metrics
}

function formatDelay(ms: number): string {
  return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`
}

/**
 * 会改变 `session.message.list()` 内容或本插件所读字段的事件。
 *
 * 宿主在这些事件中会自动同步消息缓存，此处的显式订阅是兜底：新窗口打开时
 * 历史消息可能尚未拉取，先主动 `sync` 一次，之后每个事件再 `sync` 并 bump
 * revision，确保 `createMemo` 重算、指标跟随会话数据实时刷新。
 */
const REFRESH_EVENTS = [
  "session.created",
  "session.deleted",
  "session.forked",
  "session.execution.started",
  "session.execution.succeeded",
  "session.execution.failed",
  "session.execution.interrupted",
  "session.step.started",
  "session.step.ended",
  "session.step.failed",
  "session.text.started",
  "session.text.ended",
  "session.reasoning.started",
  "session.reasoning.ended",
  "session.usage.updated",
  "session.compaction.ended",
  "session.compaction.failed",
  "session.revert.committed",
  "session.inbox.delivered",
] as const

function TokenMetrics(props: { sessionID: string }) {
  const context = usePlugin()
  const [revision, setRevision] = createSignal(0)

  createEffect(() => {
    const sessionID = props.sessionID
    const sync = () => {
      const bump = () => setRevision((value) => value + 1)
      // 失败也 bump 一次，避免 Promise 永远不更新导致界面卡住
      context.data.session.message.sync(sessionID).then(bump, bump)
    }

    // 新窗口打开时历史消息尚未进入缓存，先主动拉一次
    try {
      sync()
    } catch {
      /* 主动同步失败时仍可依赖宿主的事件自动刷新 */
    }

    try {
      const offs = REFRESH_EVENTS.map((type) =>
        context.data.on(type, (event) => {
          // 事件负载的 sessionID 在 data 下，不在顶层
          if (event.data.sessionID === sessionID) sync()
        }),
      )
      onCleanup(() => {
        for (const off of offs) off()
      })
    } catch {
      /* 事件订阅不可用时仍可依赖宿主的事件自动刷新 */
    }
  })

  const metrics = createMemo(() => {
    revision()
    try {
      return computeMetrics(context.data.session.message.list(props.sessionID) as readonly SessionLikeMessage[])
    } catch {
      return {}
    }
  })

  const m = () => metrics()

  return (
    <box flexDirection="column">
        <text>
          <span>Speed </span>
          <span style={{ fg: context.theme.text.muted }}>
            {(() => {
              const v = m().tps
              return v !== undefined ? `${v.toFixed(1)} tok/s` : "-"
            })()}
          </span>
        </text>
        <text>
          <span>Cache </span>
          <span style={{ fg: context.theme.text.muted }}>
            {(() => {
              const v = m().cacheHit
              return v !== undefined ? `${Math.round(v * 100)}%` : "-"
            })()}
          </span>
        </text>
        <text>
          <span>TTFT </span>
          <span style={{ fg: context.theme.text.muted }}>
            {(() => {
              const v = m().ttft
              return v !== undefined ? formatDelay(v) : "-"
            })()}
          </span>
        </text>
    </box>
  )
}

export default Plugin.define({
  id: "top.youngxhui.sidebar.tokenmetrics",
  setup(context) {
    return context.ui.slot({
      append: "sidebar.content",
      render: (slot) => <TokenMetrics sessionID={slot.sessionID} />,
    })
  },
})
