// 与宿主 @opentui/solid 的 transformSolidSource 同款管道：
// babel-preset-solid（moduleName: @opentui/solid, generate: universal）+ @babel/preset-typescript。
// tsc 不做 Solid JSX 响应式变换，会导致 UI 表达式一次性求值、永不刷新，故只用 tsc 做类型检查。
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { transformAsync } from "@babel/core"

const root = dirname(fileURLToPath(import.meta.url))
const entry = join(root, "src/tui.tsx")
const outfile = join(root, "dist/tui.js")

const source = await readFile(entry, "utf8")
const result = await transformAsync(source, {
  filename: entry,
  configFile: false,
  babelrc: false,
  presets: [
    ["babel-preset-solid", { moduleName: "@opentui/solid", generate: "universal" }],
    ["@babel/preset-typescript", {}],
  ],
})

if (!result?.code) throw new Error("babel produced no output")
await mkdir(dirname(outfile), { recursive: true })
await writeFile(outfile, result.code)
console.log(`built ${outfile} (${result.code.length} bytes)`)
