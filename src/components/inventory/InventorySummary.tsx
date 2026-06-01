import React from 'react'
import type { InventoryItem } from '../../types'

interface InventorySummaryProps {
  items: InventoryItem[]
}

const InventorySummary: React.FC<InventorySummaryProps> = ({ items }) => {
  const sufficient = items.filter(i => i.status === 'sufficient').length
  const warning    = items.filter(i => i.status === 'warning').length
  const critical   = items.filter(i => i.status === 'critical').length

  const cards = [
    { label: '충분', value: sufficient, color: '#2E7D5E', bg: '#E8F5EE', icon: '✅' },
    { label: '부족 주의', value: warning,    color: '#D4860A', bg: '#FEF3E2', icon: '⚠️' },
    { label: '긴급 부족', value: critical,   color: '#C0392B', bg: '#FDECEA', icon: '🔴' },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
      {cards.map(c => (
        <div
          key={c.label}
          style={{
            background: '#FFFFFF', borderRadius: '10px',
            boxShadow: '0 2px 12px rgba(44,110,138,.09)',
            padding: '16px 18px',
            display: 'flex', alignItems: 'center', gap: '12px',
          }}
        >
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
            {c.icon}
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#6B8090', marginBottom: '3px' }}>{c.label}</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: c.color }}>{c.value}개</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default InventorySummary
