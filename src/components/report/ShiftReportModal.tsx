import React, { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReactToPrint } from 'react-to-print'
import { useAppSelector } from '../../hooks/useAppSelector'
import { useAppDispatch } from '../../hooks/useAppDispatch'
import { saveShiftReport } from '../../store/slices/shiftReportSlice'
import { completeMultipleTasks } from '../../store/slices/tasksSlice'
import { addNote } from '../../store/slices/nursingNotesSlice'
import { addNotification } from '../../store/slices/notificationsSlice'
import { addTask } from '../../store/slices/tasksSlice'
import { buildPatientSnapshots } from '../../utils/buildPatientSnapshots'
import type { NursingTask, Patient, Nurse, ShiftType, NoteCategory } from '../../types'

// ── 타입 ──────────────────────────────────────────────────────────────────────

interface ShiftReportModalProps {
  isOpen: boolean
  onClose: () => void
  nurse: Nurse
  patients: Patient[]
  tasks: NursingTask[]
  singlePatientId?: string
  onSaved?: () => void
}

// ── 카테고리 배지 색상 ─────────────────────────────────────────────────────────

const CATEGORY_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  Monitoring:    { bg: '#EBF4F8', color: '#2C6E8A', label: '모니터링' },
  Medication:    { bg: '#FEF3E2', color: '#D4860A', label: '투약' },
  Hygiene:       { bg: '#E8F5EE', color: '#2E7D5E', label: '위생' },
  Documentation: { bg: '#F0EBF8', color: '#7B5EA7', label: '기록' },
}

const NOTE_CATEGORY_STYLE: Record<NoteCategory, { bg: string; color: string; label: string }> = {
  general:     { bg: '#EBF4F8', color: '#2C6E8A', label: '일반' },
  observation: { bg: '#FEF3E2', color: '#D4860A', label: '관찰' },
  medication:  { bg: '#F0EBF8', color: '#6B3FA0', label: '투약' },
  procedure:   { bg: '#FDECEA', color: '#C0392B', label: '처치' },
  education:   { bg: '#E8F5EE', color: '#2E7D5E', label: '교육' },
}

const SHIFT_LABEL: Record<ShiftType, string> = {
  Day:     '주간 (Day)',
  Evening: '저녁 (Evening)',
  Night:   '야간 (Night)',
}

function formatNoteTime(ts: number): string {
  return new Date(ts).toLocaleString('ko-KR', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── 인쇄용 보고서 컴포넌트 ────────────────────────────────────────────────────

interface ReportContentProps {
  nurse: Nurse
  patients: Patient[]
  tasks: NursingTask[]
  allNotes: import('../../types').NursingNote[]
  reportDate: string
  singlePatientId?: string
}

const ReportContent = React.forwardRef<HTMLDivElement, ReportContentProps>(
  ({ nurse, patients, tasks, allNotes, reportDate, singlePatientId }, ref) => {
    const targetPatients = singlePatientId
      ? patients.filter(p => p.id === singlePatientId)
      : patients

    const completedTasks = tasks.filter(t => t.status === 'Completed')
    const pendingTasks   = tasks.filter(t => t.status === 'Pending')

    const totalRate =
      tasks.length > 0
        ? Math.round((completedTasks.length / tasks.length) * 100)
        : 0

    return (
      <div
        ref={ref}
        style={{
          fontFamily: "'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif",
          color: 'var(--color-text)',
          padding: '32px 36px',
          maxWidth: '800px',
          margin: '0 auto',
          background: '#fff',
        }}
      >
        {/* 헤더 */}
        <div
          style={{
            borderBottom: '2px solid #2C6E8A',
            paddingBottom: '16px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#2C6E8A', margin: 0 }}>
                🏥 Nurse-Bridge PRO
              </h1>
              <h2 style={{ fontSize: '16px', fontWeight: 600, margin: '4px 0 0', color: 'var(--color-text)' }}>
                인수인계 보고서
              </h2>
            </div>
            <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--color-muted)' }}>
              <div>작성일시: {reportDate}</div>
              <div>근무조: {SHIFT_LABEL[nurse.shiftType]}</div>
            </div>
          </div>
        </div>

        {/* 작성자 정보 */}
        <div
          style={{
            background: '#F0F4F7',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            gap: '24px',
            fontSize: '13px',
          }}
        >
          <div><span style={{ color: 'var(--color-muted)' }}>담당 간호사: </span><strong>{nurse.name}</strong></div>
          <div><span style={{ color: 'var(--color-muted)' }}>사번: </span><strong>{nurse.employeeId}</strong></div>
          <div><span style={{ color: 'var(--color-muted)' }}>담당 환자: </span><strong>{targetPatients.length}명</strong></div>
          <div>
            <span style={{ color: 'var(--color-muted)' }}>업무 완료율: </span>
            <strong style={{ color: totalRate >= 80 ? '#2E7D5E' : totalRate >= 50 ? '#D4860A' : '#C0392B' }}>
              {totalRate}%
            </strong>
          </div>
        </div>

        {/* ── 특이사항 및 인수인계 메모 (최상단) ── */}
        {(() => {
          const pendingTasks = tasks.filter(t => t.status === 'Pending')
          const targetPatients = singlePatientId
            ? patients.filter(p => p.id === singlePatientId)
            : patients
          // 전체 간호 노트
          const topNotes = targetPatients.flatMap(p =>
            allNotes
              .filter(n => n.patientId === p.id)
              .sort((a, b) => b.timestamp - a.timestamp)
              .slice(0, 3)
              .map(n => ({ ...n, patientName: p.name }))
          )
          return (
            <div style={{
              border: '2px solid #2C6E8A',
              borderRadius: '10px',
              padding: '16px 18px',
              marginBottom: '20px',
              background: '#F4F9FC',
            }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#2C6E8A', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                📝 특이사항 및 인수인계 메모
              </div>
              {pendingTasks.length > 0 ? (
                <ul style={{ margin: '0 0 10px', paddingLeft: '18px', fontSize: '13px', color: 'var(--color-text)', lineHeight: '1.8' }}>
                  {pendingTasks.map(task => (
                    <li key={task.taskId}>
                      <strong>{targetPatients.find(p => p.id === task.patientId)?.name ?? task.patientId}</strong>
                      {' '}— {task.taskName}{task.description ? ` (${task.description})` : ''} 미완료, 다음 근무자 확인 요망
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#2E7D5E' }}>✅ 모든 업무 완료. 특이사항 없음.</p>
              )}
              {topNotes.length > 0 && (
                <div style={{ borderTop: '1px solid #C8DDE8', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                    최근 간호 노트
                  </div>
                  {topNotes.map(note => {
                    const cfg = NOTE_CATEGORY_STYLE[note.category]
                    return (
                      <div key={note.id} style={{ fontSize: '12px', color: 'var(--color-text)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: cfg.bg, color: cfg.color, flexShrink: 0 }}>{cfg.label}</span>
                        <span style={{ color: 'var(--color-muted)', flexShrink: 0 }}>[{note.patientName}]</span>
                        <span style={{ lineHeight: 1.5 }}>{note.content.slice(0, 80)}{note.content.length > 80 ? '…' : ''}</span>
                        <span style={{ color: 'var(--color-muted)', fontSize: 11, flexShrink: 0 }}>{formatNoteTime(note.timestamp)}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })()}

        {/* ── 업무 요약 ── */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>
            📊 업무 요약
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {[
              { label: '전체 업무', value: tasks.length, color: '#2C6E8A', bg: '#EBF4F8' },
              { label: '완료', value: completedTasks.length, color: '#2E7D5E', bg: '#E8F5EE' },
              { label: '미완료', value: pendingTasks.length, color: pendingTasks.length > 0 ? '#C0392B' : '#2E7D5E', bg: pendingTasks.length > 0 ? '#FDECEA' : '#E8F5EE' },
            ].map(item => (
              <div
                key={item.label}
                style={{
                  background: item.bg,
                  borderRadius: '8px',
                  padding: '12px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '22px', fontWeight: 700, color: item.color }}>{item.value}</div>
                <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginTop: '2px' }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 환자별 상세 */}
        {targetPatients.map(patient => {
          const patientTasks     = tasks.filter(t => t.patientId === patient.id)
          const patientCompleted = patientTasks.filter(t => t.status === 'Completed')
          const patientPending   = patientTasks.filter(t => t.status === 'Pending')
          const rate             = patientTasks.length > 0
            ? Math.round((patientCompleted.length / patientTasks.length) * 100)
            : 0

          const severityColor =
            patient.severity === 'High'   ? '#C0392B' :
            patient.severity === 'Medium' ? '#D4860A' : '#2E7D5E'

          return (
            <div
              key={patient.id}
              style={{
                border: `1px solid #DDE3E8`,
                borderLeft: `4px solid ${severityColor}`,
                borderRadius: '8px',
                padding: '14px 16px',
                marginBottom: '14px',
                pageBreakInside: 'avoid',
              }}
            >
              {/* 환자 헤더 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700 }}>{patient.name}</span>
                  <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
                    {patient.age}세 · {patient.gender === 'M' ? '남' : '여'} · 병실 {patient.roomNumber}
                  </span>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: patient.severity === 'High' ? '#FDECEA' : patient.severity === 'Medium' ? '#FEF3E2' : '#E8F5EE',
                      color: severityColor,
                    }}
                  >
                    {patient.severity === 'High' ? '🔴' : patient.severity === 'Medium' ? '🟡' : '🟢'} {patient.severity}
                  </span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: rate === 100 ? '#2E7D5E' : '#D4860A' }}>
                  {rate === 100 ? '✓ 완료' : `${rate}% 완료`}
                </div>
              </div>

              {/* 진단 */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {patient.diagnosis.map((d, i) => (
                  <span
                    key={i}
                    style={{
                      padding: '2px 8px',
                      background: '#F0F4F7',
                      borderRadius: '5px',
                      fontSize: '11px',
                      border: '1px solid #DDE3E8',
                    }}
                  >
                    {d}
                  </span>
                ))}
              </div>

              {/* 완료 업무 */}
              {patientCompleted.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#2E7D5E', marginBottom: '5px' }}>
                    ✅ 완료된 업무 ({patientCompleted.length}건)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {patientCompleted.map(task => {
                      const cat = CATEGORY_STYLE[task.category] ?? CATEGORY_STYLE.Documentation
                      return (
                        <div
                          key={task.taskId}
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}
                        >
                          <span style={{ color: '#2E7D5E' }}>✓</span>
                          <span
                            style={{
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              background: cat.bg,
                              color: cat.color,
                              fontWeight: 600,
                              flexShrink: 0,
                            }}
                          >
                            {cat.label}
                          </span>
                          <span style={{ color: 'var(--color-text)' }}>{task.taskName}</span>
                          {task.description && (
                            <span style={{ color: 'var(--color-muted)', fontSize: '11px' }}>— {task.description}</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* 미완료 업무 */}
              {patientPending.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#C0392B', marginBottom: '5px' }}>
                    ⚠️ 미완료 업무 ({patientPending.length}건) — 다음 근무자 인수인계 필요
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {patientPending.map(task => {
                      const cat = CATEGORY_STYLE[task.category] ?? CATEGORY_STYLE.Documentation
                      return (
                        <div key={task.taskId} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                          <span style={{ color: '#C0392B' }}>○</span>
                          <span style={{ padding: '1px 6px', borderRadius: '4px', fontSize: '10px', background: cat.bg, color: cat.color, fontWeight: 600, flexShrink: 0 }}>{cat.label}</span>
                          <span style={{ color: 'var(--color-text)' }}>{task.taskName}</span>
                          {task.description && <span style={{ color: 'var(--color-muted)', fontSize: '11px' }}>— {task.description}</span>}
                          <span style={{ color: 'var(--color-muted)', fontSize: '11px', marginLeft: 'auto' }}>예정: {task.dueTime}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* 해당 환자 간호 노트 (특이사항/인수인계 메모) */}
              {(() => {
                const patientNotes = allNotes
                  .filter(n => n.patientId === patient.id)
                  .sort((a, b) => b.timestamp - a.timestamp)
                if (patientNotes.length === 0) return null
                return (
                  <div style={{ marginTop: '10px', borderTop: '1px dashed #DDE3E8', paddingTop: '8px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-muted)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      📋 특이사항 · 간호 노트 ({patientNotes.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {patientNotes.map(note => {
                        const cfg = NOTE_CATEGORY_STYLE[note.category]
                        return (
                          <div key={note.id} style={{ fontSize: '12px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                            <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: cfg.bg, color: cfg.color, flexShrink: 0 }}>{cfg.label}</span>
                            <span style={{ color: 'var(--color-text)', lineHeight: 1.5, flex: 1 }}>{note.content}</span>
                            <span style={{ color: 'var(--color-muted)', fontSize: 11, flexShrink: 0 }}>{formatNoteTime(note.timestamp)}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
            </div>
          )
        })}

        {/* 서명란 */}
        <div
          style={{
            display: 'flex',
            gap: '40px',
            borderTop: '1px solid var(--color-border)',
            paddingTop: '18px',
            fontSize: '12px',
            color: 'var(--color-muted)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '8px', fontWeight: 700 }}>작성 간호사</div>
            <div style={{ marginBottom: '8px' }}>{nurse.name} ({nurse.employeeId})</div>
            <div style={{ borderBottom: '1px solid var(--color-text)', width: '220px', margin: '0 auto 6px' }} />
            <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>서명</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '8px', fontWeight: 700 }}>인수 간호사</div>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ borderBottom: '1px solid var(--color-text)', width: '220px', margin: '0 auto 6px' }} />
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>서명</div>
          </div>
        </div>
      </div>
    )
  }
)

ReportContent.displayName = 'ReportContent'

// ── 모달 컴포넌트 ─────────────────────────────────────────────────────────────

const ShiftReportModal: React.FC<ShiftReportModalProps> = ({
  isOpen,
  onClose,
  nurse,
  patients,
  tasks,
  singlePatientId,
  onSaved,
}) => {
  const printRef = useRef<HTMLDivElement>(null)
  const allNotes = useAppSelector(s => s.nursingNotes.notes)
  const dispatch = useAppDispatch()
  const [saved, setSaved] = React.useState(false)
  const [writerSignature, setWriterSignature] = React.useState('')
  const [receiverSignature, setReceiverSignature] = React.useState('')
  const [markPendingCompleted, setMarkPendingCompleted] = React.useState(true)

  const reportDate = new Date().toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  const handleSave = () => {
    const completedTaskIds = tasks.filter(t => t.status === 'Completed').map(t => t.taskId)
    const pendingTasks = tasks.filter(t => t.status === 'Pending')
    const handoffSummary = pendingTasks.length > 0
      ? pendingTasks.map(t => `${patients.find(p => p.id === t.patientId)?.name ?? t.patientId} — ${t.taskName} 미완료`).join('; ')
      : '모든 업무 완료'

    // 담당 환자 스냅샷 생성 (buildPatientSnapshots 유틸 사용)
    const targetPatients = singlePatientId
      ? patients.filter(p => p.id === singlePatientId)
      : patients

    const patientSnapshots = buildPatientSnapshots(targetPatients, tasks, allNotes)

    const reportPayload: any = {
      reportId: `SR-${nurse.id}-${Date.now()}`,
      shiftDate: new Date().toISOString(),
      shiftType: nurse.shiftType,
      nurseId: nurse.id,
      nurseName: nurse.name,
      completedTaskIds,
      handoffSummary,
      notes: reportDate,
      writerSignature,
      receiverSignature,
      patientSnapshots,
    }

    dispatch(saveShiftReport(reportPayload))

    // 대시보드에 완료 상태 반영 (옵션: 미완료 업무를 모두 완료로 표시)
    const idsToComplete = markPendingCompleted ? tasks.map(t => t.taskId) : completedTaskIds
    dispatch(completeMultipleTasks(idsToComplete))

    // 없는 환자에 대해 기본 TODO 생성 (하드코딩 텍스트 없이 환자/시프트 기반으로 생성)
    try {
      patients.forEach(p => {
        const patientTasks = tasks.filter(t => t.patientId === p.id)
        if (patientTasks.length === 0) {
          const newTask = {
            taskId: `auto-${p.id}-${Date.now()}`,
            patientId: p.id,
            taskName: `기본 케어 체크: ${p.name}`,
            description: `Shift ${nurse.shiftType} 기본 체크`,
            status: 'Pending' as const,
            estimatedMinutes: 10,
            dueTime: new Date().toISOString(),
            assignedTo: nurse.id,
            category: 'Monitoring' as const,
          }
          dispatch(addTask(newTask))
        }
      })
    } catch (e) {
      // ignore
    }

    // 커뮤니케이션(간호 노트)에도 인수인계 항목으로 추가
    try {
      const note = {
        id: `handover-${Date.now()}`,
        patientId: 'handover',
        nurseId: nurse.id,
        nurseName: nurse.name,
        category: 'general' as const,
        content: `인수인계: ${handoffSummary}\n작성자 서명: ${writerSignature || nurse.name}\n인수자 서명: ${receiverSignature || ''}`,
        timestamp: Date.now(),
      }
      dispatch(addNote(note))
      // 알림 센터에 추가해서 커뮤니티/공유 영역에 보이도록 함
      dispatch(addNotification({
        id: note.id,
        type: 'info',
        title: `인수인계 저장 — ${nurse.name}`,
        message: handoffSummary,
        timestamp: Date.now(),
        patientId: 'handover',
      }))
    } catch (e) {
      // ignore
    }

    setSaved(true)
    onSaved?.()
  }

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `인수인계보고서_${nurse.name}_${new Date().toLocaleDateString('ko-KR').replace(/\. /g, '-').replace('.', '')}`,
  })

  // 모달 외부 클릭 시 닫기
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 오버레이 */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleBackdropClick}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(26,43,56,0.55)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
            }}
          >
            {/* 모달 패널 — 슬라이드업 */}
            <motion.div
              key="modal"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              style={{
                background: 'var(--color-surface)',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '920px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-card)',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* 모달 헤더 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '18px 24px',
                  borderBottom: '1px solid var(--color-border)',
                  flexShrink: 0,
                }}
              >
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>
                    📋 인수인계 보고서 미리보기
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '2px' }}>
                    {nurse.name} · {SHIFT_LABEL[nurse.shiftType]} · {reportDate}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                    <input placeholder="작성자 서명 (이름)" value={writerSignature} onChange={e => setWriterSignature(e.target.value)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 13 }} />
                    <input placeholder="인수자 서명 (이름)" value={receiverSignature} onChange={e => setReceiverSignature(e.target.value)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 13 }} />
                    <label style={{ fontSize: 13, color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input type="checkbox" checked={markPendingCompleted} onChange={e => setMarkPendingCompleted(e.target.checked)} />
                      미완료 업무 모두 완료로 표시
                    </label>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleSave}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '9px 18px',
                      background: saved ? 'var(--color-ok)' : 'var(--color-accent)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      minHeight: '44px',
                    }}
                    onMouseEnter={e => !saved && (e.currentTarget.style.background = 'var(--color-primary)')}
                    onMouseLeave={e => !saved && (e.currentTarget.style.background = 'var(--color-accent)')}
                  >
                    {saved ? '✅ 저장됨' : '💾 보고서 저장'}
                  </button>
                  <button
                    onClick={() => handlePrint()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '9px 18px',
                      background: 'var(--color-primary)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      minHeight: '44px',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-primary-d)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-primary)')}
                  >
                    🖨️ 인쇄 / PDF 저장
                  </button>
                  <button
                    onClick={onClose}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '44px',
                      height: '44px',
                      background: '#F0F4F7',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '18px',
                      cursor: 'pointer',
                      color: 'var(--color-muted)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#DDE3E8')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#F0F4F7')}
                    aria-label="닫기"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* 스크롤 가능한 보고서 본문 */}
              <div style={{ overflowY: 'auto', flex: 1 }}>
                <ReportContent
                  ref={printRef}
                  nurse={nurse}
                  patients={patients}
                  tasks={tasks}
                  allNotes={allNotes}
                  reportDate={reportDate}
                  singlePatientId={singlePatientId}
                />
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default ShiftReportModal
