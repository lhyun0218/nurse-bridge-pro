import React from 'react'
import { useAppDispatch } from '../../hooks/useAppDispatch'
import { useAppSelector } from '../../hooks/useAppSelector'
import { consumeItem, requestRestock } from '../../store/slices/inventorySlice'
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
  const dispatch = useAppDispatch()
  const currentUser = useAppSelector(s => s.auth.currentUser)
  const nurseId = currentUser?.id ?? 'unknown'

  const barPct = Math.min(100, Math.round((item.quantity / (item.reorderPoint * 2)) * 100))
  const barColor = borderColor[item.status]

  const handleConsume = (amount: number) => {
    if (item.quantity <= 0) return
    dispatch(consumeItem({ itemId: item.itemId, amount, nurseId }))
  }

  const handleRequest = () => {
    dispatch(requestRestock(item.itemId))
  }

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
        <div style={{ width: `${barPct}%`, height: '100%', background: barColor, borderRadius: '3px', transition: 'width .3s' }} />
      </div>

      {/* 버튼 */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {item.status === 'sufficient' && (
          <>
            {[1, 5, 10].map(amt => (
              <button
                key={amt}
                onClick={() => handleConsume(amt)}
                disabled={item.quantity <= 0}
                style={{
                  padding: '7px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 600,
                  border: '1.5px solid #DDE3E8', background: '#F0F4F7', color: '#1A2B38',
                  cursor: item.quantity <= 0 ? 'not-allowed' : 'pointer', opacity: item.quantity <= 0 ? 0.5 : 1,
                }}
              >
                소비 -{amt}
              </button>
            ))}
          </>
        )}
        {item.status === 'warning' && (
          <>
            <button
              onClick={() => handleConsume(1)}
              style={{ padding: '7px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, border: '1.5px solid #DDE3E8', background: '#F0F4F7', color: '#1A2B38', cursor: 'pointer' }}
            >
              소비 -1
            </button>
            <button
              onClick={handleRequest}
              style={{ padding: '7px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, border: 'none', background: '#D4860A', color: '#fff', cursor: 'pointer' }}
            >
              📋 청구 요청
            </button>
          </>
        )}
        {item.status === 'critical' && (
          <button
            onClick={handleRequest}
            style={{ padding: '7px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, border: 'none', background: '#C0392B', color: '#fff', cursor: 'pointer' }}
          >
            🚨 긴급 청구
          </button>
        )}
      </div>
    </div>
  )
}

export default InventoryItemCard
