import React, { useEffect } from 'react'
import { useAppDispatch } from '../hooks/useAppDispatch'
import { useAppSelector } from '../hooks/useAppSelector'
import { useToast } from '../hooks/useToast'
import { setNurses, reassignPatient } from '../store/slices/nursesSlice'
import { setPatients } from '../store/slices/patientsSlice'
import { Toast } from '../components/common'
import { getReassignmentSuggestion, getOvertimeStatus } from '../utils/overtime'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

const card: React.CSSProperties = {
  background: '#FFFFFF', borderRadius: '10px',
  boxShadow: '0 2px 12px rgba(44,110,138,.09)', padding: '20px',
}

const HeadNursePage: React.FC = () => {
  const dispatch   = useAppDispatch()
  const nurses     = useAppSelector(s => s.nurses.allNurses)
  const patients   = useAppSelector(s => s.patients.allPatients)
  const allTasks   = useAppSelector(s => s.tasks.allTasks)
  const { toasts, removeToast, success } = useToast()

  useEffect(() => {
    const load = async () => {
      try {
        const [nRes, pRes] = await Promise.all([fetch('/api/nurses'), fetch('/api/patients')])
        dispatch(setNurses(await nRes.json()))
        dispatch(setPatients(await pRes.json()))
      } catch (e) { console.error(e) }
    }
    load()
  }, [dispatch])

  // 통계 계산
  const activeNurses = nurses.filter(n => n.role === 'Nurse')
  const totalBeds = 60
  const occupiedBeds = patients.length
  const occupancyRate = Math.round((occupiedBeds / totalBeds) * 100)

  const myTaskIds = patients.flatMap(p => p.nursingTaskIds)
  const myTasks   = allTasks.filter(t => myTaskIds.includes(t.taskId))
  const completedTasks = myTasks.filter(t => t.status === 'Completed').length
  const todoRate = myTasks.length === 0 ? 0 : Math.round((completedTasks / myTasks.length) * 100)

  const warnNurses = activeNurses.filter(n => n.overtimeHours >= 3).length

  // 차트 데이터
  const occupancyData = [
    { shift: 'Day',     rate: 83 },
    { shift: 'Evening', rate: 55 },
    { shift: 'Night',   rate: 35 },
  ]

  const severityData = [
    { name: 'High',   value: patients.filter(p => p.severity === 'High').length,   color: '#C0392B' },
    { name: 'Medium', value: patients.filter(p => p.severity === 'Medium').length, color: '#D4860A' },
    { name: 'Low',    value: patients.filter(p => p.severity === 'Low').length,    color: '#2E7D5E' },
  ]

  const overtimeData = activeNurses.map(n => ({
    name: n.name,
    overtime: n.overtimeHours,
    fill: n.overtimeHours >= 5 ? '#C0392B' : n.overtimeHours >= 3 ? '#D4860A' : '#2E7D5E',
  }))

  // AI 재배치 추천
  const suggestion = getReassignmentSuggestion(activeNurses)

  const handleReassign = () => {
    if (!suggestion) return
    dispatch(reassignPatient({
      patientId: suggestion.patientId,
      fromNurseId: suggestion.fromNurse.id,
      toNurseId: suggestion.toNurse.id,
    }))
    success(`✅ 재배치 완료: ${suggestion.fromNurse.name} → ${suggestion.toNurse.name}`)
  }

  const statusColors = { ok: { bg: '#E8F5EE', color: '#2E7D5E', label: '✓ 정상' }, warn: { bg: '#FEF3E2', color: '#D4860A', label: '⚠️ 경고' }, danger: { bg: '#FDECEA', color: '#C0392B', label: '🔴 초과' } }

  return (
    <div style={{ padding: '22px 24px 60px' }}>

      {/* 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '22px' }}>
        {[
          { label: '병상 가동률', value: `${occupancyRate}%`, sub: `${occupiedBeds} / ${totalBeds} 병상`, color: '#2C6E8A', border: '#2C6E8A' },
          { label: 'Todo 처리율', value: `${todoRate}%`, sub: `${completedTasks} / ${myTasks.length} 완료`, color: '#D4860A', border: '#D4860A' },
          { label: '근무 종료까지', value: '2h 15m', sub: 'Day 근무 · 15:00 종료', color: '#2E7D5E', border: '#2E7D5E' },
          { label: '오버타임 경고', value: `${warnNurses}명`, sub: '오버타임 예상', color: warnNurses > 0 ? '#C0392B' : '#2E7D5E', border: warnNurses > 0 ? '#C0392B' : '#2E7D5E' },
        ].map(c => (
          <div key={c.label} style={{ ...card, borderTop: `3px solid ${c.border}` }}>
            <div style={{ fontSize: '11px', color: '#6B8090', marginBottom: '6px' }}>{c.label}</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: '11px', color: '#6B8090', marginTop: '3px' }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* 차트 영역 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>

        {/* 좌측: 병상 가동률 + 오버타임 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={card}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B8090', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '14px' }}>📊 근무조별 병상 가동률</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={occupancyData}>
                <XAxis dataKey="shift" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip formatter={(v) => [`${v}%`, '가동률']} />
                <Bar dataKey="rate" fill="#2C6E8A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={card}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B8090', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '14px' }}>⏱️ 간호사별 예상 오버타임</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={overtimeData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={60} />
                <Tooltip formatter={(v) => [`${v}h`, '오버타임']} />
                <Bar dataKey="overtime" radius={[0, 4, 4, 0]}>
                  {overtimeData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 우측: 중증도 파이 */}
        <div style={card}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B8090', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '14px' }}>🩺 환자 중증도 분포</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={severityData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                {severityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ textAlign: 'center', fontSize: '13px', color: '#6B8090', marginTop: '8px' }}>
            총 <strong style={{ color: '#1A2B38' }}>{patients.length}</strong>명
          </div>
        </div>
      </div>

      {/* 간호사 현황 테이블 */}
      <div style={{ ...card, marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B8090', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '14px' }}>👩‍⚕️ 간호사 현황</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#F7FAFB' }}>
                {['간호사명', '담당 환자', '완료 Todo', '예상 오버타임', '상태'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#6B8090', textTransform: 'uppercase', letterSpacing: '.4px', borderBottom: '2px solid #DDE3E8' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeNurses.map(nurse => {
                const st = getOvertimeStatus(nurse.overtimeHours)
                const sc = statusColors[st]
                const nurseTaskIds = patients.filter(p => p.assignedNurseId === nurse.id).flatMap(p => p.nursingTaskIds)
                const nurseTasks = allTasks.filter(t => nurseTaskIds.includes(t.taskId))
                const nurseCompleted = nurseTasks.filter(t => t.status === 'Completed').length
                return (
                  <tr key={nurse.id} style={{ borderBottom: '1px solid #DDE3E8' }} onMouseEnter={e => (e.currentTarget.style.background = '#FAFCFD')} onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <td style={{ padding: '12px' }}><strong>{nurse.name}</strong></td>
                    <td style={{ padding: '12px' }}>{nurse.assignedPatients.length}명</td>
                    <td style={{ padding: '12px' }}>{nurseCompleted} / {nurseTasks.length}</td>
                    <td style={{ padding: '12px' }}>{nurse.overtimeHours}h</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, background: sc.bg, color: sc.color }}>{sc.label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI 재배치 배너 */}
      {suggestion && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'linear-gradient(135deg, #EBF4F8, #F4F7F9)', border: '1px solid #C5DDE8', borderRadius: '10px' }}>
          <div style={{ fontSize: '13px', color: '#1A2B38' }}>{suggestion.message}</div>
          <button
            onClick={handleReassign}
            style={{ padding: '10px 20px', background: '#2C6E8A', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', marginLeft: '16px' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#1E5470')}
            onMouseLeave={e => (e.currentTarget.style.background = '#2C6E8A')}
          >
            🤖 자동 재배치 적용
          </button>
        </div>
      )}

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  )
}

export default HeadNursePage
