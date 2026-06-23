import React from 'react'
import type { Nurse, NursingTask, Patient } from '../../types'
import { useAppSelector } from '../../hooks/useAppSelector'
import type { NurseScheduleRow } from '../../types'
import { getOvertimeStatus, getMonthlyWorkDays } from '../../utils/overtime'
import { useAppDispatch } from '../../hooks/useAppDispatch'
import { approveCheckout, setOnBreak, clearOnBreak } from '../../store/slices/attendanceSlice'

interface NurseStatusTableProps {
  nurses: Nurse[]
  patients: Patient[]
  allTasks: NursingTask[]
  scheduleRows: NurseScheduleRow[]
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

const NurseStatusTable: React.FC<NurseStatusTableProps> = ({ nurses, patients, allTasks, scheduleRows }) => {
  const activeNurses = nurses.filter(n => n.role === 'Nurse')
  const todayKey = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })()
  const assignsToday = useAppSelector(s => s.assignments.byDate[todayKey] ?? {})
  const attendance = useAppSelector(s => s.attendance.records)
  const dispatch = useAppDispatch()
  const hasSchedule = scheduleRows.length > 0

  return (
    <div style={{
      background: 'var(--color-surface)', borderRadius: '10px',
      boxShadow: '0 2px 12px rgba(44,110,138,.09)', padding: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{
          fontSize: '11px', fontWeight: 700, color: 'var(--color-muted)',
          textTransform: 'uppercase', letterSpacing: '.6px',
        }}>
          👩‍⚕️ 간호사 현황
        </div>
        {/* 권고 기준 안내 */}
        <div style={{
          fontSize: '11px', color: 'var(--color-muted)',
          background: '#F7FAFB', padding: '4px 10px', borderRadius: '8px',
          border: '1px solid #DDE3E8',
        }}>
          📋 월 권고 근무일: <strong style={{ color: '#2C6E8A' }}>22일 이하</strong>
          <span style={{ marginLeft: '6px', opacity: 0.7 }}>(한국 간호사 적정 근무 기준)</span>
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#F7FAFB' }}>
              {['간호사명', '담당 환자', '완료 Todo', hasSchedule ? '이번 달 근무일' : '근무표', '상태'].map(h => (
                <th
                  key={h}
                  style={{
                    padding: '10px 12px', textAlign: 'left',
                    fontSize: '11px', fontWeight: 700, color: 'var(--color-muted)',
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
              const workDays = getMonthlyWorkDays(nurse.id, scheduleRows)
              const st = hasSchedule ? getOvertimeStatus(workDays) : 'ok'
              const sc = STATUS_STYLE[st]
              const rowBg = ROW_HIGHLIGHT[st]

              const nurseTaskIds = patients
                .filter(p => Object.values(assignsToday[p.id] ?? {}).includes(nurse.id))
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
                      <span style={{ marginLeft: '6px', fontSize: '11px', color: 'var(--color-muted)' }}>
                        ({Math.round((nurseCompleted / nurseTasks.length) * 100)}%)
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px', fontWeight: st !== 'ok' ? 700 : 400, color: st !== 'ok' ? sc.color : 'var(--color-text)' }}>
                    {hasSchedule ? (
                      <>
                        {workDays}일
                        {st !== 'ok' && (
                          <span style={{ marginLeft: '6px', fontSize: '11px', color: sc.color }}>
                            (+{workDays - 22}일 초과)
                          </span>
                        )}
                      </>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>근무표 미생성</span>
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{
                            padding: '3px 10px', borderRadius: '12px',
                            fontSize: '11px', fontWeight: 600,
                            background: sc.bg, color: sc.color,
                          }}>
                            {sc.label}
                          </span>
                          {/* 출석 상태 */}
                          {(() => {
                            const rec = attendance.find(a => a.nurseId === nurse.id && a.date === todayKey)
                            if (!rec || (!rec.checkIn && !rec.leaveRequested)) return (
                              <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>미출근</span>
                            )
                            return (
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                {rec.checkIn && <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>출근 {new Date(rec.checkIn).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>}
                                {rec.onBreak && <span style={{ fontSize: 11, color: '#D4860A' }}>휴게 중</span>}
                                {rec.checkoutRequested && !rec.checkoutApproved && (
                                  <button onClick={() => dispatch(approveCheckout({ nurseId: nurse.id, date: todayKey }))} style={{ padding: '4px 8px', fontSize: 11, borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg)', cursor: 'pointer' }}>퇴근 승인</button>
                                )}
                                {rec.checkoutApproved && <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>퇴근 승인</span>}
                                {rec.checkOut && <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>퇴근 {new Date(rec.checkOut).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>}
                                {rec.leaveRequested && <span style={{ fontSize: 11, color: '#D4860A' }}>연차신청</span>}
                                {/* 휴게 토글 버튼 */}
                                {rec.onBreak ? (
                                  <button onClick={() => dispatch(clearOnBreak({ nurseId: nurse.id, date: todayKey }))} style={{ padding: '4px 8px', fontSize: 11, borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg)', cursor: 'pointer' }}>휴게 해제</button>
                                ) : (
                                  <button onClick={() => dispatch(setOnBreak({ nurseId: nurse.id, date: todayKey }))} style={{ padding: '4px 8px', fontSize: 11, borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg)', cursor: 'pointer' }}>휴게 시작</button>
                                )}
                              </div>
                            )
                          })()}
                        </div>
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
