import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
const __dirname = dirname(fileURLToPath(import.meta.url))
const BT = String.fromCharCode(96)
const filePath = join(__dirname, '..', 'src', 'app', 'page.tsx')
const src = readFileSync(filePath, 'utf8')

// find "아래 버튼으로" and look at what follows
const idx = src.indexOf("아래 버튼으로 현금을 추가해 보세요'")
console.log('pos:', idx)
const after = src.substring(idx + 20, idx + 80)
// print char codes
for (const c of after) {
  const code = c.charCodeAt(0)
  if (code < 32 || code > 126) process.stdout.write(`[${code}]`)
  else process.stdout.write(c)
}
console.log()
