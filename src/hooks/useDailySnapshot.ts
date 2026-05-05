import { useEffect, useRef } from 'react'
import { Asset } from '@/types'

interface UseDailySnapshotOptions {
  userId: string | undefined
  assets: Asset[]
}

// KST 기준 오늘 날짜 문자열 (YYYY-MM-DD)
function getKSTDateString(): string {
  const now = new Date()
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return kst.toISOString().slice(0, 10)
}

// 현재 KST 시간이 09:30~09:40 창 안인지 확인
function isInSnapshotWindow(): boolean {
  const now = new Date()
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  const hhmm = kst.getUTCHours() * 60 + kst.getUTCMinutes()
  return hhmm >= 9 * 60 + 30 && hhmm < 9 * 60 + 40
}

// localStorage key: 오늘 기록 완료 여부
const getStorageKey = (userId: string) => `daily_snapshot_done:${userId}`

export function useDailySnapshot({ userId, assets }: UseDailySnapshotOptions) {
  // assets가 아직 로딩 중이면 빈 배열이므로, 실제 자산이 있을 때만 동작
  const assetsRef = useRef(assets)
  assetsRef.current = assets

  useEffect(() => {
    if (!userId) return

    const trySnapshot = async () => {
      if (!isInSnapshotWindow()) return
      if (assetsRef.current.length === 0) return

      const today = getKSTDateString()
      const storageKey = getStorageKey(userId)
      const lastDone = localStorage.getItem(storageKey)

      // 이미 오늘 기록했으면 스킵
      if (lastDone === today) return

      try {
        const res = await fetch('/api/daily-snapshot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, assets: assetsRef.current }),
        })

        const data = await res.json()

        if (data.success || data.skipped) {
          // 성공 또는 서버 측에서 이미 기록됨 → 로컬도 완료로 표시
          localStorage.setItem(storageKey, today)
          console.info('[DailySnapshot] 기록 완료:', data)
        }
      } catch (err) {
        // silent fail — 내일 또는 다음 체크 시 재시도
        console.warn('[DailySnapshot] 호출 실패, 나중에 재시도:', err)
      }
    }

    // 마운트 시 즉시 한 번 체크
    trySnapshot()

    // 이후 30초마다 재체크 (창 안에 진입하는 시점을 놓치지 않기 위해)
    const interval = setInterval(trySnapshot, 30 * 1000)
    return () => clearInterval(interval)
  }, [userId])
}
