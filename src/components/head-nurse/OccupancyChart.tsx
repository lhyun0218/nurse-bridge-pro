import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { useAppSelector } from '../../hooks/useAppSelector'

interface OccupancyChartProps {
  totalBeds?: number
}

const SHIFT_COLORS: Record<string, string> = {
  Day:     '#2C6E8A',
  Evening: '#D4860A',
  Night:   '#3F51B5',
}

const OccupancyChart: React.FC<OccupancyChartProps> = ({ totalBeds = 60 }) => {
  const patients     = useAppSelector(s => s.patients.allPatients)
  const nurses       = useAppSelector(s => s.nurses.allNurses).filter(n => n.role === 'Nurse')
  const savedSchedules = useAppSelector(s => s.schedule.saved)

  const now = new Date()
  const scheduleYear  = now.getFullYear()
  const scheduleMonth = now.getMonth() + 1
  const scheduleKey   = `${scheduleYear}-${String(scheduleMonth).padStart(2, '0')}`
  const todayIdx      = now.getDate() - 1

  const scheduleRows  = savedSchedules[scheduleKey] ?? []
  const hasSchedule   = scheduleRows.length > 0

  const todayKey = `${scheduleYear}-${String(scheduleMonth).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const assignsToday = useAppSelector(s => s.assignments.byDate[todayKey] ?? {})

  // ── 교대별 환자 수 계산 ──────────────────────────────────────────────
  const shiftPatientCount: Record<string, number> = { Day: 0, Evening: 0, Night: 0 }

  if (hasSchedule) {
    // 근무표 있음: scheduleSlice + assignmentsSlice 기반 계산

    // 오늘 각 간호사의 근무조 파악
    const todayShiftMap: Record<string, string> = {}
    scheduleRows.forEach(row => {
      const code = row.shifts[todayIdx]
      if (code === 'D') todayShiftMap[row.nurseId] = 'Day'
      else if (code === 'E') todayShiftMap[row.nurseId] = 'Evening'
      else if (code === 'N') todayShiftMap[row.nurseId] = 'Night'
      else todayShiftMap[row.nurseId] = 'Off'
    })

    // 각 환자에 대해 오늘 담당 간호사의 근무조에 집계
    patients.forEach(p => {
      const a = assignsToday[p.id]
      let counted = false

      if (a) {
        // 1순위: 배정 교대와 간호사 근무조가 일치하는 경우
        for (const s of ['Day', 'Evening', 'Night'] as const) {
          const nid = a[s]
          if (nid && todayShiftMap[nid] === s) {
            shiftPatientCount[s] += 1
            counted = true
            break
          }
        }
        // 2순위: 배정된 간호사 중 오늘 근무 중인 교대로 집계
        if (!counted) {
          for (const nid of Object.values(a)) {
            const ts = todayShiftMap[nid ?? '']
            if (ts && ts !== 'Off') {
              shiftPatientCount[ts] += 1
              counted = true
              break
            }
          }
        }
      }

      // 3순위: assignedNurseId로 근무조 조회
      if (!counted) {
        const shift = todayShiftMap[p.assignedNurseId ?? '']
        if (shift && shift !== 'Off') {
          shiftPatientCount[shift] += 1
          counted = true
        }
      }

      // 4순위: nurse.shiftType fallback
      if (!counted) {
        const nurse = nurses.find(n => n.id === p.assignedNurseId)
        if (nurse) {
          const ts = nurse.shiftType
          if (ts === 'Day' || ts === 'Evening' || ts === 'Night') {
            shiftPatientCount[ts] += 1
          }
        }
      }
    })
  } else {
    // 근무표 없음: Math.floor(patients.length / 3) fallback
    const base  = Math.floor(patients.length / 3)
    const extra = patients.length - base * 3 // 나머지 환자는 Day에 추가
    shiftPatientCount['Day']     = base + extra
    shiftPatientCount['Evening'] = base
    shiftPatientCount['Night']   = base
  }

  const data = (['Day', 'Evening', 'Night'] as const).map(shift => ({
    shift,
    rate:  Math.round((shiftPatientCount[shift] / totalBeds) * 100),
    count: shiftPatientCount[shift],
  }))

  return (
    <div style={{
      background: 'var(--color-surface)', borderRadius: '10px',
      boxShadow: '0 2px 12px rgba(44,110,138,.09)', padding: '20px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px',
      }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '.6px' }}>
          📊 근무조별 병상 가동률
        </div>
        <div style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
          전체 {patients.length} / {totalBeds}병상
        </div>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <XAxis dataKey="shift" tick={{ fontSize: 12, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted)' }} domain={[0, 100]} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
          <Tooltip
            formatter={(value, _name, props) => [`${value}% (${(props.payload as { count: number }).count}명)`, '병상 가동률']}
            contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '12px', background: 'var(--color-surface)', color: 'var(--color-text)' }}
          />
          <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
            {data.map(entry => (
              <Cell key={entry.shift} fill={SHIFT_COLORS[entry.shift] ?? '#2C6E8A'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {!hasSchedule && (
        <div style={{ fontSize: '11px', color: 'var(--color-muted)', textAlign: 'center', marginTop: '8px', opacity: 0.7 }}>
          * 근무표 생성 후 더 정확한 데이터가 표시됩니다
        </div>
      )}
    </div>
  )
}

export default OccupancyChart
