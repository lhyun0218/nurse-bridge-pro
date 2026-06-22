import type { Nurse } from '../types'

export type StatusKey = 'Active' | 'OnBreak' | 'ShiftEnd'

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

export const computeStatus = (records: any[], nurse: Nurse, dateKey: string, now = new Date()): StatusKey => {
  const rec = getTodayAttendance(records, nurse.id, dateKey)
  // Attendance data takes precedence
  if (rec) {
    if (rec.onBreak) return 'OnBreak'
    if (rec.checkOut) return 'ShiftEnd'
    if (rec.checkIn) return 'Active'
    if (rec.leaveRequested) {
      if (rec.leaveStatus === 'Approved') return 'ShiftEnd'
      // Pending/Denied treated as not on active duty
      return 'ShiftEnd'
    }
    // checkoutRequested without checkOut -> still active until checked out
    if (rec.checkoutRequested) return 'Active'
  }

  // If nurse explicitly marked OnBreak in nurse record, respect it
  if (nurse.status === 'OnBreak') return 'OnBreak'

  // Fallback to schedule-based check
  if (isNowInRange(nurse.workStart, nurse.workEnd, now)) return 'Active'
  return 'ShiftEnd'
}

export default { getTodayAttendance, isNowInRange, computeStatus }
