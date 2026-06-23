import { describe, it, expect } from 'vitest'
import { computeStatus } from '../src/utils/attendanceStatus'

const baseNurse = {
  id: 'n1', name: 'Test', employeeId: 'EMP', role: 'Nurse', shiftType: 'Day', assignedPatients: [], status: 'Active', overtimeHours: 0, workStart: '08:00', workEnd: '17:00'
}

describe('computeStatus', () => {
  it('returns Active when attendance has checkIn', () => {
    const records = [{ nurseId: 'n1', date: '2026-06-21', checkIn: Date.now() }]
    const s = computeStatus(records, baseNurse as any, '2026-06-21', 'Day')
    expect(s).toBe('Active')
  })

  it('returns ShiftEnd when attendance has checkOut', () => {
    const records = [{ nurseId: 'n1', date: '2026-06-21', checkIn: Date.now() - 10000, checkOut: Date.now() }]
    const s = computeStatus(records, baseNurse as any, '2026-06-21', 'Day')
    expect(s).toBe('ShiftEnd')
  })

  it('returns ShiftEnd for approved leave', () => {
    const records = [{ nurseId: 'n1', date: '2026-06-21', leaveRequested: true, leaveStatus: 'Approved' }]
    const s = computeStatus(records, baseNurse as any, '2026-06-21', 'Day')
    expect(s).toBe('ShiftEnd')
  })

  it('returns BeforeShift when no attendance and time is before workStart', () => {
    const records: any[] = []
    // Day shift starts 07:30, so 06:00 is before shift
    const now = new Date('2026-06-21T06:00:00')
    const s = computeStatus(records, baseNurse as any, '2026-06-21', 'Day', now)
    expect(s).toBe('BeforeShift')
  })

  it('returns ShiftEnd when no attendance and time is after workStart (결근)', () => {
    const records: any[] = []
    // Day shift starts 07:30, so 09:00 is after shift start with no checkIn = absent
    const now = new Date('2026-06-21T09:00:00')
    const s = computeStatus(records, baseNurse as any, '2026-06-21', 'Day', now)
    expect(s).toBe('ShiftEnd')
  })

  it('never returns Active when checkIn is absent', () => {
    const records: any[] = []
    const now = new Date('2026-06-21T09:00:00')
    const s = computeStatus(records, baseNurse as any, '2026-06-21', 'Day', now)
    expect(s).not.toBe('Active')
  })

  it('returns OnBreak when attendance record marks onBreak', () => {
    const records = [{ nurseId: 'n1', date: '2026-06-21', onBreak: true }]
    const s = computeStatus(records, baseNurse as any, '2026-06-21', 'Day')
    expect(s).toBe('OnBreak')
  })

  it('returns BeforeShift for Evening shift before 15:30', () => {
    const records: any[] = []
    const now = new Date('2026-06-21T14:00:00')
    const s = computeStatus(records, baseNurse as any, '2026-06-21', 'Evening', now)
    expect(s).toBe('BeforeShift')
  })

  it('returns ShiftEnd for Evening shift after 15:30 with no checkIn', () => {
    const records: any[] = []
    const now = new Date('2026-06-21T16:00:00')
    const s = computeStatus(records, baseNurse as any, '2026-06-21', 'Evening', now)
    expect(s).toBe('ShiftEnd')
  })
})
