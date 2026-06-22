import React, { useEffect, useState } from 'react'
import { useAppDispatch } from '../hooks/useAppDispatch'
import { useAppSelector } from '../hooks/useAppSelector'
import { useToast } from '../hooks/useToast'
import { setInventory } from '../store/slices/inventorySlice'
import { Toast } from '../components/common'
import InventorySummary from '../components/inventory/InventorySummary'
import InventoryTabs from '../components/inventory/InventoryTabs'
import InventoryItemCard from '../components/inventory/InventoryItemCard'
import type { Category } from '../components/inventory/InventoryTabs'

type PageTab = 'stock' | 'auto-history'

const InventoryPage: React.FC = () => {
  const dispatch = useAppDispatch()
  const items = useAppSelector(s => s.inventory.items)
  const autoConsumeHistory = useAppSelector(s => s.inventory.autoConsumeHistory)
  const { toasts, removeToast } = useToast()
  const [activeCategory, setActiveCategory] = useState<Category>('Syringe')
  const [pageTab, setPageTab] = useState<PageTab>('stock')

  // 초기 데이터 로드
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/inventory')
        const data = await res.json()
        dispatch(setInventory(data))
      } catch (e) {
        console.error(e)
      }
    }
    // Redux가 비어있으면 로드
    if (items.length === 0) {
      load()
    }
  }, [dispatch, items.length])

  const filtered = items.filter(i => i.category === activeCategory)

  return (
    <div>
      {/* 헤더 */}
      <div style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        padding: '0 24px',
        height: '58px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'background-color 0.3s ease',
      }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)' }}>📦 물품 재고 관리</div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* 자동 소비 안내 뱃지 */}
          {autoConsumeHistory.length > 0 && (
            <span style={{
              padding: '4px 12px', borderRadius: '12px',
              background: '#EBF4F8', color: '#2C6E8A',
              fontSize: '12px', fontWeight: 600,
            }}>
              🤖 자동 소비 {autoConsumeHistory.length}건
            </span>
          )}
        </div>
      </div>

      {/* 페이지 탭 */}
      <div style={{
        display: 'flex',
        gap: '0',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        padding: '0 24px',
      }}>
        {([
          { key: 'stock',        label: '📊 재고 현황' },
          { key: 'auto-history', label: `🤖 자동 소비 이력 (${autoConsumeHistory.length})` },
        ] as { key: PageTab; label: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setPageTab(t.key)}
            style={{
              padding: '12px 16px',
              border: 'none',
              borderBottom: pageTab === t.key ? '2px solid #2C6E8A' : '2px solid transparent',
              background: 'transparent',
              color: pageTab === t.key ? '#2C6E8A' : 'var(--color-muted)',
              fontWeight: pageTab === t.key ? 700 : 500,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'color 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {pageTab === 'stock' ? (
        <>
          {/* 요약 + 탭 */}
          <div style={{ padding: '20px 24px 0' }}>
            <InventorySummary items={items} />
          </div>
          <InventoryTabs activeCategory={activeCategory} onChange={setActiveCategory} />

          {/* 목록 */}
          <div style={{ padding: '16px 24px 40px' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6B8090' }}>
                해당 카테고리의 물품이 없습니다.
              </div>
            ) : (
              filtered.map(item => <InventoryItemCard key={item.itemId} item={item} />)
            )}
          </div>
        </>
      ) : (
        /* 자동 소비 이력 탭 */
        <div style={{ padding: '20px 24px 60px' }}>
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: '10px',
            boxShadow: '0 2px 12px rgba(44,110,138,.09)',
            padding: '20px',
            marginBottom: '16px',
          }}>
            <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: '0 0 16px' }}>
              투약 업무 완료(Medication 카테고리) 시 자동으로 차감된 재고 이력입니다.
            </p>

            {autoConsumeHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-muted)', fontSize: '14px' }}>
                아직 자동 소비 이력이 없습니다.<br />
                <span style={{ fontSize: '12px' }}>투약 업무를 완료하면 이 목록에 기록됩니다.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {autoConsumeHistory.map(record => (
                  <div key={record.id} style={{
                    padding: '12px 14px',
                    borderRadius: '9px',
                    border: '1px solid var(--color-border)',
                    borderLeft: '4px solid #4A9BB5',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}>
                    <div style={{ flexShrink: 0, fontSize: '11px', color: 'var(--color-muted)' }}>
                      {new Date(record.timestamp).toLocaleString('ko-KR', {
                        month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </div>
                    <span style={{
                      padding: '2px 8px', borderRadius: '8px',
                      background: '#EBF4F8', color: '#2C6E8A',
                      fontSize: '11px', fontWeight: 700,
                    }}>
                      🤖 자동
                    </span>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>
                        {record.patientName}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--color-muted)', marginLeft: '6px' }}>
                        {record.medicationName} ({record.route})
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
                      차감: <strong style={{ color: 'var(--color-text)' }}>{record.itemName} -{record.amount}개</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  )
}

export default InventoryPage
