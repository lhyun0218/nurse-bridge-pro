import { useLocation, useNavigate } from 'react-router-dom'
import {
  LuLayoutDashboard, LuClipboardList,
  LuHeartPulse, LuMenu,
} from 'react-icons/lu'

interface BottomNavProps {
  onMenuToggle: () => void
}

interface NavTab {
  icon: React.ReactNode
  label: string
  to?: string
  action?: 'menu'
}

export default function BottomNav({ onMenuToggle }: BottomNavProps) {
  const location = useLocation()
  const navigate = useNavigate()

  const iconStyle = { width: '22px', height: '22px' }

  const tabs: NavTab[] = [
    { icon: <LuLayoutDashboard style={iconStyle} />, label: '홈',   to: '/dashboard' },
    { icon: <LuClipboardList   style={iconStyle} />, label: 'Todo', to: '/todos' },
    { icon: <LuHeartPulse      style={iconStyle} />, label: '관제', to: '/head-nurse' },
    { icon: <LuMenu            style={iconStyle} />, label: '메뉴', action: 'menu' },
  ]

  const isActive = (tab: NavTab) => {
    if (!tab.to) return false
    return location.pathname === tab.to || location.pathname.startsWith(tab.to + '/')
  }

  const handleTabClick = (tab: NavTab) => {
    if (tab.action === 'menu') onMenuToggle()
    else if (tab.to) navigate(tab.to)
  }

  return (
    <nav
      style={{
        backgroundColor: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        transition: 'background-color 0.3s ease, border-color 0.3s ease',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      className="mobile-only fixed bottom-0 left-0 right-0 z-[400]"
    >
      <div style={{ display: 'flex', justifyContent: 'space-around' }}>
        {tabs.map(tab => (
          <button
            key={tab.label}
            onClick={() => handleTabClick(tab)}
            style={{
              color: isActive(tab) ? 'var(--color-primary)' : 'var(--color-muted)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
              padding: '5px 12px', minWidth: '44px', minHeight: '44px',
              fontSize: '10px', fontWeight: 500,
              border: 'none', backgroundColor: 'transparent', cursor: 'pointer',
              transition: 'color 0.15s',
            }}
            aria-label={tab.label}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  )
}
