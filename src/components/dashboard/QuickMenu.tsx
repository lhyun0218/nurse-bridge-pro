import React from 'react'
import { useNavigate } from 'react-router-dom'

interface QuickMenuProps {
  allTasksDone: boolean
}

interface MenuItem {
  icon: string
  label: string
  sub: string
  iconBg: string
  path?: string
  disabled?: boolean
}

const QuickMenu: React.FC<QuickMenuProps> = ({ allTasksDone }) => {
  const navigate = useNavigate()

  const items: MenuItem[] = [
    {
      icon: '📦',
      label: '물품 재고',
      sub: '재고 현황 확인',
      iconBg: '#FEF3E2',
      path: '/inventory',
    },
    {
      icon: '💊',
      label: '투약 스케줄',
      sub: '투약 일정 확인',
      iconBg: '#EBF4F8',
    },
    {
      icon: '👥',
      label: '동료 현황',
      sub: '근무 중인 동료',
      iconBg: '#E8F5EE',
    },
    {
      icon: '📝',
      label: '인수인계',
      sub: '인수인계 기록',
      iconBg: '#F0EBF8',
    },
    {
      icon: '⏱️',
      label: '퇴근 신청',
      sub: allTasksDone ? '퇴근 신청 가능' : '업무 완료 후 활성',
      iconBg: '#F0F4F7',
      disabled: !allTasksDone,
    },
  ]

  const cardBase: React.CSSProperties = {
    background: '#FFFFFF',
    borderRadius: '10px',
    boxShadow: '0 2px 12px rgba(44,110,138,.09)',
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
    border: '1px solid transparent',
    transition: 'transform .15s, box-shadow .15s',
    textDecoration: 'none',
    color: 'inherit',
  }

  const handleClick = (item: MenuItem) => {
    if (item.disabled) return
    if (item.path) navigate(item.path)
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '10px',
        marginBottom: '22px',
      }}
      className="quick-bar"
    >
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            ...cardBase,
            opacity: item.disabled ? 0.45 : 1,
            pointerEvents: item.disabled ? 'none' : 'auto',
          }}
          onClick={() => handleClick(item)}
          onMouseEnter={e => {
            if (!item.disabled) {
              const el = e.currentTarget as HTMLDivElement
              el.style.transform = 'translateY(-2px)'
              el.style.boxShadow = '0 6px 20px rgba(44,110,138,.13)'
              el.style.borderColor = '#DDE3E8'
            }
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLDivElement
            el.style.transform = 'translateY(0)'
            el.style.boxShadow = '0 2px 12px rgba(44,110,138,.09)'
            el.style.borderColor = 'transparent'
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: item.iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '17px',
              flexShrink: 0,
            }}
          >
            {item.icon}
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#1A2B38' }}>
              {item.label}
            </div>
            <div style={{ fontSize: '10px', color: '#6B8090', marginTop: '2px' }}>
              {item.sub}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default QuickMenu
