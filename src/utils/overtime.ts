import type { Nurse } from '../types'
import type { NurseScheduleRow } from '../types'

export interface ReassignSuggestion {
  fromNurse: Nurse
  toNurse: Nurse
  patientId: string
  message: string
  overtimeReduction: number
}

/**
 * 실제 근무표에서 간호사의 이번 달 근무일 수를 계산합니다.
 * 한국 간호사 적정 근무일 권고 기준: 월 22일 이하
 */
export function getMonthlyWorkDays(nurseId: string, scheduleRows: NurseScheduleRow[]): number {
  const row = scheduleRows.find(r => r.nurseId === nurseId)
  if (!row) return 0
  return row.shifts.filter(s => s !== 'OFF').length
}

/**
 * 근무일 수 기반 오버타임 상태 판정
 * - ok:     22일 이하 (권고 기준 내)
 * - warn:   23~24일 (권고 기준 초과)
 * - danger: 25일 이상 (과부하)
 *
 * 근거: 한국 간호사 1인당 월 권고 근무일 22일 이하 (주 5일 × 4.4주)
 */
export function getOvertimeStatus(workDays: number): 'ok' | 'warn' | 'danger' {
  if (workDays >= 25) return 'danger'
  if (workDays >= 23) return 'warn'
  return 'ok'
}

export function getReassignmentSuggestion(nurses: Nurse[], scheduleRows: NurseScheduleRow[] = []): ReassignSuggestion | null {
  const withWorkDays = nurses
    .filter(n => n.role === 'Nurse')
    .map(n => ({ nurse: n, workDays: getMonthlyWorkDays(n.id, scheduleRows) }))

  const overloaded = withWorkDays
    .filter(({ workDays }) => workDays >= 23)
    .sort((a, b) => b.workDays - a.workDays)

  const available = withWorkDays
    .filter(({ workDays }) => workDays <= 20)
    .sort((a, b) => a.workDays - b.workDays)

  if (overloaded.length === 0 || available.length === 0) return null

  const from = overloaded[0].nurse
  const to   = available[0].nurse

  if (from.assignedPatients.length === 0) return null

  const patientId = from.assignedPatients[from.assignedPatients.length - 1]
  const fromDays  = overloaded[0].workDays
  const toDays    = available[0].workDays

  return {
    fromNurse: from,
    toNurse: to,
    patientId,
    overtimeReduction: fromDays - toDays,
    message: `🤖 AI 분석: ${from.name}의 이번 달 근무일(${fromDays}일)이 권고 기준(22일)을 초과합니다. 환자 1명을 ${to.name}(${toDays}일)에게 이동을 권장합니다.`,
  }
}
