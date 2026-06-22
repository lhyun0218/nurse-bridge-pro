import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { LuPill, LuClock, LuTriangleAlert, LuCircleCheck, LuUser, LuArrowUpDown, LuUsers } from 'react-icons/lu'
import { useAppDispatch } from '../hooks/useAppDispatch'
import { useAppSelector } from '../hooks/useAppSelector'
import { setPatients } from '../store/slices/patientsSlice'
import { getMedicationCountdown } from '../hooks/useMedicationTimer'

const ROUTE_STYLE: Record<string, { bg: string; color: string }> = {
  IV:    { bg: '#FEF3E2', color: '#D4860A' },
  PO:    { bg: '#E8F5EE', color: '#2E7D5E' },
  SC:    { bg: '#EBF4F8', color: '#2C6E8A' },
  NEB:   { bg: '#EBF4F8', color: '#2C6E8A' },
  O2:    { bg: '#EBF4F8', color: '#2C6E8A' },
  IM:    { bg: '#F0EBF8', color: '#6B3FA0' },
  Other: { bg: '#F0F4F7', color: '#6B8090' },
}

const MedicationSchedulePage: React.FC = () => {
  const dispatch    = useAppDispatch()
  const currentUser = useAppSelector(s => s.auth.currentUser)
  const allPatients = useAppSelector(s => s.patients.allPatients)
  const [tick, setTick] = useState(0)
  const [sortBy, setSortBy] = useState<'time' | 'age'>('time') // time: 시간순 (기본), age: 나이순

  // 데이터가 아직 없을 때만 fetch
  useEffect(() => {
    if (allPatients.length === 0) {
      fetch('/api/patients').then(r => r.json()).then(d => dispatch(setPatients(d))).catch(console.error)
    }
  }, [dispatch, allPatients.length])

  // 1분마다 카운트다운 갱신
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  const todayKey = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })()
  const assignsToday = useAppSelector(s => s.assignments.byDate[todayKey] ?? {})
  const myPatients = allPatients.filter(p => Object.values(assignsToday[p.id] ?? {}).includes(currentUser?.id ?? ''))

  // 투약 목록 평탄화 (환자 + 약물 + 남은 분 수치 포함)
  const allMeds = myPatients.flatMap(patient =>
    patient.medications.map(med => {
      const countdown = getMedicationCountdown(med.frequency)
      // 정렬용 분 수치 계산: PRN/지속은 Infinity
      let minutesLeft = Infinity
      if (countdown) {
        if (countdown.includes('지금 투여')) minutesLeft = 0
        else if (countdown.includes('곧 투여')) minutesLeft = 10
        else {
          const hMatch = countdown.match(/(\d+)시간(?:\s*(\d+)분)?/)
          const mMatch = countdown.match(/^(\d+)분/)
          if (hMatch) minutesLeft = parseInt(hMatch[1]) * 60 + parseInt(hMatch[2] ?? '0')
          else if (mMatch) minutesLeft = parseInt(mMatch[1])
        }
      }
      return { patient, med, countdown, minutesLeft }
    })
  )

  // 다음 투여까지 남은 시간 오름차순 (가장 급한 것이 위)
  // PRN/지속(Infinity)은 항상 맨 아래
  const sorted = [...allMeds].sort((a, b) => {
    if (sortBy === 'age') {
      return a.patient.age - b.patient.age
    }
    // 기본: 남은 시간 오름차순
    if (a.minutesLeft !== b.minutesLeft) return a.minutesLeft - b.minutesLeft
    // 같으면 나이순
    return a.patient.age - b.patient.age
  })

  const urgentCount = sorted.filter(m => m.countdown && m.countdown.includes('지금 투여')).length
  const soonCount   = sorted.filter(m => m.countdown && m.countdown.includes('곧 투여')).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ padding: '22px 24px 60px' }}
    >
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LuPill style={{ width: '20px', height: '20px', color: 'var(--color-primary)' }} />
            투약 스케줄
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '4px' }}>
            담당 환자 전체 처방 약물 및 투여 일정
          </p>
        </div>

        {/* 정렬 버튼 */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setSortBy('time')}
            style={{
              padding: '8px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 600,
              border: sortBy === 'time' ? 'none' : '1.5px solid var(--color-border)',
              background: sortBy === 'time' ? 'var(--color-primary)' : 'transparent',
              color: sortBy === 'time' ? '#fff' : 'var(--color-text)',
              cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <LuArrowUpDown style={{ width: '13px', height: '13px' }} />
            시간순
          </button>
          <button
            onClick={() => setSortBy('age')}
            style={{
              padding: '8px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 600,
              border: sortBy === 'age' ? 'none' : '1.5px solid var(--color-border)',
              background: sortBy === 'age' ? 'var(--color-primary)' : 'transparent',
              color: sortBy === 'age' ? '#fff' : 'var(--color-text)',
              cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <LuUsers style={{ width: '13px', height: '13px' }} />
            나이순
          </button>
        </div>
      </div>

      {/* 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <div style={{ background: urgentCount > 0 ? '#FDECEA' : 'var(--color-surface)', borderRadius: '10px', padding: '16px', boxShadow: '0 2px 12px rgba(44,110,138,.09)', borderTop: `3px solid ${urgentCount > 0 ? '#C0392B' : '#DDE3E8'}` }}>
          <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginBottom: '4px' }}>지금 투여 필요</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: urgentCount > 0 ? '#C0392B' : 'var(--color-muted)' }}>{urgentCount}건</div>
        </div>
        <div style={{ background: soonCount > 0 ? '#FEF3E2' : 'var(--color-surface)', borderRadius: '10px', padding: '16px', boxShadow: '0 2px 12px rgba(44,110,138,.09)', borderTop: `3px solid ${soonCount > 0 ? '#D4860A' : '#DDE3E8'}` }}>
          <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginBottom: '4px' }}>10분 내 예정</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: soonCount > 0 ? '#D4860A' : 'var(--color-muted)' }}>{soonCount}건</div>
        </div>
        <div style={{ background: 'var(--color-surface)', borderRadius: '10px', padding: '16px', boxShadow: '0 2px 12px rgba(44,110,138,.09)', borderTop: '3px solid var(--color-primary)' }}>
          <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginBottom: '4px' }}>전체 처방</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-primary)' }}>{sorted.length}건</div>
        </div>
      </div>

      {/* 투약 목록 */}
      <div style={{ background: 'var(--color-surface)', borderRadius: '10px', boxShadow: '0 2px 12px rgba(44,110,138,.09)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }} key={tick}>
          <thead>
            <tr style={{ background: 'var(--color-bg)' }}>
              {['환자', '약물명', '용량 / 빈도', '투여 경로', '다음 투여까지'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '2px solid var(--color-border)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(({ patient, med, countdown }, i) => {
              const routeStyle = ROUTE_STYLE[med.route] ?? ROUTE_STYLE.Other
              const isUrgent = countdown?.includes('지금 투여') ?? false
              const isSoon   = countdown?.includes('곧 투여') ?? false

              return (
                <tr key={`${patient.id}-${i}`} style={{
                  borderBottom: '1px solid var(--color-border)',
                  background: isUrgent ? 'rgba(192,57,43,0.04)' : isSoon ? 'rgba(212,134,10,0.03)' : 'transparent',
                }}>
                  {/* 환자 */}
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <LuUser style={{ width: '13px', height: '13px', color: 'var(--color-muted)', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>{patient.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-muted)' }}>병실 {patient.roomNumber}</div>
                      </div>
                    </div>
                  </td>

                  {/* 약물명 */}
                  <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>
                    {med.name}
                  </td>

                  {/* 용량/빈도 */}
                  <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--color-muted)' }}>
                    {med.dosage} · {med.frequency}
                  </td>

                  {/* 투여 경로 */}
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: 700, background: routeStyle.bg, color: routeStyle.color }}>
                      {med.route}
                    </span>
                  </td>

                  {/* 카운트다운 */}
                  <td style={{ padding: '12px 14px' }}>
                    {countdown ? (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        fontSize: '12px', fontWeight: 600,
                        color: isUrgent ? '#C0392B' : isSoon ? '#D4860A' : 'var(--color-muted)',
                      }}>
                        {isUrgent
                          ? <LuTriangleAlert style={{ width: '13px', height: '13px' }} />
                          : <LuClock style={{ width: '13px', height: '13px' }} />
                        }
                        {countdown}
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--color-muted)', opacity: 0.6 }}>PRN / 지속</span>
                    )}
                  </td>
                </tr>
              )
            })}

            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--color-muted)', fontSize: '14px' }}>
                  <LuCircleCheck style={{ width: '28px', height: '28px', margin: '0 auto 8px', color: '#2E7D5E' }} />
                  <div>처방된 약물이 없습니다</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}

export default MedicationSchedulePage
