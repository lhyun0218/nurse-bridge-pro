import type { Nurse, Patient, NurseScheduleRow } from '../types'

export type PatientAssignment = Record<string, { Day?: string; Evening?: string; Night?: string }>

/**
 * 개선된 자동 배정 알고리즘
 * - Shift별로 가용한 간호사 풀을 만들고, 각 환자에 대해 Day/Eve/Night 각각 다른 간호사를 배정
 * - 각 Shift별로 간호사별 부하를 균등화(할당 횟수 최소화)
 * - 간호사 풀이 부족하면 재사용하지만 동일 환자에 동일 간호사가 중복되지 않도록 우선시함
 */
export function autoAssignPatients(
  nurses: Nurse[],
  patients: Patient[],
  options?: { maxPerNurse?: number; balance?: boolean; scheduleRows?: NurseScheduleRow[]; dateIndex?: number }
): PatientAssignment {
  const assignments: PatientAssignment = {}

  // byShift 기반: 스케줄 정보가 있으면 해당 날짜의 스케줄로, 없으면 `shiftType`으로 결정
  const scheduleRows = options?.scheduleRows ?? []
  const dateIndex = typeof options?.dateIndex === 'number' ? options!.dateIndex! : new Date().getDate() - 1

  const byShift: Record<'Day'|'Evening'|'Night', Nurse[]> = { Day: [], Evening: [], Night: [] }
  if (scheduleRows.length > 0) {
    // 스케줄 행을 이용해 오늘 해당 shift에 근무하는 간호사만 포함
    const shiftCodeFor = (code: 'D'|'E'|'N') => (code === 'D' ? 'Day' : code === 'E' ? 'Evening' : 'Night') as 'Day'|'Evening'|'Night'
    for (const row of scheduleRows) {
      const code = row.shifts[dateIndex]
      if (!code || code === 'OFF') continue
      const nurse = nurses.find(n => n.id === row.nurseId)
      if (!nurse) continue
      const shift = shiftCodeFor(code)
      if (nurse.status === 'Active' && nurse.role === 'Nurse') byShift[shift].push(nurse)
    }
  } else {
    byShift.Day = nurses.filter(n => n.shiftType === 'Day' && n.status === 'Active' && n.role === 'Nurse')
    byShift.Evening = nurses.filter(n => n.shiftType === 'Evening' && n.status === 'Active' && n.role === 'Nurse')
    byShift.Night = nurses.filter(n => n.shiftType === 'Night' && n.status === 'Active' && n.role === 'Nurse')
  }

  // 스케줄 기반으로 찾았는데 특정 shift에 인원이 없으면 shiftType 기반 풀로 백업
  for (const s of ['Day', 'Evening', 'Night'] as const) {
    if ((byShift[s] || []).length === 0) {
      byShift[s] = nurses.filter(n => n.shiftType === s && n.status === 'Active' && n.role === 'Nurse')
    }
  }

  // 추적: shift별로 각 간호사의 할당 횟수
  const load: Record<'Day'|'Evening'|'Night', Record<string, number>> = {
    Day: {}, Evening: {}, Night: {},
  }
  for (const s of ['Day', 'Evening', 'Night'] as const) {
    for (const n of byShift[s]) load[s][n.id] = 0
  }

  const maxPerNurse = options?.maxPerNurse ?? 8
  const balanceMode = options?.balance ?? true

  // 초기화
  for (const p of patients) assignments[p.id] = {}

  // 환자별로 세 교대를 할당 — 각 환자마다 가능한 한 다른 간호사를 배정
  for (const p of patients) {
    const used: Set<string> = new Set()

    for (const s of ['Day', 'Evening', 'Night'] as const) {
      const pool = byShift[s]
      if (pool.length === 0) continue

      // 후보: 아직 이 환자에 할당되지 않았고 capacity 미만인 간호사 우선
      // 균형 모드일 경우 해당 shift의 부하보다 전체(전역) 부하가 낮은 간호사를 우선 선택
      const globalLoadFor = (nid: string) => (load.Day[nid] ?? 0) + (load.Evening[nid] ?? 0) + (load.Night[nid] ?? 0)

      let candidates = pool
        .filter(n => !used.has(n.id) && (load[s][n.id] ?? 0) < maxPerNurse)
        .sort((a, b) => {
          if (balanceMode) {
            const ga = globalLoadFor(a.id), gb = globalLoadFor(b.id)
            if (ga !== gb) return ga - gb
          }
          return (load[s][a.id] ?? 0) - (load[s][b.id] ?? 0)
        })

      // capacity를 만족하는 후보가 없으면, capacity 초과 허용 후보로 확장(가장 적게 부하된 순)
      if (candidates.length === 0) {
        candidates = pool
          .filter(n => !used.has(n.id))
          .sort((a, b) => {
            if (balanceMode) {
              const ga = globalLoadFor(a.id), gb = globalLoadFor(b.id)
              if (ga !== gb) return ga - gb
            }
            return (load[s][a.id] ?? 0) - (load[s][b.id] ?? 0)
          })
      }

      let pick: Nurse | undefined
      if (candidates.length > 0) {
        pick = candidates[0]
      } else {
        // 모든 간호사가 이미 이 환자에 배정돼있다면, 허용 범위 내에서 가장 낮게 로드된 간호사 선택
        const fallback = pool.sort((a, b) => (load[s][a.id] ?? 0) - (load[s][b.id] ?? 0))
        pick = fallback[0]
      }

      if (pick) {
        assignments[p.id][s] = pick.id
        used.add(pick.id)
        load[s][pick.id] = (load[s][pick.id] ?? 0) + 1
      }
    }
  }

  return assignments
}

export default autoAssignPatients
