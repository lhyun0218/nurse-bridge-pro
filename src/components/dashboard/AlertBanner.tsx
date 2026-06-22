import React from 'react'
import { useAppSelector } from '../../hooks/useAppSelector'
import type { Patient } from '../../types'

interface AlertChip {
  id: string
  type: 'danger' | 'warn' | 'info'
  message: string
}

interface AlertBannerProps {
  patients: Patient[]
}

function buildStaticAlerts(patients: Patient[]): AlertChip[] {
  const chips: AlertChip[] = []

  for (const p of patients) {
    const v = p.vitalSigns
    const room = p.roomNumber
    const name = p.name

    if (v.bloodGlucose !== undefined && v.bloodGlucose > 180) {
      chips.push({
        id: `static-${p.id}-glucose`,
        type: 'danger',
        message: `🚨 ${room}호 ${name} — 혈당 비정상 (${v.bloodGlucose})`,
      })
    }

    if (v.oxygenSaturation < 94) {
      chips.push({
        id: `static-${p.id}-spo2`,
        type: 'danger',
        message: `🔴 ${room}호 ${name} — SpO₂ ${v.oxygenSaturation}% 저하`,
      })
    }

    const systolic = parseInt(v.bloodPressure.split('/')[0], 10)
    if (!isNaN(systolic) && systolic > 160) {
      chips.push({
        id: `static-${p.id}-bp`,
        type: 'danger',
        message: `🚨 ${room}호 ${name} — 혈압 위험 (${v.bloodPressure})`,
      })
    }

    if (v.painScore !== undefined && v.painScore > 6) {
      chips.push({
        id: `static-${p.id}-pain`,
        type: 'warn',
        message: `⚠️ ${room}호 ${name} — 통증 호소 (${v.painScore}/10)`,
      })
    }

    if (v.temperature > 38.0) {
      chips.push({
        id: `static-${p.id}-temp`,
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
  // 실시간 활력징후 알림 (Redux)
  const vitalAlerts      = useAppSelector(s => s.alerts.vitalAlerts)
  // 투약 타이머 알림 (Redux)
  const medicationAlerts = useAppSelector(s => s.alerts.medicationAlerts)

  // 정적 알림 (초기 환자 데이터 기반) — 실시간 알림이 없을 때 fallback
  const staticChips = buildStaticAlerts(patients)

  // 실시간 알림을 AlertChip 형태로 변환
  const realtimeChips: AlertChip[] = vitalAlerts.map(a => ({
    id: a.id,
    type: a.type,
    message: a.message,
  }))

  // 투약 타이머 알림을 AlertChip 형태로 변환
  const medChips: AlertChip[] = medicationAlerts.map(a => ({
    id: a.id,
    type: a.type,
    message: a.message,
  }))

  // 우선순위: 실시간 활력징후 알림 + 투약 알림 → 없으면 정적 알림
  const hasRealtime = realtimeChips.length > 0 || medChips.length > 0
  const chips: AlertChip[] = hasRealtime
    ? [...realtimeChips, ...medChips]
    : [...staticChips, ...medChips]

  if (chips.length === 0) return null

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        padding: '8px 24px',
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        overflowX: 'auto',
        flexWrap: 'nowrap',
        WebkitOverflowScrolling: 'touch',
        transition: 'background-color 0.3s ease, border-color 0.3s ease',
      }}
    >
      <span
        style={{
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--color-muted)',
          marginRight: '4px',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        알림
      </span>
      {chips.map((chip) => (
        <span
          key={chip.id}
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
