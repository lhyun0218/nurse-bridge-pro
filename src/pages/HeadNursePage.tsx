import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { LuFileSpreadsheet, LuDownload } from 'react-icons/lu'
import { useAppDispatch } from '../hooks/useAppDispatch'
import { useAppSelector } from '../hooks/useAppSelector'
import { useToast } from '../hooks/useToast'
import { setNurses, reassignPatient } from '../store/slices/nursesSlice'
import { setPatients } from '../store/slices/patientsSlice'
import { Toast, Button } from '../components/common'
import { getReassignmentSuggestion, getOvertimeStatus, getMonthlyWorkDays } from '../utils/overtime'
import { exportAllNursesScheduleToExcel } from '../utils/exportScheduleExcel'
import {
  OccupancyChart,
  SeverityPieChart,
  OvertimeChart,
  NurseStatusTable,
  ReassignBanner,
} from '../components/head-nurse'
import { setAssignments } from '../store/slices/assignmentsSlice'
import { autoAssignPatients } from '../utils/autoAssignPatients'
import generateAssignmentsForMonth from '../store/thunks/assignmentsThunks'

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}

const card: React.CSSProperties = {
  background: 'var(--color-surface)',
  borderRadius: '10px',
  boxShadow: 'var(--shadow-card)',
  padding: '20px',
  color: 'var(--color-text)',
}

const HeadNursePage: React.FC = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const nurses   = useAppSelector(s => s.nurses.allNurses)
  const patients = useAppSelector(s => s.patients.allPatients)
  const todayKey = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })()
  const assignments = useAppSelector(s => s.assignments.byDate[todayKey] ?? {})
  const allTasks = useAppSelector(s => s.tasks.allTasks)
  const savedSchedules = useAppSelector(s => s.schedule.saved)
  
  const { toasts, removeToast, success } = useToast()
  const [imbalanceThreshold, setImbalanceThreshold] = useState(() => {
    const v = localStorage.getItem('assignImbalanceThreshold')
    return v ? Number(v) : 4
  })

  useEffect(() => {
    const load = async () => {
      try {
        const [nRes, pRes] = await Promise.all([
          fetch('/api/nurses'),
          fetch('/api/patients'),
        ])
        dispatch(setNurses(await nRes.json()))
        dispatch(setPatients(await pRes.json()))
      } catch (e) {
        console.error(e)
      }
    }
    load()
  }, [dispatch])

  // ── 통계 계산 ──────────────────────────────
  const activeNurses = nurses.filter(n => n.role === 'Nurse')
  const totalBeds    = 60
  const occupiedBeds = patients.length
  const occupancyRate = Math.round((occupiedBeds / totalBeds) * 100)

  const myTaskIds      = patients.flatMap(p => p.nursingTaskIds)
  const myTasks        = allTasks.filter(t => myTaskIds.includes(t.taskId))
  const completedTasks = myTasks.filter(t => t.status === 'Completed').length
  const todoRate       = myTasks.length === 0 ? 0 : Math.round((completedTasks / myTasks.length) * 100)

  // ── 근무표 데이터 (warnNurses보다 먼저 계산) ──
  const now = new Date()
  const scheduleYear = now.getFullYear()
  const scheduleMonth = now.getMonth() + 1
  const scheduleKey = `${scheduleYear}-${String(scheduleMonth).padStart(2, '0')}`
  const currentMonthSchedule = savedSchedules[scheduleKey] ?? []
  const coverage = useAppSelector(s => s.coverage.byMonth[`${scheduleYear}-${String(scheduleMonth).padStart(2, '0')}`] ?? { holes: [], perDateShiftCounts: {} })
  const currentMonthDays = new Date(scheduleYear, scheduleMonth, 0).getDate()
  const hasSchedule = currentMonthSchedule.length > 0
  const todayIndex = now.getDate() - 1 // 0-indexed

  // 근무표에서 오늘 날짜 기준 간호사의 실제 근무조 반환
  const getTodayShift = (nurseId: string): 'Day' | 'Evening' | 'Night' | 'Off' => {
    if (!hasSchedule) return 'Day'
    const row = currentMonthSchedule.find(r => r.nurseId === nurseId)
    if (!row || !row.shifts[todayIndex]) return 'Day'
    const s = row.shifts[todayIndex]
    if (s === 'D') return 'Day'
    if (s === 'E') return 'Evening'
    if (s === 'N') return 'Night'
    return 'Off'
  }

  const warnNurses = hasSchedule
    ? activeNurses.filter(n => getOvertimeStatus(getMonthlyWorkDays(n.id, currentMonthSchedule)) !== 'ok').length
    : 0

  // 오늘 실제 근무 중인 간호사 수 (근무표 기반)
  const todayWorkingNurses = hasSchedule
    ? activeNurses.filter(n => {
        const s = getTodayShift(n.id)
        return s !== 'Off'
      }).length
    : activeNurses.length // 근무표 없으면 전체 표시

  // ── 차트 데이터 ────────────────────────────
  const severityData = [
    { name: 'High',   value: patients.filter(p => p.severity === 'High').length,   color: '#C0392B' },
    { name: 'Medium', value: patients.filter(p => p.severity === 'Medium').length, color: '#D4860A' },
    { name: 'Low',    value: patients.filter(p => p.severity === 'Low').length,    color: '#2E7D5E' },
  ]

  // ── AI 재배치 추천 ─────────────────────────
  const suggestion = getReassignmentSuggestion(activeNurses, currentMonthSchedule)

  const handleReassign = () => {
    if (!suggestion) return
    dispatch(reassignPatient({
      patientId:    suggestion.patientId,
      fromNurseId:  suggestion.fromNurse.id,
      toNurseId:    suggestion.toNurse.id,
    }))
    success(`✅ 재배치 완료: ${suggestion.fromNurse.name} → ${suggestion.toNurse.name}`)
  }

  const handleApplyAutoAssign = async () => {
    try {
      // 클라이언트에 저장된 근무표(currentMonthSchedule)를 사용해 오늘 날짜 기준으로 자동배정 실행
      const todayIdx = new Date().getDate() - 1
      const map = autoAssignPatients(nurses, patients, { balance: true, scheduleRows: currentMonthSchedule, dateIndex: todayIdx })
      dispatch(setAssignments({ date: todayKey, assignments: map }))
      success('✅ 자동 배정(스케줄 기반) 적용 완료')
    } catch (e) {
      console.error('자동 배정 실패', e)
    }
  }

  const statCards = [
    {
      label: '병상 가동률',
      value: `${occupancyRate}%`,
      sub: `${occupiedBeds} / ${totalBeds} 병상`,
      color: '#2C6E8A', border: '#2C6E8A', fillPct: occupancyRate,
    },
    {
      label: 'Todo 처리율',
      value: `${todoRate}%`,
      sub: `${completedTasks} / ${myTasks.length} 완료`,
      color: todoRate >= 80 ? '#2E7D5E' : todoRate >= 50 ? '#D4860A' : '#C0392B',
      border: todoRate >= 80 ? '#2E7D5E' : todoRate >= 50 ? '#D4860A' : '#C0392B',
      fillPct: todoRate,
    },
    {
      label: '오늘 근무 간호사',
      value: `${todayWorkingNurses}명`,
      sub: hasSchedule ? `전체 ${activeNurses.length}명 중 오늘 근무` : `전체 간호사 ${activeNurses.length}명`,
      color: '#2C6E8A', border: '#2C6E8A',
      fillPct: Math.round((todayWorkingNurses / Math.max(activeNurses.length, 1)) * 100),
    },
    {
      label: hasSchedule ? '근무일 초과 경고' : '근무일 현황',
      value: hasSchedule ? `${warnNurses}명` : '—',
      sub: hasSchedule ? `월 22일 권고 기준 초과` : '근무표 생성 후 확인',
      color: warnNurses > 0 ? '#C0392B' : '#2E7D5E',
      border: warnNurses > 0 ? '#C0392B' : '#2E7D5E',
      fillPct: warnNurses > 0 ? Math.min(100, warnNurses * 20) : 0,
    },
  ]

  // ── 자동배정 불균형 검사 ───────────────────────
  const perNurseCounts: Record<string, number> = {}
  activeNurses.forEach(n => { perNurseCounts[n.id] = 0 })
  // assignments는 patientId -> { Day, Evening, Night }
  patients.forEach(p => {
    const a = assignments?.[p.id]
    if (a) Object.values(a).forEach(nid => { if (perNurseCounts[nid] !== undefined) perNurseCounts[nid]++ })
    else if (p.assignedNurseId && perNurseCounts[p.assignedNurseId] !== undefined) perNurseCounts[p.assignedNurseId]++
  })
  const countsArr = Object.values(perNurseCounts)
  const countsMax = countsArr.length ? Math.max(...countsArr) : 0
  const countsMin = countsArr.length ? Math.min(...countsArr) : 0
  const countsAvg = countsArr.length ? Math.round(countsArr.reduce((s, v) => s + v, 0) / countsArr.length) : 0
  const imbalance = countsMax - countsMin

  // ── 전체 병동 근무표 Excel 내보내기 ──────────
  const handleExportAllSchedules = () => {
    const year = scheduleYear
    const month = scheduleMonth

    const rows = currentMonthSchedule.length > 0 ? currentMonthSchedule : []
    const allSchedules = activeNurses.map(nurse => {
      const row = rows.find(r => r.nurseId === nurse.id)
      const schedule = row
        ? row.shifts.map((shift, i) => {
            const s = shift === 'D' ? 'Day' : shift === 'E' ? 'Evening' : shift === 'N' ? 'Night' : 'Off'
            return { date: i + 1, shift: s as import('../types').ShiftType | 'Off' }
          })
        : []
      return { nurseId: nurse.id, nurseName: nurse.name, schedule }
    })

    exportAllNursesScheduleToExcel(allSchedules, year, month)
    success(`✅ ${year}년 ${month}월 전체 근무표 Excel 저장 완료`)
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.3 }}
      style={{ padding: '22px 24px 60px' }}
    >
      {/* ── 통계 카드 ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
          병동 현황
        </h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* 전체 근무표 Excel 내보내기 */}
            <button
            onClick={handleExportAllSchedules}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 14px', borderRadius: '8px',
              border: '1.5px solid var(--color-ok)',
              background: 'var(--color-ok-bg)', color: 'var(--color-ok)',
              fontSize: '12px', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-ok)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-ok-bg)'; e.currentTarget.style.color = 'var(--color-ok)' }}
            title="전체 간호사 이번 달 근무표 Excel 다운로드"
          >
            <LuFileSpreadsheet style={{ width: '15px', height: '15px' }} />
            병동 근무표 Excel
            <LuDownload style={{ width: '13px', height: '13px', opacity: 0.7 }} />
          </button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/head-nurse/patients/new')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span>
            환자 등록
          </Button>
          <button
            onClick={handleApplyAutoAssign}
            style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', cursor: 'pointer' }}
            title="모든 환자에 대해 Day/Eve/Night 간호사 자동 배정"
          >자동 배정 적용</button>
        </div>
      </div>

      {imbalance > imbalanceThreshold && (
            <div style={{ margin: '12px 0', padding: '12px', borderRadius: '8px', background: 'var(--color-warn-bg)', border: '1px solid var(--color-warn)', color: 'var(--color-warn)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <strong>자동배정 불균형 경고:</strong>&nbsp;간호사별 배정 수 차이가 큽니다. (최대 {countsMax}명 · 최소 {countsMin}명 · 평균 {countsAvg}명)
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleApplyAutoAssign} style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--color-warn)', background: 'var(--color-warn-bg)', cursor: 'pointer' }}>자동 재배정</button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input type="number" value={imbalanceThreshold} onChange={e => setImbalanceThreshold(Number(e.target.value))} style={{ width: '64px', padding: '6px', borderRadius: '6px', border: '1px solid #E6D6C0' }} />
                  <button onClick={() => { localStorage.setItem('assignImbalanceThreshold', String(imbalanceThreshold)); success('임계값 저장됨') }} style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #D7A159', background: '#FFF', cursor: 'pointer' }}>저장</button>
                </div>
          </div>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        marginBottom: '22px',
      }}>
        {statCards.map(c => (
          <div key={c.label} style={{ ...card, borderTop: `3px solid ${c.border}` }}>
            <div style={{ fontSize: '11px', color: '#6B8090', marginBottom: '6px' }}>{c.label}</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: '11px', color: '#6B8090', marginTop: '3px' }}>{c.sub}</div>
            <div style={{ height: '4px', background: '#DDE3E8', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${c.fillPct}%`, background: c.color, borderRadius: '2px', transition: 'width .4s' }} />
            </div>
          </div>
        ))}
      </div>

      {coverage.holes && coverage.holes.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700 }}>Coverage 경고</div>
              <div style={{ fontSize: '12px', color: '#6B8090', marginTop: '6px' }}>이번 달에 교대별 최소 인원 미달이 {coverage.holes.length}건 감지되었습니다.</div>
              <div style={{ fontSize: '12px', color: '#6B8090', marginTop: '8px' }}>
                {coverage.holes.slice(0, 4).map((h: any) => (
                  <div key={`${h.date}-${h.shift}`} style={{ marginTop: '4px' }}>
                    • {new Date(h.date).toLocaleDateString('ko-KR')} · {h.shift} — {h.count}/{h.required}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { dispatch(generateAssignmentsForMonth(scheduleYear, scheduleMonth, 1)); success('재검토용 배정 다시 생성됨') }} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>다시 생성</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 이번 달 저장된 근무표 요약 ── */}
      <div style={{ ...card, marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>이번 달 저장된 근무표</h3>
            <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#6B8090' }}>
              자동 생성된 스케줄이 있으면 이곳에 표시됩니다. 없으면 근무표 자동 생성 페이지에서 먼저 생성하세요.
            </p>
          </div>
          <div style={{ fontSize: '12px', color: '#6B8090' }}>
            {scheduleMonth}월 · {currentMonthSchedule.length > 0 ? '저장됨' : '미생성'}
          </div>
        </div>
        {currentMonthSchedule.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg)' }}>
                  {['간호사', 'D', 'E', 'N', 'OFF', '주말근무', 'OT 위험'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeNurses.map(nurse => {
                  const row = currentMonthSchedule.find(r => r.nurseId === nurse.id)
                  const counts = row ? {
                    D: row.shifts.filter(s => s === 'D').length,
                    E: row.shifts.filter(s => s === 'E').length,
                    N: row.shifts.filter(s => s === 'N').length,
                    OFF: row.shifts.filter(s => s === 'OFF').length,
                    weekend: row.stats.weekendWork,
                    risk: row.stats.overtimeRisk,
                  } : { D: 0, E: 0, N: 0, OFF: currentMonthDays, weekend: 0, risk: false }

                  return (
                    <tr key={nurse.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px' }}><strong>{nurse.name}</strong></td>
                      <td style={{ padding: '12px' }}>{counts.D}</td>
                      <td style={{ padding: '12px' }}>{counts.E}</td>
                      <td style={{ padding: '12px' }}>{counts.N}</td>
                      <td style={{ padding: '12px' }}>{counts.OFF}</td>
                      <td style={{ padding: '12px' }}>{counts.weekend}</td>
                      <td style={{ padding: '12px', color: counts.risk ? 'var(--color-danger)' : 'var(--color-ok)', fontWeight: 600 }}>
                        {counts.risk ? '주의' : '정상'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '14px 0', color: '#6B8090', borderTop: '1px solid #E8EDF0' }}>
            현재 저장된 근무표가 없습니다. 수간호사 관리 페이지에서 스케줄을 먼저 생성하거나 수정해 주세요.
          </div>
        )}
      </div>

      {/* ── 차트 영역 ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '16px',
        marginBottom: '16px',
      }}>
        {/* 좌측: 병상 가동률 + 오버타임 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <OccupancyChart scheduleRows={currentMonthSchedule} totalBeds={totalBeds} />
          <OvertimeChart nurses={activeNurses} scheduleRows={currentMonthSchedule} />
        </div>

        {/* 우측: 중증도 파이 */}
        <SeverityPieChart data={severityData} total={patients.length} />
      </div>

      {/* ── 간호사 현황 테이블 ── */}
      <div style={{ marginBottom: '16px' }}>
        <NurseStatusTable nurses={nurses} patients={patients} allTasks={allTasks} scheduleRows={currentMonthSchedule} />
      </div>

      {/* ── AI 재배치 배너 ── */}
      <ReassignBanner suggestion={suggestion} onApply={handleReassign} />

      {/* ── 간호사별 담당 환자 ── */}
      <div style={{ marginTop: '16px' }}>
        <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
            간호사별 담당 환자
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
            전체 {patients.length}명 / 간호사 {activeNurses.length}명
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {activeNurses.map(nurse => {
            const assignedPatients = patients.filter(p => {
              const a = assignments?.[p.id]
              if (!a) return p.assignedNurseId === nurse.id
              return Object.values(a).includes(nurse.id)
            })
              .sort((a, b) => {
                const order = { High: 0, Medium: 1, Low: 2 }
                return order[a.severity] - order[b.severity]
              })
            const nurseTasks = allTasks.filter(t => assignedPatients.some(p => p.id === t.patientId))
            const doneCount  = nurseTasks.filter(t => t.status === 'Completed').length
            const todoRate   = nurseTasks.length === 0 ? 0 : Math.round((doneCount / nurseTasks.length) * 100)
            const nurseWorkDays = getMonthlyWorkDays(nurse.id, currentMonthSchedule)
            const isOT       = hasSchedule && nurseWorkDays > 22
            const todayShift = getTodayShift(nurse.id)
            const shiftColor = todayShift === 'Day' ? '#2C6E8A' : todayShift === 'Evening' ? '#D4860A' : todayShift === 'Night' ? '#3F51B5' : '#6B8090'

            return (
              <div key={nurse.id} style={{ ...card, padding: '16px 20px' }}>
                {/* 간호사 헤더 */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  marginBottom: assignedPatients.length > 0 ? '14px' : '0',
                  paddingBottom: assignedPatients.length > 0 ? '12px' : '0',
                  borderBottom: assignedPatients.length > 0 ? '1px solid var(--color-border)' : 'none',
                }}>
                  {/* 아바타 */}
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: shiftColor, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', fontWeight: 700, flexShrink: 0,
                  }}>
                    {nurse.name.charAt(0)}
                  </div>

                  {/* 이름 + 뱃지 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>
                        {nurse.name}
                      </span>
                      <span style={{
                        fontSize: '10px', fontWeight: 700, padding: '2px 7px',
                        borderRadius: '5px', background: `${shiftColor}18`, color: shiftColor,
                      }}>
                        {todayShift === 'Off' ? '휴무' : todayShift}
                      </span>
                      {isOT && (
                        <span style={{
                          fontSize: '10px', fontWeight: 700, padding: '2px 7px',
                          borderRadius: '5px', background: '#FDECEA', color: '#C0392B',
                        }}>
                          근무 {nurseWorkDays}일 (+{nurseWorkDays - 22}일)
                        </span>
                      )}
                    </div>
                    {/* 진행률 바 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
                      <div style={{ flex: 1, height: '4px', background: 'var(--color-border)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: '2px', transition: 'width 0.3s',
                          width: `${todoRate}%`,
                          background: todoRate >= 80 ? '#2E7D5E' : todoRate >= 50 ? '#2C6E8A' : '#D4860A',
                        }} />
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--color-muted)', flexShrink: 0 }}>
                        Todo {doneCount}/{nurseTasks.length} ({todoRate}%)
                      </span>
                    </div>
                  </div>

                  {/* 환자 수 뱃지 */}
                  <div style={{
                    flexShrink: 0, textAlign: 'center',
                    background: 'var(--color-bg)', borderRadius: '8px',
                    padding: '6px 14px', border: '1px solid var(--color-border)',
                  }}>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-primary)' }}>
                      {assignedPatients.length}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--color-muted)' }}>담당 환자</div>
                  </div>
                </div>

                {/* 환자 목록 */}
                {assignedPatients.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '12px', fontSize: '13px', color: 'var(--color-muted)' }}>
                    배정된 환자 없음
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: '8px',
                  }}>
                    {assignedPatients.map(patient => {
                      const ptTasks   = allTasks.filter(t => t.patientId === patient.id)
                      const ptDone    = ptTasks.filter(t => t.status === 'Completed').length
                      const ptRate    = ptTasks.length === 0 ? 0 : Math.round((ptDone / ptTasks.length) * 100)
                      const ptPending = ptTasks.filter(t => t.status === 'Pending').length
                      const sevColor  = patient.severity === 'High' ? '#C0392B' : patient.severity === 'Medium' ? '#D4860A' : '#2E7D5E'
                      const sevBg     = patient.severity === 'High' ? '#FDECEA' : patient.severity === 'Medium' ? '#FEF3E2' : '#E8F5EE'

                      return (
                        <div
                          key={patient.id}
                          onClick={() => navigate(`/patient/${patient.id}`)}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: `1.5px solid var(--color-border)`,
                            borderLeft: `4px solid ${sevColor}`,
                            cursor: 'pointer',
                            background: 'var(--color-bg)',
                            transition: 'box-shadow 0.15s, border-color 0.15s',
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(44,110,138,.12)'
                            ;(e.currentTarget as HTMLDivElement).style.borderColor = sevColor
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
                            ;(e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border)'
                          }}
                        >
                          {/* 이름 + 병실 + 중증도 */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>
                              {patient.name}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                              {patient.roomNumber}호
                            </span>
                            <span style={{
                              marginLeft: 'auto', fontSize: '10px', fontWeight: 700,
                              padding: '1px 6px', borderRadius: '4px',
                              background: sevBg, color: sevColor,
                            }}>
                              {patient.severity}
                            </span>
                          </div>

                          {/* 진단명 */}
                          <div style={{
                            fontSize: '11px', color: 'var(--color-muted)',
                            marginBottom: '7px',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {patient.diagnosis.join(', ')}
                          </div>

                          {/* Todo 미니 진행바 */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{
                              flex: 1, height: '3px',
                              background: 'var(--color-border)', borderRadius: '2px', overflow: 'hidden',
                            }}>
                              <div style={{
                                height: '100%', borderRadius: '2px',
                                width: `${ptRate}%`,
                                background: ptRate >= 80 ? '#2E7D5E' : ptRate >= 50 ? '#2C6E8A' : '#D4860A',
                                transition: 'width 0.3s',
                              }} />
                            </div>
                            <span style={{ fontSize: '10px', color: 'var(--color-muted)', flexShrink: 0 }}>
                              {ptDone}/{ptTasks.length}
                            </span>
                            {ptPending > 0 && (
                              <span style={{
                                fontSize: '10px', fontWeight: 700,
                                color: '#fff', background: '#D4860A',
                                padding: '1px 5px', borderRadius: '4px', flexShrink: 0,
                              }}>
                                {ptPending}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <Toast toasts={toasts} onRemove={removeToast} />
    </motion.div>
  )
}

export default HeadNursePage
