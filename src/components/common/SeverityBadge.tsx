import React from 'react'
import { LuCircleAlert, LuTriangleAlert, LuCircleCheck } from 'react-icons/lu'

interface SeverityBadgeProps {
  severity: 'High' | 'Medium' | 'Low'
  size?: 'sm' | 'md'
}

const config = {
  High:   { bg: 'var(--color-danger-bg)', color: 'var(--color-danger)', label: 'High',   Icon: LuCircleAlert },
  Medium: { bg: 'var(--color-warn-bg)',   color: 'var(--color-warn)',   label: 'Medium', Icon: LuTriangleAlert },
  Low:    { bg: 'var(--color-ok-bg)',     color: 'var(--color-ok)',     label: 'Low',    Icon: LuCircleCheck },
}

const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'sm' }) => {
  const { bg, color, label, Icon } = config[severity]
  const iconSize = size === 'md' ? 13 : 12
  const fontSize = size === 'md' ? '12px' : '11px'
  const padding  = size === 'md' ? '4px 10px' : '3px 8px'

  return (
    <span style={{
      backgroundColor: bg, color,
      padding, borderRadius: '12px',
      fontSize, fontWeight: 600,
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      whiteSpace: 'nowrap',
    }}>
      <Icon style={{ width: iconSize, height: iconSize, flexShrink: 0 }} />
      {label}
    </span>
  )
}

export default SeverityBadge
