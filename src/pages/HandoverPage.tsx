import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LuClipboardCheck, LuPrinter, LuCircleCheck, LuTriangleAlert,
  LuBookOpen, LuChevronDown, LuChevronUp, LuUser, LuClock,
  LuHeartPulse, LuHistory,
} from 'react-icons/lu'
import { useAppSelector } from '../hooks/useAppSelector'
import ShiftReportModal from '../components/report/ShiftReportModal'
import type { ShiftType } from '../types'

// 이전 교대 순서 매핑
const PREV_SHIFT: Record<ShiftType, ShiftType> = {
  Day:     'Night',     // 주간 이전 = 야간
  Evening: 'Day',       // 저녁 이전 = 주간
  Night:   'Evening',   // 야간 이전 = 저녁
}
const SHIFT_LABEL: Record<ShiftType, string> = {
  Day: '주간 (Day)', Evening: '저녁 (Evening)', Night: '야간 (Night)',
}
const SHIFT_COLOR: Record<ShiftType, { bg: string; color: string }> = {
  Day:     { bg: '#EAF4F9', color: '#2C6E8A' },
  Evening: { bg: '#FEF3E2', color: '#D4860A' },
  Night:   { bg: '#EEF0FB', color: '#3F51B5' },
}

const HandoverPage: React.FC = () => {
  const currentUser  = useAppSelector(s => s.auth.currentUser)
  const allPatients  = useAppSelector(s => s.patients.allPatients)
  const allNurses    = useAppSelector(s => s.nurses.allNurses)
  const allTasks     = useAppSelector(s => s.tasks.allTasks)
  const savedReports = useAppSelector(s => s.shiftReports.reports)
  const [modalOpen, setModalOpen] = useState(false)
  const [savedMsg, setSavedMsg] = useState(false)
  const [prevReportExpanded, setPrevReportExpanded] = useState(true)
  const [expandedPatient, setExpandedPatient] = useState<string | null>(null)

  const todayKey = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })()
  const assignsToday = useAppSelector(s => s.assignments.byDate[todayKey] ?? {})
  const myPatients = allPatients.filter(p => Object.values(assignsToday[p.id] ?? {}).includes(currentUser?.id ?? ''))
  const myTasks    = allTasks.filter(t => myPatients.some(p => p.id === t.patientId))

  const completedTasks = myTasks.filter(t => t.status === 'Completed')
  const pendingTasks   = myTasks.filter(t => t.status === 'Pending')
  const totalRate      = myTasks.length === 0 ? 0 : Math.round((completedTasks.length / myTasks.length) * 100)
  const allDone = pendingTasks.length === 0 && myTasks.length > 0

  const severityColor = (s: string) =>
    s === 'High' ? '#C0392B' : s === 'Medium' ? '#D4860A' : '#2E7D5E'

  // ── 이전 근무 보고서 찾기 ──────────────────────────────────────────────────
  const prevShiftType = currentUser ? PREV_SHIFT[currentUser.shiftType] : null

  // 이전 교대의 가장 최근 보고서들 (여러 간호사가 있을 수 있음)
  const prevReports = useMemo(() => {
    if (!prevShiftType) return []
    // 이전 교대 타입의 보고서 중 최근 24시간 이내 것들
    const cutoff = Date.now() - 24 * 60 * 60 * 1000
    return savedReports
      .filter(r => r.shiftType === prevShiftType && new Date(r.shiftDate).getTime() > cutoff)
      .sort((a, b) => new Date(b.shiftDate).getTime() - new Date(a.shiftDate).getTime())
  }, [savedReports, prevShiftType])

  // 이전 보고서들의 환자 스냅샷을 환자ID 기준으로 합산
  const prevPatientMap = useMemo(() => {
    const map = new Map<string, { snapshot: NonNullable<(typeof prevReports)[0]['patientSnapshots']>[0]; nurseName: string; shiftDate: string }>()
    for (const report of prevReports) {
      const nurseName = report.nurseName ?? allNurses.find(n => n.id === report.nurseId)?.name ?? '알 수 없음'
      for (const snap of (report.patientSnapshots ?? [])) {
        if (!map.has(snap.patientId)) {
          map.set(snap.patientId, { snapshot: snap, nurseName, shiftDate: report.shiftDate })
        }
      }
    }
    return map
  }, [prevReports, allNurses])

  // 이전 보고서에 담긴 내 담당 환자 (현재 내가 담당하는 환자와 매칭)
  const myPrevSnapshots = useMemo(() => {
    return myPatients
      .map(p => ({ patient: p, prev: prevPatientMap.get(p.id) }))
      .filter(x => x.prev !== undefined) as Array<{ patient: typeof myPatients[0]; prev: NonNullable<typeof prevPatientMap extends Map<string, infer V> ? V : never> }>
  }, [myPatients, prevPatientMap])

  // 이전 보고서에서 미완료로 넘어온 업무 전체
  const pendingFromPrev = useMemo(() => {
    return myPrevSnapshots.flatMap(({ patient, prev }) =>
      prev.snapshot.pendingTaskNames.map(name => ({ patient, taskName: name, nurseName: prev.nurseName }))
    )
  }, [myPrevSnapshots])


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ padding: '22px 24px 60px' }}
    >
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LuClipboardCheck style={{ width: '20px', height: '20px', color: 'var(--color-primary)' }} />
            인수인계
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '4px' }}>
            {currentUser?.name} 간호사 · {currentUser?.shiftType === 'Day' ? '주간' : currentUser?.shiftType === 'Evening' ? '저녁' : '야간'} 근무
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '10px 18px', borderRadius: '8px',
            border: 'none',
            background: allDone ? '#2E7D5E' : 'var(--color-primary)',
            color: '#fff', fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', transition: 'background 0.15s',
          }}
        >
          <LuPrinter style={{ width: '15px', height: '15px' }} />
          보고서 미리보기 / 인쇄
        </button>
      </div>

      {/* ── 이전 근무 인수인계 섹션 ──────────────────────────────────────── */}
      {prevShiftType && (
        <div style={{
          background: 'var(--color-surface)',
          borderRadius: '12px',
          boxShadow: '0 2px 12px rgba(44,110,138,.09)',
          marginBottom: '20px',
          overflow: 'hidden',
          border: `1.5px solid ${SHIFT_COLOR[prevShiftType].color}30`,
        }}>
          {/* 섹션 헤더 */}
          <button
            onClick={() => setPrevReportExpanded(v => !v)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px', background: SHIFT_COLOR[prevShiftType].bg,
              border: 'none', cursor: 'pointer', borderBottom: prevReportExpanded ? `1px solid ${SHIFT_COLOR[prevShiftType].color}20` : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <LuHistory style={{ width: '18px', height: '18px', color: SHIFT_COLOR[prevShiftType].color }} />
              <span style={{ fontSize: '14px', fontWeight: 700, color: SHIFT_COLOR[prevShiftType].color }}>
                이전 근무 인수인계 — {SHIFT_LABEL[prevShiftType]}
              </span>
              {pendingFromPrev.length > 0 && (
                <span style={{
                  padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 700,
                  background: '#FDECEA', color: '#C0392B',
                }}>
                  ⚠️ 미완료 {pendingFromPrev.length}건 인수
                </span>
              )}
              {prevReports.length === 0 && (
                <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>보고서 없음</span>
              )}
            </div>
            {prevReportExpanded
              ? <LuChevronUp style={{ width: '16px', height: '16px', color: SHIFT_COLOR[prevShiftType].color }} />
              : <LuChevronDown style={{ width: '16px', height: '16px', color: SHIFT_COLOR[prevShiftType].color }} />
            }
          </button>

          <AnimatePresence initial={false}>
            {prevReportExpanded && (
              <motion.div
                key="prev-content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ padding: '16px 20px' }}>
                  {prevReports.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-muted)', fontSize: '13px' }}>
                      이전 근무 보고서가 아직 저장되지 않았습니다.<br />
                      <span style={{ fontSize: '12px', opacity: 0.7 }}>이전 교대 간호사가 인수인계 보고서를 저장하면 여기에 표시됩니다.</span>
                    </div>
                  ) : (
                    <>
                      {/* 이전 보고서 작성 간호사 목록 */}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                        {prevReports.map(r => {
                          const nName = r.nurseName ?? allNurses.find(n => n.id === r.nurseId)?.name ?? r.nurseId
                          const sc = SHIFT_COLOR[r.shiftType]
                          return (
                            <div key={r.reportId} style={{
                              display: 'flex', alignItems: 'center', gap: '6px',
                              padding: '6px 12px', borderRadius: '20px',
                              background: sc.bg, border: `1px solid ${sc.color}30`,
                            }}>
                              <LuUser style={{ width: '13px', height: '13px', color: sc.color }} />
                              <span style={{ fontSize: '12px', fontWeight: 600, color: sc.color }}>{nName}</span>
                              <LuClock style={{ width: '11px', height: '11px', color: 'var(--color-muted)' }} />
                              <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                                {new Date(r.shiftDate).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          )
                        })}
                      </div>

                      {/* 미완료 업무 인수 목록 */}
                      {pendingFromPrev.length > 0 && (
                        <div style={{
                          background: '#FDECEA', borderRadius: '8px', padding: '12px 14px', marginBottom: '14px',
                          border: '1px solid #F5B7B1',
                        }}>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#C0392B', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <LuTriangleAlert style={{ width: '14px', height: '14px' }} />
                            이전 근무에서 인수받은 미완료 업무
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {pendingFromPrev.map((item, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                                <span style={{ color: '#C0392B' }}>○</span>
                                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{item.patient.name}</span>
                                <span style={{ color: 'var(--color-muted)' }}>—</span>
                                <span style={{ color: 'var(--color-text)' }}>{item.taskName}</span>
                                <span style={{ fontSize: '11px', color: 'var(--color-muted)', marginLeft: 'auto' }}>
                                  이전: {item.nurseName}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 환자별 이전 근무 상태 */}
                      {myPrevSnapshots.length > 0 && (
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            환자별 이전 근무 상태
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {myPrevSnapshots.map(({ patient, prev }) => {
                              const snap = prev.snapshot
                              const isExpanded = expandedPatient === patient.id
                              return (
                                <div key={patient.id} style={{
                                  borderRadius: '9px', overflow: 'hidden',
                                  border: `1px solid var(--color-border)`,
                                  borderLeft: `4px solid ${severityColor(snap.severity)}`,
                                }}>
                                  <button
                                    onClick={() => setExpandedPatient(isExpanded ? null : patient.id)}
                                    style={{
                                      width: '100%', display: 'flex', alignItems: 'center',
                                      justifyContent: 'space-between', padding: '10px 14px',
                                      background: 'var(--color-bg)', border: 'none', cursor: 'pointer',
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>{snap.patientName}</span>
                                      <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>병실 {snap.roomNumber}</span>
                                      <span style={{
                                        padding: '1px 7px', borderRadius: '5px', fontSize: '10px', fontWeight: 700,
                                        background: snap.severity === 'High' ? '#FDECEA' : snap.severity === 'Medium' ? '#FEF3E2' : '#E8F5EE',
                                        color: severityColor(snap.severity),
                                      }}>{snap.severity}</span>
                                      {snap.pendingTaskCount > 0 && (
                                        <span style={{ padding: '1px 7px', borderRadius: '5px', fontSize: '10px', fontWeight: 700, background: '#FEF3E2', color: '#C0392B' }}>
                                          미완료 {snap.pendingTaskCount}
                                        </span>
                                      )}
                                      {snap.pendingTaskCount === 0 && (
                                        <span style={{ padding: '1px 7px', borderRadius: '5px', fontSize: '10px', fontWeight: 700, background: '#E8F5EE', color: '#2E7D5E' }}>
                                          ✓ 완료
                                        </span>
                                      )}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>{prev.nurseName}</span>
                                      {isExpanded
                                        ? <LuChevronUp style={{ width: '14px', height: '14px', color: 'var(--color-muted)' }} />
                                        : <LuChevronDown style={{ width: '14px', height: '14px', color: 'var(--color-muted)' }} />
                                      }
                                    </div>
                                  </button>

                                  <AnimatePresence initial={false}>
                                    {isExpanded && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.18 }}
                                        style={{ overflow: 'hidden' }}
                                      >
                                        <div style={{ padding: '10px 14px 14px', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                          {/* 활력징후 스냅샷 */}
                                          {snap.vitalSigns && (
                                            <div>
                                              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-muted)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <LuHeartPulse style={{ width: '12px', height: '12px' }} /> 이전 근무 활력징후
                                              </div>
                                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                {snap.vitalSigns.bloodPressure && (
                                                  <span style={{ padding: '3px 9px', borderRadius: '6px', fontSize: '11px', background: '#EBF4F8', color: '#2C6E8A', fontWeight: 600 }}>
                                                    BP {snap.vitalSigns.bloodPressure}
                                                  </span>
                                                )}
                                                {snap.vitalSigns.heartRate && (
                                                  <span style={{ padding: '3px 9px', borderRadius: '6px', fontSize: '11px', background: '#FDECEA', color: '#C0392B', fontWeight: 600 }}>
                                                    HR {snap.vitalSigns.heartRate}
                                                  </span>
                                                )}
                                                {snap.vitalSigns.temperature && (
                                                  <span style={{ padding: '3px 9px', borderRadius: '6px', fontSize: '11px', background: '#FEF3E2', color: '#D4860A', fontWeight: 600 }}>
                                                    T {snap.vitalSigns.temperature}°C
                                                  </span>
                                                )}
                                                {snap.vitalSigns.oxygenSaturation && (
                                                  <span style={{ padding: '3px 9px', borderRadius: '6px', fontSize: '11px', background: '#E8F5EE', color: '#2E7D5E', fontWeight: 600 }}>
                                                    SpO₂ {snap.vitalSigns.oxygenSaturation}%
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          )}

                                          {/* 미완료 업무 */}
                                          {snap.pendingTaskNames.length > 0 && (
                                            <div>
                                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#C0392B', marginBottom: '4px' }}>⚠️ 인수받은 미완료 업무</div>
                                              {snap.pendingTaskNames.map((name, i) => (
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', marginBottom: '2px' }}>
                                                  <LuTriangleAlert style={{ width: '12px', height: '12px', color: '#D4860A', flexShrink: 0 }} />
                                                  <span>{name}</span>
                                                </div>
                                              ))}
                                            </div>
                                          )}

                                          {/* 간호 노트 요약 */}
                                          {snap.nursingNotesSummary.length > 0 && (
                                            <div>
                                              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-muted)', marginBottom: '4px' }}>📋 이전 근무 간호 노트</div>
                                              {snap.nursingNotesSummary.map((note, i) => (
                                                <div key={i} style={{
                                                  padding: '6px 10px', borderRadius: '6px', fontSize: '12px',
                                                  background: 'var(--color-bg)', color: 'var(--color-text)',
                                                  border: '1px solid var(--color-border)', marginBottom: '4px',
                                                  lineHeight: 1.5,
                                                }}>
                                                  {note}
                                                </div>
                                              ))}
                                            </div>
                                          )}

                                          {snap.pendingTaskCount === 0 && snap.nursingNotesSummary.length === 0 && (
                                            <div style={{ fontSize: '12px', color: '#2E7D5E', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                              <LuCircleCheck style={{ width: '13px', height: '13px' }} />
                                              이전 근무 모든 업무 완료, 특이사항 없음
                                            </div>
                                          )}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {myPrevSnapshots.length === 0 && prevReports.length > 0 && (
                        <div style={{ fontSize: '13px', color: 'var(--color-muted)', textAlign: 'center', padding: '16px' }}>
                          현재 담당 환자에 대한 이전 근무 데이터가 없습니다.
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: '전체 업무',  value: myTasks.length,         color: 'var(--color-primary)',                                  border: 'var(--color-primary)' },
          { label: '완료',       value: completedTasks.length,   color: '#2E7D5E',                                               border: '#2E7D5E' },
          { label: '미완료',     value: pendingTasks.length,     color: pendingTasks.length > 0 ? '#C0392B' : '#2E7D5E',        border: pendingTasks.length > 0 ? '#C0392B' : '#2E7D5E' },
          { label: '완료율',     value: `${totalRate}%`,         color: totalRate >= 80 ? '#2E7D5E' : totalRate >= 50 ? '#D4860A' : '#C0392B', border: totalRate >= 80 ? '#2E7D5E' : '#D4860A' },
        ].map(c => (
          <div key={c.label} style={{ background: 'var(--color-surface)', borderRadius: '10px', padding: '16px', boxShadow: '0 2px 12px rgba(44,110,138,.09)', borderTop: `3px solid ${c.border}` }}>
            <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginBottom: '4px' }}>{c.label}</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* 진행도 바 */}
      <div style={{ background: 'var(--color-surface)', borderRadius: '10px', padding: '16px 20px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(44,110,138,.09)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>
          <span>오늘 업무 진행률</span>
          <span style={{ color: totalRate >= 80 ? '#2E7D5E' : totalRate >= 50 ? '#D4860A' : '#C0392B' }}>{totalRate}%</span>
        </div>
        <div style={{ height: '8px', background: 'var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${totalRate}%`, background: totalRate >= 80 ? '#2E7D5E' : totalRate >= 50 ? '#D4860A' : '#C0392B', borderRadius: '4px', transition: 'width 0.4s' }} />
        </div>
        {allDone && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', color: '#2E7D5E', fontSize: '12px', fontWeight: 600 }}>
            <LuCircleCheck style={{ width: '14px', height: '14px' }} />
            모든 업무 완료 — 인수인계 준비됨
          </div>
        )}
      </div>

      {/* 환자별 업무 현황 */}
      <div style={{ background: 'var(--color-surface)', borderRadius: '10px', boxShadow: '0 2px 12px rgba(44,110,138,.09)', padding: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 14px' }}>
          환자별 업무 현황
        </h3>        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {myPatients.map(patient => {
            const ptTasks    = myTasks.filter(t => t.patientId === patient.id)
            const ptCompleted = ptTasks.filter(t => t.status === 'Completed').length
            const ptPending   = ptTasks.filter(t => t.status === 'Pending')
            const rate        = ptTasks.length === 0 ? 100 : Math.round((ptCompleted / ptTasks.length) * 100)

            return (
              <div key={patient.id} style={{
                padding: '12px 14px', borderRadius: '9px',
                border: `1px solid var(--color-border)`,
                borderLeft: `4px solid ${severityColor(patient.severity)}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>{patient.name}</span>
                    <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>병실 {patient.roomNumber}</span>
                    <span style={{ padding: '2px 7px', borderRadius: '5px', fontSize: '10px', fontWeight: 700, background: patient.severity === 'High' ? '#FDECEA' : patient.severity === 'Medium' ? '#FEF3E2' : '#E8F5EE', color: severityColor(patient.severity) }}>
                      {patient.severity}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: rate === 100 ? '#2E7D5E' : '#D4860A' }}>
                    {ptCompleted}/{ptTasks.length} ({rate}%)
                  </span>
                </div>

                {/* 미완료 업무 목록 */}
                {ptPending.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {ptPending.map(task => (
                      <div key={task.taskId} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                        <LuTriangleAlert style={{ width: '12px', height: '12px', color: '#D4860A', flexShrink: 0 }} />
                        <span style={{ color: 'var(--color-muted)' }}>{task.taskName}</span>
                        {task.description && <span style={{ color: 'var(--color-muted)', opacity: 0.7 }}>— {task.description}</span>}
                        <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--color-muted)', flexShrink: 0 }}>
                          {task.dueTime}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {ptPending.length === 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#2E7D5E' }}>
                    <LuCircleCheck style={{ width: '13px', height: '13px' }} />
                    모든 업무 완료
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 저장된 보고서 이력 */}
      {savedReports.filter(r => r.nurseId === currentUser?.id).length === 0 && (
        <div style={{ background: 'var(--color-surface)', borderRadius: '10px', boxShadow: '0 2px 12px rgba(44,110,138,.09)', padding: '20px', marginTop: '20px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
            <LuBookOpen style={{ width: '15px', height: '15px', color: 'var(--color-primary)' }} />
            저장된 인수인계 보고서
          </h3>
          <div style={{ color: 'var(--color-muted)', fontSize: '13px', padding: '12px 0' }}>
            저장된 보고서가 없습니다
          </div>
        </div>
      )}
      {savedReports.filter(r => r.nurseId === currentUser?.id).length > 0 && (
        <div style={{ background: 'var(--color-surface)', borderRadius: '10px', boxShadow: '0 2px 12px rgba(44,110,138,.09)', padding: '20px', marginTop: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LuBookOpen style={{ width: '15px', height: '15px', color: 'var(--color-primary)' }} />
            저장된 인수인계 보고서
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {savedReports.filter(r => r.nurseId === currentUser?.id).map(report => (
              <div key={report.reportId} style={{
                padding: '12px 14px', borderRadius: '9px',
                border: '1px solid var(--color-border)',
                borderLeft: '4px solid var(--color-primary)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>
                    {new Date(report.shiftDate).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, background: '#EBF4F8', color: 'var(--color-primary)' }}>
                    {report.shiftType === 'Day' ? '주간' : report.shiftType === 'Evening' ? '저녁' : '야간'}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
                  완료 업무: {report.completedTaskIds.length}건
                </div>
                {report.handoffSummary && (
                  <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {report.handoffSummary}
                  </div>
                )}
                {report.writerSignature && (
                  <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '6px' }}>
                    작성자 서명: {report.writerSignature}
                  </div>
                )}
                {report.receiverSignature && (
                  <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '2px' }}>
                    인수자 서명: {report.receiverSignature}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {savedMsg && (
        <div style={{
          position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
          background: '#2E7D5E', color: '#fff', padding: '10px 20px', borderRadius: '20px',
          fontSize: '13px', fontWeight: 600, zIndex: 999,
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        }}>
          ✅ 인수인계 보고서가 저장되었습니다
        </div>
      )}

      {/* 보고서 모달 */}
      {currentUser && (
        <ShiftReportModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          nurse={currentUser}
          patients={myPatients}
          tasks={myTasks}
          onSaved={() => {
            setModalOpen(false)
            setSavedMsg(true)
            setTimeout(() => setSavedMsg(false), 3000)
          }}
        />
      )}
    </motion.div>
  )
}

export default HandoverPage
