import React from 'react'
import type { InventoryItem } from '../../types'

type Category = InventoryItem['category'] | 'All'

interface InventoryTabsProps {
  activeCategory: Category
  onChange: (cat: Category) => void
}

const TABS: { label: string; value: Category }[] = [
  { label: '💉 주사기',    value: 'Syringe' },
  { label: '🩹 거즈/드레싱', value: 'Gauze' },
  { label: '💧 수액',      value: 'IV' },
  { label: '🛏️ 린넨',     value: 'Linen' },
  { label: '🧤 장갑/마스크', value: 'Glove' },
  { label: '기타',         value: 'Other' },
]

const InventoryTabs: React.FC<InventoryTabsProps> = ({ activeCategory, onChange }) => (
  <div
    style={{
      display: 'flex', gap: '0',
      background: '#FFFFFF', borderBottom: '1px solid #DDE3E8',
      overflowX: 'auto', marginBottom: '0',
    }}
  >
    {TABS.map(tab => {
      const isActive = activeCategory === tab.value
      return (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          style={{
            padding: '13px 18px', fontSize: '13px', fontWeight: isActive ? 600 : 500,
            color: isActive ? '#2C6E8A' : '#6B8090',
            background: 'none', border: 'none',
            borderBottom: isActive ? '2px solid #2C6E8A' : '2px solid transparent',
            cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .15s',
          }}
        >
          {tab.label}
        </button>
      )
    })}
  </div>
)

export default InventoryTabs
export type { Category }
