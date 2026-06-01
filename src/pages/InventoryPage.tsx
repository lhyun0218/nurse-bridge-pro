import React, { useEffect, useState } from 'react'
import { useAppDispatch } from '../hooks/useAppDispatch'
import { useAppSelector } from '../hooks/useAppSelector'
import { useToast } from '../hooks/useToast'
import { setInventory, requestRestock } from '../store/slices/inventorySlice'
import { Toast } from '../components/common'
import InventorySummary from '../components/inventory/InventorySummary'
import InventoryTabs from '../components/inventory/InventoryTabs'
import InventoryItemCard from '../components/inventory/InventoryItemCard'
import type { Category } from '../components/inventory/InventoryTabs'

const InventoryPage: React.FC = () => {
  const dispatch = useAppDispatch()
  const items = useAppSelector(s => s.inventory.items)
  const { toasts, removeToast, success } = useToast()
  const [activeCategory, setActiveCategory] = useState<Category>('Syringe')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/inventory')
        const data = await res.json()
        dispatch(setInventory(data))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [dispatch])

  const filtered = items.filter(i => i.category === activeCategory)
  const shortageItems = items.filter(i => i.status === 'warning' || i.status === 'critical')

  const handleBulkRequest = () => {
    shortageItems.forEach(i => dispatch(requestRestock(i.itemId)))
    success(`🚨 부족 물품 ${shortageItems.length}건 일괄 청구 완료`)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 58px)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #DDE3E8', borderTop: '3px solid #2C6E8A', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: '#6B8090', fontSize: '14px' }}>재고 데이터 로딩 중...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div>
      {/* 헤더 */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #DDE3E8', padding: '0 24px', height: '58px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: '#1A2B38' }}>📦 물품 재고 관리</div>
        {shortageItems.length > 0 && (
          <button
            onClick={handleBulkRequest}
            style={{ padding: '8px 16px', background: '#C0392B', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            🚨 부족 물품 일괄 청구 ({shortageItems.length}건)
          </button>
        )}
      </div>

      {/* 요약 + 탭 */}
      <div style={{ padding: '20px 24px 0' }}>
        <InventorySummary items={items} />
      </div>
      <InventoryTabs activeCategory={activeCategory} onChange={setActiveCategory} />

      {/* 목록 */}
      <div style={{ padding: '16px 24px 40px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6B8090' }}>해당 카테고리의 물품이 없습니다.</div>
        ) : (
          filtered.map(item => <InventoryItemCard key={item.itemId} item={item} />)
        )}
      </div>

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  )
}

export default InventoryPage
