import type { Patient, NursingTask, NursingNote, ShiftReportPatientSnapshot } from '../types'

/**
 * 담당 환자 목록, 업무 목록, 간호 노트 목록을 받아
 * ShiftReport 저장 시 포함할 환자 스냅샷 배열을 생성합니다.
 *
 * @param patients  - 스냅샷에 포함할 환자 목록
 * @param tasks     - 전체(또는 담당) 간호 업무 목록
 * @param notes     - 전체(또는 담당) 간호 노트 목록
 * @returns         ShiftReportPatientSnapshot[]
 */
export function buildPatientSnapshots(
  patients: Patient[],
  tasks: NursingTask[],
  notes: NursingNote[],
): ShiftReportPatientSnapshot[] {
  return patients.map(p => {
    const ptTasks = tasks.filter(t => t.patientId === p.id)
    const ptCompleted = ptTasks.filter(t => t.status === 'Completed')
    const ptPending = ptTasks.filter(t => t.status === 'Pending')

    // 최근 간호 노트 최대 3개, 내용은 100자 이내로 트림
    const ptNotesSummary = notes
      .filter(n => n.patientId === p.id)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 3)
      .map(n => (n.content.length > 100 ? n.content.slice(0, 100) + '…' : n.content))

    return {
      patientId: p.id,
      patientName: p.name,
      roomNumber: p.roomNumber,
      severity: p.severity,
      diagnosis: p.diagnosis,
      completedTaskCount: ptCompleted.length,
      pendingTaskCount: ptPending.length,
      pendingTaskNames: ptPending.map(t => t.taskName),
      nursingNotesSummary: ptNotesSummary,
      vitalSigns: {
        bloodPressure: p.vitalSigns?.bloodPressure,
        heartRate: p.vitalSigns?.heartRate,
        temperature: p.vitalSigns?.temperature,
        oxygenSaturation: p.vitalSigns?.oxygenSaturation,
      },
    }
  })
}
