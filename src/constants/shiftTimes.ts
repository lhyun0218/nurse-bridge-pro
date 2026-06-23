import type { ShiftType, ShiftCode } from '../types'

/**
 * 시스템 전체 교대 시간의 단일 소스 (Single Source of Truth)
 * Day:     07:30 ~ 16:00
 * Evening: 15:30 ~ 00:00
 * Night:   23:30 ~ 08:00
 */
export const SHIFT_TIMES: Record<ShiftType, { workStart: string; workEnd: string }> = {
  Day:     { workStart: '07:30', workEnd: '16:00' },
  Evening: { workStart: '15:30', workEnd: '00:00' },
  Night:   { workStart: '23:30', workEnd: '08:00' },
}

/**
 * ShiftCode → ShiftType 변환
 * D → 'Day', E → 'Evening', N → 'Night', OFF → 'OFF'
 */
export function shiftCodeToType(code: ShiftCode): ShiftType | 'OFF' {
  if (code === 'D') return 'Day'
  if (code === 'E') return 'Evening'
  if (code === 'N') return 'Night'
  return 'OFF'
}

/**
 * workEnd까지 남은 분 계산 (자정 경계 처리 포함)
 * Evening(00:00), Night(08:00)은 다음날로 넘어갈 수 있으므로
 * end <= now 이면 end를 하루 뒤로 조정
 */
export function minutesUntilShiftEnd(shiftType: ShiftType, now = new Date()): number {
  const endStr = SHIFT_TIMES[shiftType].workEnd
  const [eH, eM] = endStr.split(':').map(Number)
  const end = new Date(now)
  end.setHours(eH, eM, 0, 0)
  // Evening(00:00), Night(08:00)은 자정을 넘기므로 end가 now 이전이면 다음날로 이동
  if (end <= now) end.setDate(end.getDate() + 1)
  return Math.round((end.getTime() - now.getTime()) / 60000)
}

/**
 * 정시 퇴근 가능 여부 — workEnd ±10분 이내이면 true
 */
export function isOnTimeDeparture(shiftType: ShiftType, now = new Date()): boolean {
  const mins = minutesUntilShiftEnd(shiftType, now)
  return mins >= -10 && mins <= 10
}

/**
 * 근무표(scheduleRows)에서 특정 간호사의 오늘 ShiftType을 조회
 * @param nurseId      - 조회 대상 간호사 ID
 * @param scheduleRows - scheduleSlice의 NurseScheduleRow 배열
 * @param dateIndex    - 0-based 날짜 인덱스 (오늘 날짜 - 1)
 * @param fallbackShift - 근무표 미생성 시 사용할 기본 ShiftType
 */
export function getNurseShiftToday(
  nurseId: string,
  scheduleRows: Array<{ nurseId: string; shifts: ShiftCode[] }>,
  dateIndex: number,
  fallbackShift: ShiftType
): ShiftType | 'OFF' {
  const row = scheduleRows.find(r => r.nurseId === nurseId)
  if (!row || row.shifts[dateIndex] == null) return fallbackShift
  return shiftCodeToType(row.shifts[dateIndex])
}
