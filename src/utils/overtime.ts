import type { Nurse } from '../types'

export interface ReassignSuggestion {
  fromNurse: Nurse
  toNurse: Nurse
  patientId: string
  message: string
  overtimeReduction: number
}

export function getReassignmentSuggestion(nurses: Nurse[]): ReassignSuggestion | null {
  const overloaded = nurses
    .filter(n => n.role === 'Nurse' && n.overtimeHours >= 3)
    .sort((a, b) => b.overtimeHours - a.overtimeHours)

  const available = nurses
    .filter(n => n.role === 'Nurse' && n.overtimeHours < 1.5)
    .sort((a, b) => a.overtimeHours - b.overtimeHours)

  if (overloaded.length === 0 || available.length === 0) return null

  const from = overloaded[0]
  const to   = available[0]

  if (from.assignedPatients.length === 0) return null

  const patientId = from.assignedPatients[from.assignedPatients.length - 1]
  const reduction = parseFloat(((from.overtimeHours - to.overtimeHours) * 0.3).toFixed(1))

  return {
    fromNurse: from,
    toNurse: to,
    patientId,
    overtimeReduction: reduction,
    message: `🤖 AI 분석: ${from.name}의 환자 1명을 ${to.name}에게 이동하면 오버타임이 ${reduction}h 감소합니다.`,
  }
}

export function getOvertimeStatus(hours: number): 'ok' | 'warn' | 'danger' {
  if (hours >= 5) return 'danger'
  if (hours >= 3) return 'warn'
  return 'ok'
}
