import React from 'react'
import type { Medication } from '../../types'

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

const MedicationList: React.FC<MedicationListProps> = ({ medications }) => {
  if (medications.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
      {medications.map((med, i) => {
        const style = routeStyles[med.route] ?? routeStyles.Other
        return (
          <div
            key={i}
            style={{
              background: '#F0F4F7',
              borderRadius: '7px',
              padding: '9px 11px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#1A2B38' }}>{med.name}</div>
              <div style={{ fontSize: '11px', color: '#6B8090', marginTop: '1px' }}>
                {med.dosage} · {med.frequency}
              </div>
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
