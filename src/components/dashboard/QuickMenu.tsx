import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LuPill, LuUsers, LuClipboardCheck, LuDoorOpen,
} from 'react-icons/lu'

interface QuickMenuProps {
  allTasksDone: boolean
  onCheckout?: () => void
}

interface MenuItem {
  icon: React.ReactNode
  label: string
  sub: string
  iconBg: string
  iconColor: string
  key?: string
  path?: string
  disabled?: boolean
}

const QuickMenu: React.FC<QuickMenuProps> = ({ allTasksDone, onCheckout }) => {
  const navigate = useNavigate()

  const iconStyle = { width: '20px', height: '20px' }

  const items: MenuItem[] = [
    {
      icon: <LuPill style={iconStyle} />,
      label: '투약 스케줄', sub: '투약 일정 확인',
      iconBg: '#EBF4F8', iconColor: '#2C6E8A',
      path: '/medication',
    },
    {
      icon: <LuUsers style={iconStyle} />,
      label: '동료 현황', sub: '근무 중인 동료',
      iconBg: '#E8F5EE', iconColor: '#2E7D5E',
      path: '/colleagues',
    },
    {
      icon: <LuClipboardCheck style={iconStyle} />,
      label: '인수인계', sub: '인수인계 기록',
      iconBg: '#F0EBF8', iconColor: '#6B3FA0',
      path: '/handover',
    },
    {
      icon: <LuDoorOpen style={iconStyle} />,
      label: '퇴근 신청',
      sub: allTasksDone ? '퇴근 신청 가능' : '업무 미완료 시 확인 후 신청',
      iconBg: allTasksDone ? '#E8F5EE' : '#FFF6F6',
      iconColor: allTasksDone ? '#2E7D5E' : '#A63A3A',
      key: 'checkout',
    },
  ]

  const cardBase: React.CSSProperties = {
    background: 'linear-gradient(180deg,#ffffff,#f8fbfc)',
    borderRadius: '12px',
    padding: '14px 16px',
    display: 'flex', alignItems: 'center', gap: '12px',
    cursor: 'pointer', border: '1px solid rgba(220,230,240,0.7)',
    transition: 'transform .15s, box-shadow .18s, background-color 0.25s ease',
    textDecoration: 'none', color: 'inherit',
  }

  const handleClick = (item: MenuItem) => {
    const isDisabled = !!item.disabled
    if (isDisabled) return
    if (item.key === 'checkout') {
      if (!allTasksDone) {
        const ok = window.confirm('아직 완료되지 않은 업무가 있습니다. 그래도 퇴근 신청을 진행하시겠습니까?')
        if (!ok) return
      }
      onCheckout?.()
      return
    }
    if (item.path) navigate(item.path)
  }

  return (
    <div
      style={{ display: 'grid', gap: '10px', marginBottom: '22px' }}
      className="quick-bar"
    >
      {items.map((item, i) => (
          <div
            key={i}
            style={{ ...cardBase, opacity: item.disabled ? 0.5 : 1, pointerEvents: item.disabled ? 'none' : 'auto' }}
          onClick={() => handleClick(item)}
          onMouseEnter={e => {
            if (!item.disabled) {
              const el = e.currentTarget as HTMLDivElement
              el.style.transform = 'translateY(-4px)'
              el.style.boxShadow = '0 10px 30px rgba(20,40,60,.08)'
              el.style.borderColor = 'rgba(200,210,220,0.9)'
            }
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLDivElement
              el.style.transform = 'translateY(0)'
              el.style.boxShadow = '0 2px 12px rgba(44,110,138,.06)'
              el.style.borderColor = 'rgba(0,0,0,0)'
          }}
        >
          <div style={{
            width: '38px', height: '38px', borderRadius: '10px',
            background: item.iconBg, color: item.iconColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {item.icon}
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)' }}>
              {item.label}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--color-muted)', marginTop: '2px' }}>
              {item.sub}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default QuickMenu
