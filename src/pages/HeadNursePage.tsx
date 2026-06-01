import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAppDispatch } from '../hooks/useAppDispatch'
import { useAppSelector } from '../hooks/useAppSelector'
import { useToast } from '../hooks/useToast'
import { setNurses, reassignPatient } from '../store/slices/nursesSlice'
import { setPatients } from '../store/slices/patientsSlice'
import { Toast } from '../components/common'
import { getReassignmentSuggestion } from '../utils/overtime'
import {
  OccupancyChart,
  SeverityPieChart,
  OvertimeChart,
  NurseStatusTable,
  ReassignBanner,
} from '../components/head-nurse'

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}

const card: React.CSSProperties = {
  background: '#FFFFFF',
  borderRadius: '10px',
  boxShadow: '0 2px 12px rgba(44,110,138,.09)',
  padding: '20px',
}

const HeadNursePage: React.FC = () => {
  const dispatch = useAppDispatch()
  const nurses   = useAppSelector(s => s.nurses.allNurses)
  const patients = useAppSelector(s => s.patients.allPatients)
  const allTasks = useAppSelector(s => s.tasks.allTasks)
  const { toasts, removeToast, success } = useToast()

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

  const warnNurses = activeNurses.filter(n => n.overtimeHours >= 3).length

  // ── 차트 데이터 ────────────────────────────
  const severityData = [
    { name: 'High',   value: patients.filter(p => p.severity === 'High').length,   color: '#C0392B' },
    { name: 'Medium', value: patients.filter(p => p.severity === 'Medium').length, color: '#D4860A' },
    { name: 'Low',    value: patients.filter(p => p.severity === 'Low').length,    color: '#2E7D5E' },
  ]

  // ── AI 재배치 추천 ─────────────────────────
  const suggestion = getReassignmentSuggestion(activeNurses)

  const handleReassign = () => {
    if (!suggestion) return
    dispatch(reassignPatient({
      patientId:    suggestion.patientId,
      fromNurseId:  suggestion.fromNurse.id,
      toNurseId:    suggestion.toNurse.id,
    }))
    success(`✅ 재배치 완료: ${suggestion.fromNurse.name} → ${suggestion.toNurse.name}`)
  }

  // ── 통계 카드 데이터 ───────────────────────
  const statCards = [
    {
      label: '병상 가동률',
      value: `${occupancyRate}%`,
      sub: `${occupiedBeds} / ${totalBeds} 병상`,
      color: '#2C6E8A',
      border: '#2C6E8A',
      fillPct: occupancyRate,
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
      label: '근무 종료까지',
      value: '2h 15m',
      sub: 'Day 근무 · 15:00 종료',
      color: '#2E7D5E',
      border: '#2E7D5E',
      fillPct: 75,
    },
    {
      label: '오버타임 경고',
      value: `${warnNurses}명`,
      sub: '오버타임 예상',
      color: warnNurses > 0 ? '#C0392B' : '#2E7D5E',
      border: warnNurses > 0 ? '#C0392B' : '#2E7D5E',
      fillPct: warnNurses > 0 ? Math.min(100, warnNurses * 20) : 0,
    },
  ]

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

      {/* ── 차트 영역 ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '16px',
        marginBottom: '16px',
      }}>
        {/* 좌측: 병상 가동률 + 오버타임 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <OccupancyChart />
          <OvertimeChart nurses={activeNurses} />
        </div>

        {/* 우측: 중증도 파이 */}
        <SeverityPieChart data={severityData} total={patients.length} />
      </div>

      {/* ── 간호사 현황 테이블 ── */}
      <div style={{ marginBottom: '16px' }}>
        <NurseStatusTable nurses={nurses} patients={patients} allTasks={allTasks} />
      </div>

      {/* ── AI 재배치 배너 ── */}
      <ReassignBanner suggestion={suggestion} onApply={handleReassign} />

      <Toast toasts={toasts} onRemove={removeToast} />
    </motion.div>
  )
}

export default HeadNursePage
