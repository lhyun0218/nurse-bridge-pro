import React from 'react'
import type { LabResult } from '../../types'

interface LabResultsGridProps {
  labs: LabResult[]
}

const LabResultsGrid: React.FC<LabResultsGridProps> = ({ labs }) => {
  if (labs.length === 0) return null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
      {labs.map((lab, i) => (
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
          <div style={{ fontSize: '11px', color: '#6B8090' }}>{lab.name}</div>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: lab.isAbnormal ? '#C0392B' : lab.isBorderline ? '#D4860A' : '#1A2B38',
            }}
          >
            {lab.value}
          </div>
        </div>
      ))}
    </div>
  )
}

export default LabResultsGrid
