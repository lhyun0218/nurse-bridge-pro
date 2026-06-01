import React from 'react'
import type { Nurse, NursingTask, Patient } from '../../types'
import { getOvertimeStatus } from '../../utils/overtime'

interface NurseStatusTableProps {
  nurses: Nurse[]
  patients: Patient[]
  allTasks: NursingTask[]
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  ok:     { bg: '#E8F5EE', color: '#2E7D5E', label: '✓ 정상' },
  warn:   { bg: '#FEF3E2', color: '#D4860A', label: '⚠️ 경고' },
  danger: { bg: '#FDECEA', color: '#C0392B', label: '🔴 초과' },
}

const ROW_HIGHLIGHT: Record<string, string> = {
  ok:     '',
  warn:   'rgba(212,134,10,.06)',
  danger: 'rgba(192,57,43,.06)',
}

const NurseStatusTable: React.FC<NurseStatusTableProps> = ({ nurses, patients, allTasks }) => {
  const activeNurses = nurses.filter(n => n.role === 'Nurse')

  return (
    <div style={{
      background: '#FFFFFF', borderRadius: '10px',
      boxShadow: '0 2px 12px rgba(44,110,138,.09)', padding: '20px',
    }}>
      <div style={{
        fontSize: '11px', fontWeight: 700, color: '#6B8090',
        textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '14px',
      }}>
        👩‍⚕️ 간호사 현황
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#F7FAFB' }}>
              {['간호사명', '담당 환자', '완료 Todo', '예상 오버타임', '상태'].map(h => (
                <th
                  key={h}
                  style={{
                    padding: '10px 12px', textAlign: 'left',
                    fontSize: '11px', fontWeight: 700, color: '#6B8090',
                    textTransform: 'uppercase', letterSpacing: '.4px',
                    borderBottom: '2px solid #DDE3E8',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activeNurses.map(nurse => {
              const st = getOvertimeStatus(nurse.overtimeHours)
              const sc = STATUS_STYLE[st]
              const rowBg = ROW_HIGHLIGHT[st]

              const nurseTaskIds = patients
                .filter(p => p.assignedNurseId === nurse.id)
                .flatMap(p => p.nursingTaskIds)
              const nurseTasks = allTasks.filter(t => nurseTaskIds.includes(t.taskId))
              const nurseCompleted = nurseTasks.filter(t => t.status === 'Completed').length

              return (
                <tr
                  key={nurse.id}
                  style={{ borderBottom: '1px solid #DDE3E8', background: rowBg }}
                  onMouseEnter={e => { if (!rowBg) e.currentTarget.style.background = '#FAFCFD' }}
                  onMouseLeave={e => { e.currentTarget.style.background = rowBg }}
                >
                  <td style={{ padding: '12px' }}>
                    <strong>{nurse.name}</strong>
                    {nurse.yearsOfExperience !== undefined && nurse.yearsOfExperience <= 1 && (
                      <span style={{
                        marginLeft: '6px', fontSize: '10px', padding: '2px 6px',
                        background: '#EBF4F8', color: '#2C6E8A', borderRadius: '8px', fontWeight: 600,
                      }}>신입</span>
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>{nurse.assignedPatients.length}명</td>
                  <td style={{ padding: '12px' }}>
                    {nurseCompleted} / {nurseTasks.length}
                    {nurseTasks.length > 0 && (
                      <span style={{ marginLeft: '6px', fontSize: '11px', color: '#6B8090' }}>
                        ({Math.round((nurseCompleted / nurseTasks.length) * 100)}%)
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px', fontWeight: nurse.overtimeHours >= 3 ? 700 : 400, color: sc.color }}>
                    {nurse.overtimeHours}h
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: '12px',
                      fontSize: '11px', fontWeight: 600,
                      background: sc.bg, color: sc.color,
                    }}>
                      {sc.label}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default NurseStatusTable
