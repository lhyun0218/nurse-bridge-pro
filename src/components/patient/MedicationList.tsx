import React, { useState, useEffect } from 'react'
import type { Medication } from '../../types'
import { getMedicationCountdown } from '../../hooks/useMedicationTimer'

interface MedicationListProps {
  medications: Medication[]
}

const routeStyles: Record<string, { bg: string; color: string }> = {
  IV:    { bg: '#FEF3E2', color: '#D4860A' },
  PO:    { bg: '#E8F5EE', color: '#2E7D5E' },
  SC:    { bg: '#EBF4F8', color: '#2C6E8A' },
  NEB:   { bg: '#EBF4F8', color: '#2C6E8A' },
  O2:    { bg: '#EBF4F8', color: '#2C6E8A' },
  IM:    { bg: '#F0EBF8', color: '#6B3FA0' },
  Other: { bg: '#F0EBF8', color: '#6B3FA0' },
}

// 카운트다운 색상: 10분 이내 warn, 0분 이하 danger
function countdownStyle(countdown: string | null): React.CSSProperties {
  if (!countdown) return {}
  if (countdown === '지금 투여') return { color: '#C0392B', fontWeight: 700 }
  const minMatch = countdown.match(/^(\d+)분 후$/)
  if (minMatch && parseInt(minMatch[1], 10) <= 10) {
    return { color: '#D4860A', fontWeight: 600 }
  }
  return { color: '#6B8090' }
}

const MedicationList: React.FC<MedicationListProps> = ({ medications }) => {
  // 1분마다 카운트다운 갱신
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  if (medications.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
      {medications.map((med, i) => {
        const style    = routeStyles[med.route] ?? routeStyles.Other
        const countdown = getMedicationCountdown(med.frequency)
        const cdStyle  = countdownStyle(countdown)

        return (
          <div
            key={`${i}-${tick}`}
            style={{
              background: countdown === '지금 투여' ? '#FDECEA' : '#F0F4F7',
              borderRadius: '7px',
              padding: '9px 11px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: countdown === '지금 투여' ? '1px solid #F5C6C2' : '1px solid transparent',
              transition: 'background 0.3s',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#1A2B38' }}>{med.name}</div>
              <div style={{ fontSize: '11px', color: '#6B8090', marginTop: '1px' }}>
                {med.dosage} · {med.frequency}
              </div>
              {countdown && (
                <div style={{ fontSize: '11px', marginTop: '3px', ...cdStyle }}>
                  🕐 {countdown}
                </div>
              )}
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '5px',
                background: style.bg,
                color: style.color,
                whiteSpace: 'nowrap',
                marginLeft: '8px',
                flexShrink: 0,
              }}
            >
              {med.route}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default MedicationList
