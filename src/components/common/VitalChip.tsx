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
    ? '#C0392B'
    : isBorderline
    ? '#D4860A'
    : '#1A2B38'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        backgroundColor: '#F0F4F7',
        borderRadius: '6px',
        padding: '3px 8px',
        fontSize: '11px',
      }}
    >
      <span style={{ color: '#6B8090' }}>{label}</span>
      <span style={{ color: valueColor, fontWeight: 600 }}>{value}</span>
    </span>
  )
}

export default VitalChip
