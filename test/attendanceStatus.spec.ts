import { describe, it, expect } from 'vitest'
import { computeStatus } from '../src/utils/attendanceStatus'

const baseNurse = {
  id: 'n1', name: 'Test', employeeId: 'EMP', role: 'Nurse', shiftType: 'Day', assignedPatients: [], status: 'Active', overtimeHours: 0, workStart: '08:00', workEnd: '17:00'
}

describe('computeStatus', () => {
  it('returns Active when attendance has checkIn', () => {
    const records = [{ nurseId: 'n1', date: '2026-06-21', checkIn: Date.now() }]
    const s = computeStatus(records, baseNurse as any, '2026-06-21')
    expect(s).toBe('Active')
  })

  it('returns ShiftEnd when attendance has checkOut', () => {
    const records = [{ nurseId: 'n1', date: '2026-06-21', checkIn: Date.now() - 10000, checkOut: Date.now() }]
    const s = computeStatus(records, baseNurse as any, '2026-06-21')
    expect(s).toBe('ShiftEnd')
  })

  it('returns ShiftEnd for approved leave', () => {
    const records = [{ nurseId: 'n1', date: '2026-06-21', leaveRequested: true, leaveStatus: 'Approved' }]
    const s = computeStatus(records, baseNurse as any, '2026-06-21')
    expect(s).toBe('ShiftEnd')
  })

  it('falls back to schedule when no attendance and time in range', () => {
    const records: any[] = []
    const now = new Date('2026-06-21T09:00:00')
    const s = computeStatus(records, baseNurse as any, '2026-06-21', now)
    expect(s).toBe('Active')
  })

  it('respects nurse.status OnBreak when no attendance', () => {
    const records: any[] = []
    const nurse = { ...baseNurse, status: 'OnBreak' }
    const now = new Date('2026-06-21T09:00:00')
    const s = computeStatus(records, nurse as any, '2026-06-21', now)
    expect(s).toBe('OnBreak')
  })

  it('returns OnBreak when attendance record marks onBreak', () => {
    const records = [{ nurseId: 'n1', date: '2026-06-21', onBreak: true }]
    const s = computeStatus(records, baseNurse as any, '2026-06-21')
    expect(s).toBe('OnBreak')
  })
})
