import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LuPill, LuClock, LuTriangleAlert, LuCircleCheck, LuUser,
  LuArrowUpDown, LuUsers, LuClipboardList, LuStethoscope,
  LuCheckCheck, LuX, LuChevronDown, LuChevronUp, LuCircleAlert,
} from 'react-icons/lu'
import { useAppDispatch } from '../hooks/useAppDispatch'
import { useAppSelector } from '../hooks/useAppSelector'
import { setPatients } from '../store/slices/patientsSlice'
import { getMedicationCountdown } from '../hooks/useMedicationTimer'
import { verifyPrescription, discontinuePrescription } from '../store/slices/prescriptionsSlice'

const ROUTE_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  IV:    { bg: '#FEF3E2', color: '#D4860A', label: 'IV 정맥' },
  PO:    { bg: '#E8F5EE', color: '#2E7D5E', label: 'PO 경구' },
  SC:    { bg: '#EBF4F8', color: '#2C6E8A', label: 'SC 피하' },
  NEB:   { bg: '#EEF0FB', color: '#3F51B5', label: '흡입' },
  O2:    { bg: '#EBF4F8', color: '#2C6E8A', label: '산소' },
  IM:    { bg: '#F0EBF8', color: '#6B3FA0', label: 'IM 근육' },
  Other: { bg: '#F0F4F7', color: '#6B8090', label: '기타' },
}

type TabType = 'schedule' | 'orders'

const MedicationSchedulePage: React.FC = () => {
  const dispatch       = useAppDispatch()
  const currentUser    = useAppSelector(s => s.auth.currentUser)
  const allPatients    = useAppSelector(s => s.patients.allPatients)
  const prescriptions  = useAppSelector(s => s.prescriptions.items)
  const [tick, setTick] = useState(0)
  const [sortBy, setSortBy] = useState<'time' | 'patient'>('time')
  const [tab, setTab] = useState<TabType>('schedule')
  const [expandedRx, setExpandedRx] = useState<string | null>(null)

  useEffect(() => {
    if (allPatients.length === 0) {
      fetch('/api/patients').then(r => r.json()).then(d => dispatch(setPatients(d))).catch(console.error)
    }
  }, [dispatch, allPatients.length])

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  const todayKey = new Date().toISOString().slice(0, 10)
  const assignsToday = useAppSelector(s => s.assignments.byDate[todayKey] ?? {})
  const myPatients = allPatients.filter(p =>
    Object.values(assignsToday[p.id] ?? {}).includes(currentUser?.id ?? '')
  )

  // 투약 스케줄 — 담당 환자의 모든 약물
  const allMeds = myPatients.flatMap(patient =>
    patient.medications.map(med => {
      const countdown = getMedicationCountdown(med.frequency)
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

  const sorted = [...allMeds].sort((a, b) => {
    if (sortBy === 'patient') return a.patient.name.localeCompare(b.patient.name)
    if (a.minutesLeft !== b.minutesLeft) return a.minutesLeft - b.minutesLeft
    return a.patient.age - b.patient.age
  })

  const urgentCount = sorted.filter(m => m.minutesLeft === 0).length
  const soonCount   = sorted.filter(m => m.minutesLeft === 10).length

  // 처방 오더 — 담당 환자의 처방 목록
  const myPatientIds = new Set(myPatients.map(p => p.id))
  const myPrescriptions = prescriptions.filter(rx => myPatientIds.has(rx.patientId) && rx.status === 'active')
  const unverifiedCount = myPrescriptions.filter(rx => !rx.verified).length

  const handleVerify = (rxId: string) => {
    dispatch(verifyPrescription(rxId))
    fetch(`/api/prescriptions/${rxId}/verify`, { method: 'PATCH' }).catch(() => {})
  }
  const handleDiscontinue = (rxId: string) => {
    dispatch(discontinuePrescription(rxId))
    fetch(`/api/prescriptions/${rxId}/discontinue`, { method: 'PATCH' }).catch(() => {})
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      style={{ padding: '22px 24px 60px' }}>

      {/* 헤더 */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LuPill style={{ width: '20px', height: '20px', color: 'var(--color-primary)' }} />
            투약 스케줄
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '4px' }}>담당 환자 처방 약물 및 의사 오더 관리</p>
        </div>
        {tab === 'schedule' && (
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['time', 'patient'] as const).map(s => (
              <button key={s} onClick={() => setSortBy(s)} style={{
                padding: '8px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 600,
                border: sortBy === s ? 'none' : '1.5px solid var(--color-border)',
                background: sortBy === s ? 'var(--color-primary)' : 'transparent',
                color: sortBy === s ? '#fff' : 'var(--color-text)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '5px',
              }}>
                {s === 'time' ? <><LuArrowUpDown size={12} />시간순</> : <><LuUsers size={12} />환자순</>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 탭 */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'var(--color-bg)', borderRadius: '10px', padding: '4px', border: '1px solid var(--color-border)' }}>
        {([
          { key: 'schedule', icon: LuClipboardList, label: '투약 스케줄', badge: urgentCount > 0 ? urgentCount : null, badgeColor: '#C0392B' },
          { key: 'orders',   icon: LuStethoscope,  label: '의사 처방 오더', badge: unverifiedCount > 0 ? unverifiedCount : null, badgeColor: '#D4860A' },
        ] as const).map(({ key, icon: Icon, label, badge, badgeColor }) => (
          <button key={key} onClick={() => setTab(key)} style={{
            flex: 1, padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            background: tab === key ? 'var(--color-surface)' : 'transparent',
            color: tab === key ? 'var(--color-primary)' : 'var(--color-muted)',
            fontWeight: tab === key ? 700 : 500, fontSize: '13px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            boxShadow: tab === key ? '0 1px 6px rgba(0,0,0,0.07)' : 'none', transition: 'all 0.15s',
          }}>
            <Icon size={15} />
            {label}
            {badge !== null && (
              <span style={{ background: badgeColor, color: '#fff', borderRadius: '10px', padding: '1px 6px', fontSize: '10px', fontWeight: 800 }}>{badge}</span>
            )}
          </button>
        ))}
      </div>


      <AnimatePresence mode="wait">
      {tab === 'schedule' ? (
        <motion.div key="schedule" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {/* 요약 카드 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: '지금 투여 필요', value: urgentCount, color: urgentCount > 0 ? '#C0392B' : 'var(--color-muted)', bg: urgentCount > 0 ? '#FDECEA' : 'var(--color-surface)', border: urgentCount > 0 ? '#C0392B' : '#DDE3E8' },
              { label: '20분 내 예정',   value: soonCount,   color: soonCount > 0 ? '#D4860A' : 'var(--color-muted)',  bg: soonCount > 0 ? '#FEF3E2' : 'var(--color-surface)',  border: soonCount > 0 ? '#D4860A' : '#DDE3E8' },
              { label: '전체 처방',       value: sorted.length, color: 'var(--color-primary)', bg: 'var(--color-surface)', border: '#DDE3E8' },
            ].map(c => (
              <div key={c.label} style={{ background: c.bg, borderRadius: '10px', padding: '16px', boxShadow: '0 2px 12px rgba(44,110,138,.09)', borderTop: `3px solid ${c.border}` }}>
                <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginBottom: '4px' }}>{c.label}</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: c.color }}>{c.value}건</div>
              </div>
            ))}
          </div>

          {/* 투약 테이블 */}
          <div style={{ background: 'var(--color-surface)', borderRadius: '10px', boxShadow: '0 2px 12px rgba(44,110,138,.09)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }} key={tick}>
              <thead>
                <tr style={{ background: 'var(--color-bg)' }}>
                  {['환자', '약물명', '용량 / 빈도', '투여 경로', '다음 투여까지'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '2px solid var(--color-border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map(({ patient, med, countdown, minutesLeft }, i) => {
                  const rs = ROUTE_STYLE[med.route] ?? ROUTE_STYLE.Other
                  const isUrgent = minutesLeft === 0
                  const isSoon   = minutesLeft === 10
                  return (
                    <tr key={`${patient.id}-${i}`} style={{ borderBottom: '1px solid var(--color-border)', background: isUrgent ? 'rgba(192,57,43,0.04)' : isSoon ? 'rgba(212,134,10,0.03)' : 'transparent' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <LuUser size={13} style={{ color: 'var(--color-muted)', flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>{patient.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--color-muted)' }}>병실 {patient.roomNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>{med.name}</td>
                      <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--color-muted)' }}>{med.dosage} · {med.frequency}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: 700, background: rs.bg, color: rs.color }}>{rs.label}</span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {countdown ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, color: isUrgent ? '#C0392B' : isSoon ? '#D4860A' : 'var(--color-muted)' }}>
                            {isUrgent ? <LuTriangleAlert size={13} /> : <LuClock size={13} />}
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
                  <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--color-muted)', fontSize: '14px' }}>
                    <LuCircleCheck size={28} style={{ margin: '0 auto 8px', color: '#2E7D5E', display: 'block' }} />
                    처방된 약물이 없습니다
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : (
        <motion.div key="orders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {/* 처방 오더 헤더 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
              의사 처방 오더 — 담당 환자 기준 <strong style={{ color: 'var(--color-text)' }}>{myPrescriptions.length}건</strong>
              {unverifiedCount > 0 && <span style={{ marginLeft: '8px', color: '#D4860A', fontWeight: 700 }}>미확인 {unverifiedCount}건</span>}
            </div>
          </div>

          {unverifiedCount > 0 && (
            <div style={{ background: '#FEF3E2', border: '1px solid #FFB74D', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <LuCircleAlert size={18} style={{ color: '#D4860A', flexShrink: 0 }} />
              <div style={{ fontSize: '13px', color: '#D4860A', fontWeight: 600 }}>
                미확인 처방 {unverifiedCount}건이 있습니다. 아래에서 처방을 확인하고 서명하세요.
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {myPrescriptions.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-muted)', background: 'var(--color-surface)', borderRadius: '10px' }}>
                <LuStethoscope size={28} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.3 }} />
                담당 환자의 활성 처방이 없습니다
              </div>
            )}
            {myPrescriptions.map(rx => {
              const rs = ROUTE_STYLE[rx.medication.route] ?? ROUTE_STYLE.Other
              const isExpanded = expandedRx === rx.id
              const orderedAgo = Math.round((Date.now() - rx.orderedAt) / 60000)
              const agoText = orderedAgo < 60 ? `${orderedAgo}분 전` : `${Math.floor(orderedAgo / 60)}시간 전`
              return (
                <div key={rx.id} style={{ background: 'var(--color-surface)', borderRadius: '12px', border: `1px solid ${rx.verified ? 'var(--color-border)' : '#FFB74D'}`, overflow: 'hidden', boxShadow: '0 2px 12px rgba(44,110,138,.06)' }}>
                  <button onClick={() => setExpandedRx(isExpanded ? null : rx.id)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                      {!rx.verified && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#D4860A', flexShrink: 0 }} />}
                      <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>{rx.patientName}</span>
                          <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>병실 {rx.roomNumber}</span>
                          <span style={{ padding: '2px 7px', borderRadius: '5px', fontSize: '11px', fontWeight: 700, background: rs.bg, color: rs.color }}>{rs.label}</span>
                          {!rx.verified && <span style={{ padding: '2px 8px', borderRadius: '5px', fontSize: '10px', fontWeight: 800, background: '#FEF3E2', color: '#D4860A' }}>미확인</span>}
                          {rx.verified  && <span style={{ padding: '2px 8px', borderRadius: '5px', fontSize: '10px', fontWeight: 800, background: '#E8F5EE', color: '#2E7D5E' }}>확인 완료</span>}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--color-text)', marginTop: '3px', fontWeight: 500 }}>{rx.medication.name} <span style={{ opacity: 0.6 }}>{rx.medication.dosage} · {rx.medication.frequency}</span></div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>{agoText}</span>
                      {isExpanded ? <LuChevronUp size={14} style={{ color: 'var(--color-muted)' }} /> : <LuChevronDown size={14} style={{ color: 'var(--color-muted)' }} />}
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} style={{ overflow: 'hidden' }}>
                        <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--color-border)' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '14px', marginBottom: '14px' }}>
                            {[
                              ['처방 의사', rx.doctorName],
                              ['처방 적응증', rx.indication],
                              ['투약 기간', rx.duration ?? '-'],
                              ['시작일', rx.startDate],
                            ].map(([label, value]) => (
                              <div key={label}>
                                <div style={{ fontSize: '10px', color: 'var(--color-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '3px' }}>{label}</div>
                                <div style={{ fontSize: '13px', color: 'var(--color-text)', fontWeight: 500 }}>{value}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {!rx.verified && (
                              <button onClick={() => handleVerify(rx.id)} style={{ flex: 1, padding: '9px 0', borderRadius: '8px', border: 'none', background: '#2E7D5E', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                <LuCheckCheck size={14} /> 처방 확인 서명
                              </button>
                            )}
                            <button onClick={() => handleDiscontinue(rx.id)} style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-muted)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <LuX size={13} /> 중단
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </motion.div>
  )
}

export default MedicationSchedulePage
