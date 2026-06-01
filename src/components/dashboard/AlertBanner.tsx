import React from 'react'
import type { Patient } from '../../types'

interface AlertChip {
  type: 'danger' | 'warn' | 'info'
  message: string
}

interface AlertBannerProps {
  patients: Patient[]
}

function buildAlerts(patients: Patient[]): AlertChip[] {
  const chips: AlertChip[] = []

  for (const p of patients) {
    const v = p.vitalSigns
    const room = p.roomNumber
    const name = p.name

    // danger: bloodGlucose > 180
    if (v.bloodGlucose !== undefined && v.bloodGlucose > 180) {
      chips.push({
        type: 'danger',
        message: `🚨 ${room}호 ${name} — 혈당 비정상 (${v.bloodGlucose})`,
      })
    }

    // danger: oxygenSaturation < 94
    if (v.oxygenSaturation < 94) {
      chips.push({
        type: 'danger',
        message: `🔴 ${room}호 ${name} — SpO₂ ${v.oxygenSaturation}% 저하`,
      })
    }

    // danger: systolic BP > 160
    const systolic = parseInt(v.bloodPressure.split('/')[0], 10)
    if (!isNaN(systolic) && systolic > 160) {
      chips.push({
        type: 'danger',
        message: `🚨 ${room}호 ${name} — 혈압 위험 (${v.bloodPressure})`,
      })
    }

    // warn: painScore > 6
    if (v.painScore !== undefined && v.painScore > 6) {
      chips.push({
        type: 'warn',
        message: `⚠️ ${room}호 ${name} — 통증 호소 (${v.painScore}/10)`,
      })
    }

    // warn: temperature > 38.0
    if (v.temperature > 38.0) {
      chips.push({
        type: 'warn',
        message: `⚠️ ${room}호 ${name} — 발열 (${v.temperature}°C)`,
      })
    }
  }

  return chips
}

const chipStyles: Record<'danger' | 'warn' | 'info', React.CSSProperties> = {
  danger: { background: '#FDECEA', color: '#C0392B' },
  warn:   { background: '#FEF3E2', color: '#D4860A' },
  info:   { background: '#EBF4F8', color: '#2C6E8A' },
}

const AlertBanner: React.FC<AlertBannerProps> = ({ patients }) => {
  const chips = buildAlerts(patients)

  if (chips.length === 0) return null

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #DDE3E8',
        padding: '8px 24px',
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        overflowX: 'auto',
        flexWrap: 'nowrap',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <span
        style={{
          fontSize: '11px',
          fontWeight: 700,
          color: '#6B8090',
          marginRight: '4px',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        알림
      </span>
      {chips.map((chip, i) => (
        <span
          key={i}
          style={{
            ...chipStyles[chip.type],
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 11px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            flexShrink: 0,
            cursor: 'pointer',
          }}
        >
          {chip.message}
        </span>
      ))}
    </div>
  )
}

export default AlertBanner
