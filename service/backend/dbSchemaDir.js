import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// 서비스 DB 스키마(SQL)는 저장소 루트의 db/service/ 한 곳에서 관리한다.
// 그런데 backend 기준 상대 경로가 실행 환경마다 다르다:
//   - 저장소에서 직접 실행: <root>/service/backend → ../../db/service
//   - 도커 이미지 안:       /app/backend        → ../db/service
// 둘 다 지원하려고 실제로 존재하는 쪽을 고른다.
const __dirname = dirname(fileURLToPath(import.meta.url))

const CANDIDATES = [
  join(__dirname, '..', '..', 'db', 'service'),
  join(__dirname, '..', 'db', 'service'),
]

export function resolveDbSchemaDir() {
  const found = CANDIDATES.find((candidate) => existsSync(candidate))
  if (!found) {
    throw new Error(`db/service 스키마 폴더를 찾지 못했다. 확인한 경로: ${CANDIDATES.join(', ')}`)
  }
  return found
}

export function dbSchemaPath(fileName) {
  return join(resolveDbSchemaDir(), fileName)
}
