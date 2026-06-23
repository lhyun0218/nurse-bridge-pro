import type { Nurse, ShiftType } from '../types'
import { SHIFT_TIMES } from '../constants/shiftTimes'

export type StatusKey = 'BeforeShift' | 'Active' | 'OnBreak' | 'ShiftEnd'

export const getTodayAttendance = (records: any[], nurseId: string, dateKey: string) => {
  return records.find(r => r.nurseId === nurseId && r.date === dateKey)
}

export const isNowInRange = (startStr: string, endStr: string, now = new Date()) => {
  try {
    const [sH, sM] = startStr.split(':').map(Number)
    const [eH, eM] = endStr.split(':').map(Number)
    const start = new Date(now)
    start.setHours(sH, sM, 0, 0)
    const end = new Date(now)
    end.setHours(eH, eM, 0, 0)
    if (end <= start) end.setDate(end.getDate() + 1)
    return now >= start && now <= end
  } catch (e) {
    return false
  }
}

export const computeStatus = (
  records: any[],
  nurse: Nurse,
  dateKey: string,
  shiftType: ShiftType,
  now = new Date()
): StatusKey => {
  const rec = getTodayAttendance(records, nurse.id, dateKey)

  if (rec) {
    if (rec.checkOut) return 'ShiftEnd'
    if (rec.onBreak) return 'OnBreak'
    if (rec.checkIn) return 'Active'
    if (rec.leaveRequested) return 'ShiftEnd'
    // checkIn 없으면 무조건 Active 금지
  }

  // 출근 기록 없음 → 현재 시각이 교대 시작 전이면 BeforeShift, 이후면 ShiftEnd(결근)
  const startStr = SHIFT_TIMES[shiftType].workStart
  const [sH, sM] = startStr.split(':').map(Number)
  const shiftStart = new Date(now)
  shiftStart.setHours(sH, sM, 0, 0)

  if (now < shiftStart) return 'BeforeShift'
  return 'ShiftEnd'
}

export default { getTodayAttendance, isNowInRange, computeStatus }
