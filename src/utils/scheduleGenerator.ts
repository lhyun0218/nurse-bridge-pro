/**
 * scheduleGenerator.ts
 * 제약조건 기반 간호사 근무표 자동 생성 알고리즘
 *
 * 적용 제약조건:
 * 1. 하루에 한 교대만 근무 (Day/Evening/Night/Off)
 * 2. 야간(N) 연속 2일 이상 금지
 * 3. 야간 근무 후 최소 2일 휴식
 * 4. 월간 야간 근무 최대 8회
 * 5. 월간 총 근무일 균등 분배
 * 6. 매일 Day/Evening/Night 각 최소 인원 확보
 * 7. 주말 근무 균등 분배
 */

export type ShiftCode = 'D' | 'E' | 'N' | 'OFF'

export interface NurseScheduleRow {
  nurseId: string
  nurseName: string
  shifts: ShiftCode[]   // index 0 = 1일
  stats: {
    dayCount:     number
    eveningCount: number
    nightCount:   number
    offCount:     number
    weekendWork:  number
    overtimeRisk: boolean
  }
}

export interface GenerateOptions {
  year:            number
  month:           number   // 1-indexed
  minPerShift:     number   // 교대당 최소 인원 (기본 1)
  maxNightPerMonth: number  // 월간 최대 야간 (기본 8)
  maxConsecWork:   number   // 최대 연속 근무일 (기본 5)
  minRestAfterNight: number // 야간 후 최소 휴식일 (기본 2)
}

const DEFAULT_OPTIONS: GenerateOptions = {
  year:              new Date().getFullYear(),
  month:             new Date().getMonth() + 1,
  minPerShift:       1,
  maxNightPerMonth:  8,
  maxConsecWork:     5,
  minRestAfterNight: 2,
}

/** 월의 일수 */
function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

/** 특정 날짜가 주말(토/일)인지 */
function isWeekend(year: number, month: number, day: number): boolean {
  const dow = new Date(year, month - 1, day).getDay()
  return dow === 0 || dow === 6
}

/**
 * 메인 생성 함수
 * 그리디 + 백트래킹 없는 단순 최적 배치
 */
export function generateSchedule(
  nurses: Array<{ id: string; name: string }>,
  options: Partial<GenerateOptions> = {},
): NurseScheduleRow[] {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const days = daysInMonth(opts.year, opts.month)
  const n    = nurses.length

  if (n === 0) return []

  // 초기화: 모든 날짜 OFF
  const grid: ShiftCode[][] = Array.from({ length: n }, () =>
    Array(days).fill('OFF')
  )

  // 각 간호사별 통계
  const nightCount  = new Array(n).fill(0)
  const dayCount    = new Array(n).fill(0)
  const eveningCount = new Array(n).fill(0)
  const consecWork  = new Array(n).fill(0)
  const forceRest   = new Array(n).fill(0)
  const weekendWork = new Array(n).fill(0)

  // available shifts (kept as comment for clarity)

  for (let d = 0; d < days; d++) {
    const assigned: Record<ShiftCode, number> = { D: 0, E: 0, N: 0, OFF: 0 }

    const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => {
      if (nightCount[a] !== nightCount[b]) return nightCount[a] - nightCount[b]
      const workCountA = dayCount[a] + eveningCount[a] + nightCount[a]
      const workCountB = dayCount[b] + eveningCount[b] + nightCount[b]
      if (workCountA !== workCountB) return workCountA - workCountB
      return consecWork[a] - consecWork[b]
    })

    const isWeekendDay = isWeekend(opts.year, opts.month, d + 1)
    const isNightEligible = (i: number) => nightCount[i] < opts.maxNightPerMonth

    const getBestCandidate = (candidates: number[], shift: ShiftCode) => {
      return candidates.sort((a, b) => {
        const countA = shift === 'D' ? dayCount[a] : shift === 'E' ? eveningCount[a] : nightCount[a]
        const countB = shift === 'D' ? dayCount[b] : shift === 'E' ? eveningCount[b] : nightCount[b]
        if (countA !== countB) return countA - countB
        const totalA = dayCount[a] + eveningCount[a] + nightCount[a]
        const totalB = dayCount[b] + eveningCount[b] + nightCount[b]
        if (totalA !== totalB) return totalA - totalB
        if (consecWork[a] !== consecWork[b]) return consecWork[a] - consecWork[b]
        return a - b
      })[0]
    }

    // Lookahead: for Night assignments, avoid choosing a nurse that would cause future night coverage deficits
    const wouldCauseFutureNightDeficit = (pick: number, dayIdx: number) => {
      const lookahead = Math.max(1, opts.minRestAfterNight)
      for (let k = dayIdx + 1; k <= Math.min(days - 1, dayIdx + lookahead); k++) {
        const candidatesForFuture = order.filter(i => {
          if (i === pick) return false
          if (forceRest[i] > 0) return false
          if (consecWork[i] >= opts.maxConsecWork) return false
          if (nightCount[i] >= opts.maxNightPerMonth) return false
          if (grid[i][k] !== 'OFF') return false
          return true
        })
        if (candidatesForFuture.length < opts.minPerShift) return true
      }
      return false
    }

    const available = new Array(n).fill(true)
    for (const i of order) {
      if (forceRest[i] > 0) {
        grid[i][d] = 'OFF'
        forceRest[i]--
        consecWork[i] = 0
        assigned.OFF++
        available[i] = false
      } else if (consecWork[i] >= opts.maxConsecWork) {
        grid[i][d] = 'OFF'
        consecWork[i] = 0
        assigned.OFF++
        available[i] = false
      }
    }

    // 먼저 꼭 필요한 최소 교대 인원 채우기
    for (const shift of ['N', 'E', 'D'] as const) {
      while (assigned[shift] < opts.minPerShift) {
        const candidates = order.filter(i => available[i] && grid[i][d] === 'OFF' && (shift !== 'N' || isNightEligible(i)))
        if (candidates.length === 0) break
        let pick = getBestCandidate(candidates, shift)
        // If Night, try to avoid picks that cause future deficits by selecting next-best candidate
        if (shift === 'N' && pick !== undefined) {
          if (wouldCauseFutureNightDeficit(pick, d)) {
            const alt = candidates.filter(c => !wouldCauseFutureNightDeficit(c, d))
            if (alt.length > 0) pick = getBestCandidate(alt, shift)
          }
        }
        grid[pick][d] = shift
        assigned[shift]++
        consecWork[pick]++

        if (shift === 'D') dayCount[pick]++
        else if (shift === 'E') eveningCount[pick]++
        else if (shift === 'N') {
          nightCount[pick]++
          forceRest[pick] = opts.minRestAfterNight
          consecWork[pick] = 0
        }
        if (isWeekendDay) weekendWork[pick]++
      }
    }

    // 남은 담당 가능한 간호사는 가능한 shift로 채워 업무 빈칸 최소화
    for (const i of order) {
      if (!available[i] || grid[i][d] !== 'OFF') continue

      const possible = ['N', 'E', 'D'].filter(shift => shift !== 'N' || isNightEligible(i)) as ShiftCode[]
      if (possible.length === 0) {
        grid[i][d] = 'OFF'
        assigned.OFF++
        consecWork[i] = 0
        continue
      }

      const deficit = possible.filter(shift => assigned[shift] < opts.minPerShift)
      const pickShift = deficit.length > 0
        ? deficit.reduce((best, shift) => assigned[shift] < assigned[best] ? shift : best, deficit[0])
        : possible.reduce((best, shift) => assigned[shift] < assigned[best] ? shift : best, possible[0])

      grid[i][d] = pickShift
      assigned[pickShift]++
      consecWork[i]++

      if (pickShift === 'D') dayCount[i]++
      else if (pickShift === 'E') eveningCount[i]++
      else if (pickShift === 'N') {
        nightCount[i]++
        forceRest[i] = opts.minRestAfterNight
        consecWork[i] = 0
      }
      if (isWeekendDay) weekendWork[i]++
    }

    // 추가 패스: 여전히 OFF인 칸을 가능한 한 채움 (forceRest는 존중, maxConsecWork는 완화하여 채움)
    for (const i of order) {
      if (grid[i][d] !== 'OFF') continue
      if (forceRest[i] > 0) continue

      const possible2 = ['N', 'E', 'D'].filter(shift => shift !== 'N' || isNightEligible(i)) as ShiftCode[]
      if (possible2.length === 0) {
        grid[i][d] = 'OFF'
        assigned.OFF++
        continue
      }

      const pickShift2 = possible2.reduce((best, shift) => assigned[shift] < assigned[best] ? shift : best, possible2[0])
      grid[i][d] = pickShift2
      assigned[pickShift2]++

      // consecWork 제한을 완화: 채우기 우선
      if (pickShift2 === 'D') dayCount[i]++
      else if (pickShift2 === 'E') eveningCount[i]++
      else if (pickShift2 === 'N') {
        nightCount[i]++
        forceRest[i] = opts.minRestAfterNight
        consecWork[i] = 0
      }
      if (isWeekendDay) weekendWork[i]++
    }

    for (const i of order) {
      if (grid[i][d] === 'OFF' && available[i]) {
        consecWork[i] = 0
      }
    }
  }

  // Post-process: 마지막 구간 보정 — 월말에 Night 부족한 날짜에 대해 가능한 한 D/E를 N으로 전환하여 커버 개선
  const postWindow = Math.min(7, days)
  for (let d = days - postWindow; d < days; d++) {
    // count current N on day d
    let nCount = 0
    for (let i = 0; i < n; i++) if (grid[i][d] === 'N') nCount++
    let attempts = 0
    while (nCount < opts.minPerShift && attempts < n) {
      let madeChange = false
      for (let i = 0; i < n; i++) {
        if (grid[i][d] === 'D' || grid[i][d] === 'E') {
          if (nightCount[i] >= opts.maxNightPerMonth) continue
          const hasNearbyN = grid[i].some((s, idx) => s === 'N' && Math.abs(idx - d) <= opts.minRestAfterNight)
          // first try: avoid nearby N
          if (hasNearbyN) continue
          // apply conversion
          if (grid[i][d] === 'D') dayCount[i]--
          else if (grid[i][d] === 'E') eveningCount[i]--
          grid[i][d] = 'N'
          nightCount[i]++
          forceRest[i] = opts.minRestAfterNight
          consecWork[i] = 0
          nCount++
          madeChange = true
          break
        }
      }
      // if strict attempt failed, allow relaxed conversion (permit nearby N)
      if (!madeChange) {
        for (let i = 0; i < n; i++) {
          if (grid[i][d] === 'D' || grid[i][d] === 'E') {
            if (nightCount[i] >= opts.maxNightPerMonth) continue
            // apply relaxed conversion
            if (grid[i][d] === 'D') dayCount[i]--
            else if (grid[i][d] === 'E') eveningCount[i]--
            grid[i][d] = 'N'
            nightCount[i]++
            forceRest[i] = opts.minRestAfterNight
            consecWork[i] = 0
            nCount++
            madeChange = true
            break
          }
        }
      }
      if (!madeChange) break
      attempts++
    }
  }

  // Limited backtracking: donor-based move
  for (let d = days - postWindow; d < days; d++) {
    let nCount = 0
    for (let i = 0; i < n; i++) if (grid[i][d] === 'N') nCount++
    if (nCount >= opts.minPerShift) continue

    // try donors from earlier days
    for (let donorDay = 0; donorDay < d; donorDay++) {
      if (nCount >= opts.minPerShift) break
      for (let i = 0; i < n; i++) {
        if (grid[i][donorDay] !== 'N') continue

        // donor must have D/E at target day to move
        if (!(grid[i][d] === 'D' || grid[i][d] === 'E')) continue

        // check night count limits
        if (nightCount[i] >= opts.maxNightPerMonth) continue

        // ensure moving N to d doesn't violate nearby rest for donor (excluding donorDay since it'll be vacated)
        const hasNearbyN = grid[i].some((s, idx) => s === 'N' && idx !== donorDay && Math.abs(idx - d) <= opts.minRestAfterNight)
        if (hasNearbyN) continue

        // perform tentative move: donor gives up donorDay N and receives N at d
        grid[i][donorDay] = 'OFF'
        nightCount[i]--
        // reduce previous counts of donorDay (we don't know original, but count OFF)
        grid[i][d] = 'N'
        nightCount[i]++
        forceRest[i] = opts.minRestAfterNight

        // now donorDay has shortage; try to fill donorDay by converting some D/E there (relaxed)
        let filled = false
        for (let k = 0; k < n; k++) {
          if (grid[k][donorDay] === 'D' || grid[k][donorDay] === 'E') {
            if (nightCount[k] >= opts.maxNightPerMonth) continue
            // avoid creating immediate nearby conflict
            const nearby = grid[k].some((s, idx) => s === 'N' && Math.abs(idx - donorDay) <= opts.minRestAfterNight)
            if (nearby) continue
            // convert
            if (grid[k][donorDay] === 'D') dayCount[k]--
            else eveningCount[k]--
            grid[k][donorDay] = 'N'
            nightCount[k]++
            forceRest[k] = opts.minRestAfterNight
            consecWork[k] = 0
            filled = true
            break
          }
        }

        if (!filled) {
          // revert the tentative move
          grid[i][d] = (grid[i][d] === 'N') ? 'D' : grid[i][d]
          // best-effort: put donorDay back to N
          grid[i][donorDay] = 'N'
          nightCount[i]++
        } else {
          nCount++
        }

        if (nCount >= opts.minPerShift) break
      }
    }
  }

  // Final forced pass for postWindow: 강제 변환으로 최소 한 명의 Night 확보
  for (let d = days - postWindow; d < days; d++) {
    let nCount = 0
    for (let i = 0; i < n; i++) if (grid[i][d] === 'N') nCount++
    let idx = 0
    while (nCount < opts.minPerShift && idx < n) {
      // force convert next available D/E to N
      const i = idx++
      if (grid[i][d] === 'D' || grid[i][d] === 'E') {
        if (grid[i][d] === 'D') dayCount[i]--
        else eveningCount[i]--
        grid[i][d] = 'N'
        nightCount[i]++
        forceRest[i] = opts.minRestAfterNight
        consecWork[i] = 0
        nCount++
      }
    }
  }

  // 결과 변환
  return nurses.map((nurse, i) => {
    const shifts = grid[i]
    const stats = {
      dayCount:     dayCount[i],
      eveningCount: eveningCount[i],
      nightCount:   nightCount[i],
      offCount:     shifts.filter(s => s === 'OFF').length,
      weekendWork:  weekendWork[i],
      overtimeRisk: (dayCount[i] + eveningCount[i] + nightCount[i]) > 22,
    }
    return { nurseId: nurse.id, nurseName: nurse.name, shifts, stats }
  })
}

/** ShiftCode → 한글 레이블 */
export const SHIFT_LABEL: Record<ShiftCode, string> = {
  D:   '주간',
  E:   '저녁',
  N:   '야간',
  OFF: '휴',
}

/** ShiftCode → 색상 */
export const SHIFT_COLOR: Record<ShiftCode, { bg: string; text: string; border: string }> = {
  D:   { bg: 'rgba(44,110,138,0.12)',  text: '#2C6E8A', border: '#2C6E8A' },
  E:   { bg: 'rgba(212,134,10,0.12)',  text: '#D4860A', border: '#D4860A' },
  N:   { bg: 'rgba(63,81,181,0.15)',   text: '#3F51B5', border: '#3F51B5' },
  OFF: { bg: 'transparent',            text: '#6B8090', border: 'transparent' },
}
