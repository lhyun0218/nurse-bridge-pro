import React from 'react'
import type { InventoryItem } from '../../types'

interface InventoryItemCardProps {
  item: InventoryItem
}

const borderColor = { sufficient: '#2E7D5E', warning: '#D4860A', critical: '#C0392B' }
const statusLabel = { sufficient: '✓ 충분', warning: '⚠️ 부족 주의', critical: '🔴 긴급 부족' }
const statusStyle: Record<string, React.CSSProperties> = {
  sufficient: { background: '#E8F5EE', color: '#2E7D5E' },
  warning:    { background: '#FEF3E2', color: '#D4860A' },
  critical:   { background: '#FDECEA', color: '#C0392B' },
}

const InventoryItemCard: React.FC<InventoryItemCardProps> = ({ item }) => {
  const barPct = Math.min(100, Math.round((item.quantity / (item.reorderPoint * 2)) * 100))

  return (
    <div
      style={{
        background: '#FFFFFF', borderRadius: '10px',
        boxShadow: '0 2px 12px rgba(44,110,138,.09)',
        padding: '16px 18px',
        borderLeft: `4px solid ${borderColor[item.status]}`,
        marginBottom: '10px',
      }}
    >
      {/* 상단 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div style={{ fontSize: '15px', fontWeight: 600, color: '#1A2B38' }}>{item.itemName}</div>
        <span style={{ ...statusStyle[item.status], padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>
          {statusLabel[item.status]}
        </span>
      </div>

      {/* 재고 정보 */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '10px', flexWrap: 'wrap' }}>
        <div style={{ fontSize: '12px', color: '#6B8090' }}>
          현재 재고 <span style={{ fontWeight: 600, color: item.status === 'sufficient' ? '#1A2B38' : borderColor[item.status] }}>{item.quantity}{item.unit}</span>
        </div>
        <div style={{ fontSize: '12px', color: '#6B8090' }}>
          경고선 <span style={{ fontWeight: 600, color: '#1A2B38' }}>{item.reorderPoint}{item.unit}</span>
        </div>
      </div>

      {/* 재고 바 */}
      <div style={{ height: '6px', background: '#DDE3E8', borderRadius: '3px', overflow: 'hidden', marginBottom: '12px' }}>
        <div style={{ width: `${barPct}%`, height: '100%', background: borderColor[item.status], borderRadius: '3px', transition: 'width .3s' }} />
      </div>

      {/* 버튼 */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {item.status === 'sufficient' && (
          <div style={{ fontSize: '12px', color: '#2E7D5E', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#2E7D5E', fontSize: '14px' }}>✓</span> 자동 관리 중
          </div>
        )}
        {item.status === 'warning' && (
          <div style={{ fontSize: '12px', color: '#D4860A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '14px' }}>⚠️</span> 자동 재고 보충 예정
          </div>
        )}
        {item.status === 'critical' && (
          <div style={{ fontSize: '12px', color: '#C0392B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '14px' }}>🔴</span> 자동 긴급 보충 진행 중
          </div>
        )}
      </div>
    </div>
  )
}

export default InventoryItemCard
