import { useEffect, useRef } from 'react'
import { useAppDispatch } from './useAppDispatch'
import { useAppSelector } from './useAppSelector'
import { upsertMedicationAlert, removeMedicationAlert } from '../store/slices/alertsSlice'
import type { MedicationAlert } from '../store/slices/alertsSlice'

// ── 주파수 문자열 → 투여 간격(분) 파싱 ──────────────────────────────────────
// 지원 패턴: Q2H, Q4H, Q6H, Q8H, Q12H, QD, BID, TID, PRN, 지속, 기타
function parseIntervalMinutes(frequency: string): number | null {
  const f = frequency.toUpperCase().trim()

  // Q{N}H 패턴 (예: Q2H, Q4H, Q6H, Q8H, Q12H)
  const qhMatch = f.match(/Q(\d+)H/)
  if (qhMatch) return parseInt(qhMatch[1], 10) * 60

  if (f.includes('QD') || f === 'QD') return 24 * 60          // 1일 1회
  if (f.includes('BID'))              return 12 * 60           // 1일 2회
  if (f.includes('TID'))              return 8 * 60            // 1일 3회
  if (f.includes('QID'))              return 6 * 60            // 1일 4회

  // PRN, 지속, 기타 — 타이머 불필요
  return null
}

// ── 현재 시각 기준 다음 투여까지 남은 분 계산 ────────────────────────────────
// 근무 시작 시각(06:00)을 기준으로 interval 배수 중 가장 가까운 미래 시각을 찾는다.
function minutesUntilNextDose(intervalMinutes: number): number {
  const now = new Date()
  // 오늘 06:00 기준점
  const base = new Date(now)
  base.setHours(6, 0, 0, 0)

  const elapsedMs = now.getTime() - base.getTime()
  const intervalMs = intervalMinutes * 60 * 1000

  // 경과 시간을 interval로 나눈 나머지 → 다음 투여까지 남은 시간
  const remainder = elapsedMs % intervalMs
  const msUntilNext = intervalMs - remainder

  return Math.round(msUntilNext / 60000)
}

/**
 * useMedicationTimer
 *
 * 60초마다 담당 환자들의 처방 약물 투여 시간을 계산하고,
 * 10분 이내 투여 예정인 약물에 대해 Redux alertsSlice에 알림을 upsert한다.
 *
 * @param patientIds - 모니터링할 환자 ID 배열 (빈 배열이면 비활성)
 */
export function useMedicationTimer(patientIds: string[]) {
  const dispatch    = useAppDispatch()
  const allPatients = useAppSelector(s => s.patients.allPatients)

  // 최신 환자 목록을 ref로 유지 (stale closure 방지)
  const patientsRef = useRef(allPatients)
  useEffect(() => {
    patientsRef.current = allPatients
  }, [allPatients])

  const patientIdsRef = useRef(patientIds)
  useEffect(() => {
    patientIdsRef.current = patientIds
  }, [patientIds])

  useEffect(() => {
    if (patientIds.length === 0) return

    const check = () => {
      const patients = patientsRef.current
      const ids      = patientIdsRef.current

      // 이번 체크에서 활성화된 alert ID 집합
      const activeAlertIds = new Set<string>()

      for (const pid of ids) {
        const patient = patients.find(p => p.id === pid)
        if (!patient) continue

        for (const med of patient.medications) {
          const interval = parseIntervalMinutes(med.frequency)
          if (interval === null) continue  // PRN / 지속 — 타이머 불필요

          const minutesLeft = minutesUntilNextDose(interval)
          const alertId = `med-${pid}-${med.name.replace(/\s+/g, '_')}`

          // 10분 이내 투여 예정 → 알림 생성
          if (minutesLeft <= 10) {
            const alert: MedicationAlert = {
              id: alertId,
              patientId: pid,
              patientName: patient.name,
              roomNumber: patient.roomNumber,
              medicationName: med.name,
              minutesUntilDue: minutesLeft,
              type: minutesLeft <= 0 ? 'danger' : 'warn',
              message:
                minutesLeft <= 0
                  ? `🚨 ${patient.roomNumber}호 ${patient.name} — ${med.name} 투여 시간 도달`
                  : `💊 ${patient.roomNumber}호 ${patient.name} — ${med.name} ${minutesLeft}분 후 투여 예정`,
              timestamp: Date.now(),
            }
            dispatch(upsertMedicationAlert(alert))
            activeAlertIds.add(alertId)
          } else {
            // 10분 초과 → 기존 알림 제거
            dispatch(removeMedicationAlert(alertId))
          }
        }
      }
    }

    // 즉시 1회 실행 후 60초마다 반복
    check()
    const interval = setInterval(check, 60_000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, patientIds.length])
}

// ── 개별 약물의 다음 투여까지 남은 시간 문자열 반환 (MedicationList용) ────────
export function getMedicationCountdown(frequency: string): string | null {
  const interval = parseIntervalMinutes(frequency)
  if (interval === null) return null

  const minutes = minutesUntilNextDose(interval)

  if (minutes <= 5)       return '🔴 지금 투여' // 5분 이내
  if (minutes <= 20)      return '🟠 곧 투여'   // 6~20분
  if (minutes < 60)       return `${minutes}분 후`

  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}시간 ${m}분 후` : `${h}시간 후`
}
