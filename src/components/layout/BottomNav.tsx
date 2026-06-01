import { useLocation, useNavigate } from 'react-router-dom'

interface BottomNavProps {
  onMenuToggle: () => void
}

interface NavTab {
  icon: React.ReactNode
  label: string
  to?: string
  action?: 'menu'
}

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-[22px] h-[22px]">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
  </svg>
)

const TodoIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-[22px] h-[22px]">
    <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" />
  </svg>
)

const InventoryIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-[22px] h-[22px]">
    <path d="M20 6h-2.18c.07-.44.18-.88.18-1.36C18 2.53 15.47 0 12.36 0c-1.73 0-3.24.86-4.19 2.18L12 6H4L2 8l2 2h1l1 9h12l1-9h1l2-2-2-2z" />
  </svg>
)

const HeadNurseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-[22px] h-[22px]">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" />
  </svg>
)

const MenuIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-[22px] h-[22px]">
    <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
  </svg>
)

export default function BottomNav({ onMenuToggle }: BottomNavProps) {
  const location = useLocation()
  const navigate = useNavigate()

  const tabs: NavTab[] = [
    { icon: <HomeIcon />, label: '홈', to: '/dashboard' },
    { icon: <TodoIcon />, label: 'Todo', to: '/dashboard' },
    { icon: <InventoryIcon />, label: '재고', to: '/inventory' },
    { icon: <HeadNurseIcon />, label: '관제', to: '/head-nurse' },
    { icon: <MenuIcon />, label: '메뉴', action: 'menu' },
  ]

  const isActive = (tab: NavTab) => {
    if (!tab.to) return false
    return location.pathname === tab.to
  }

  const handleTabClick = (tab: NavTab) => {
    if (tab.action === 'menu') {
      onMenuToggle()
    } else if (tab.to) {
      navigate(tab.to)
    }
  }

  return (
    /* 모바일(<768px)에서만 표시 */
    <nav
      className="mobile-only fixed bottom-0 left-0 right-0 bg-[#FFFFFF] border-t border-[#DDE3E8] z-[400]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex justify-around">
        {tabs.map(tab => (
          <button
            key={tab.label}
            onClick={() => handleTabClick(tab)}
            className={[
              'flex flex-col items-center gap-[2px]',
              'px-3 py-[5px] min-w-[44px] min-h-[44px]',
              'text-[10px] font-medium',
              'border-none bg-transparent cursor-pointer',
              'transition-colors duration-150',
              isActive(tab) ? 'text-[#2C6E8A]' : 'text-[#6B8090]',
            ].join(' ')}
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
