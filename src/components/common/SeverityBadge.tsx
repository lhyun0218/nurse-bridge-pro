import React from 'react'

interface SeverityBadgeProps {
  severity: 'High' | 'Medium' | 'Low'
  size?: 'sm' | 'md'
}

const config = {
  High:   { bg: '#FDECEA', color: '#C0392B', label: '🔴 High' },
  Medium: { bg: '#FEF3E2', color: '#D4860A', label: '🟡 Medium' },
  Low:    { bg: '#E8F5EE', color: '#2E7D5E', label: '🟢 Low' },
}

const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'sm' }) => {
  const { bg, color, label } = config[severity]

  const style: React.CSSProperties = {
    backgroundColor: bg,
    color,
    padding: size === 'md' ? '4px 12px' : '3px 9px',
    borderRadius: '12px',
    fontSize: size === 'md' ? '12px' : '11px',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
  }

  return <span style={style}>{label}</span>
}

export default SeverityBadge
