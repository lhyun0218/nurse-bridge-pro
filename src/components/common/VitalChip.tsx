import React from 'react'

interface VitalChipProps {
  label: string
  value: string | number
  isAbnormal?: boolean
  isBorderline?: boolean
}

const VitalChip: React.FC<VitalChipProps> = ({
  label,
  value,
  isAbnormal = false,
  isBorderline = false,
}) => {
  const valueColor = isAbnormal
    ? 'var(--color-danger)'
    : isBorderline
    ? 'var(--color-warn)'
    : 'var(--color-text)'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        backgroundColor: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: '6px',
        padding: '3px 8px',
        fontSize: '11px',
      }}
    >
      <span style={{ color: 'var(--color-muted)' }}>{label}</span>
      <span style={{ color: valueColor, fontWeight: 600 }}>{value}</span>
    </span>
  )
}

export default VitalChip
