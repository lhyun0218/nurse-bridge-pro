import { NavLink, useNavigate } from 'react-router-dom'
import { useAppSelector } from '../../hooks/useAppSelector'
import { useAppDispatch } from '../../hooks/useAppDispatch'
import { logout } from '../../store/slices/authSlice'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface NavItem {
  icon: string
  label: string
  to: string
  badge?: number | null
  badgeVariant?: 'danger' | 'warn' | 'ok'
}

interface NavSection {
  label: string
  items: NavItem[]
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const currentUser = useAppSelector(s => s.auth.currentUser)
  const allPatients = useAppSelector(s => s.patients.allPatients)
  const allTasks    = useAppSelector(s => s.tasks.allTasks)

  // 배지 계산 — Redux에서
  const myPatientCount = currentUser
    ? allPatients.filter(p => p.assignedNurseId === currentUser.id).length
    : 0

  const pendingTaskCount = currentUser
    ? allTasks.filter(t => {
        const myPatientIds = allPatients
          .filter(p => p.assignedNurseId === currentUser.id)
          .map(p => p.id)
        return myPatientIds.includes(t.patientId) && t.status === 'Pending'
      }).length
    : 0

  const navSections: NavSection[] = [
    {
      label: '메인',
      items: [
        { icon: '🏠', label: '대시보드', to: '/dashboard' },
        {
          icon: '🧑‍⚕️',
          label: '내 담당 환자',
          to: '/dashboard',
          badge: myPatientCount > 0 ? myPatientCount : null,
          badgeVariant: 'ok',
        },
      ],
    },
    {
      label: '업무',
      items: [
        {
          icon: '📋',
          label: '오늘의 Todo',
          to: '/dashboard',
          badge: pendingTaskCount > 0 ? pendingTaskCount : null,
          badgeVariant: 'warn',
        },
        { icon: '📦', label: '물품 재고', to: '/inventory' },
        { icon: '💊', label: '투약 스케줄', to: '/dashboard' },
        { icon: '📝', label: '인수인계 기록', to: '/dashboard' },
      ],
    },
    {
      label: '병동',
      items: [
        { icon: '📊', label: '병동 관제', to: '/head-nurse' },
        { icon: '👥', label: '동료 현황', to: '/dashboard' },
        { icon: '🗓️', label: '근무 일정', to: '/schedule' },
      ],
    },
    {
      label: '기타',
      items: [
        { icon: '🔔', label: '알림 센터', to: '/dashboard' },
        { icon: '⚙️', label: '설정', to: '/dashboard' },
      ],
    },
  ]

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login', { replace: true })
    onClose()
  }

  const avatarLetter = currentUser?.name?.charAt(0) ?? '?'
  const shiftLabel =
    currentUser?.shiftType === 'Day'
      ? 'Day · 06:00~15:00'
      : currentUser?.shiftType === 'Evening'
      ? 'Evening · 14:00~23:00'
      : 'Night · 22:00~07:00'

  return (
    <>
      {/* 모바일 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/35 z-[299] md:hidden"
          onClick={onClose}
        />
      )}

      {/* 사이드바 본체 */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 300,
          width: '220px',
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #DDE3E8',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 250ms ease',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
        className="sidebar-aside"
      >
        {/* 로고 */}
        <div className="flex items-center gap-[10px] px-5 py-[18px] border-b border-[#DDE3E8]">
          <div className="w-[34px] h-[34px] bg-[#2C6E8A] rounded-[9px] flex items-center justify-center flex-shrink-0">
            <svg className="w-[18px] h-[18px] fill-white" viewBox="0 0 24 24">
              <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm1 13h-2v-2h2v2zm0-4h-2V7h2v4z" />
            </svg>
          </div>
          <div>
            <div className="text-[14px] font-bold text-[#1A2B38] leading-tight">Nurse-Bridge</div>
            <div className="text-[10px] text-[#6B8090]">PRO v1.0</div>
          </div>
        </div>

        {/* 사용자 정보 */}
        <div className="flex items-center gap-[10px] px-5 py-[14px] border-b border-[#DDE3E8] bg-[#F7FAFB]">
          <div className="w-9 h-9 rounded-full bg-[#2C6E8A] flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0">
            {avatarLetter}
          </div>
          <div>
            <div className="text-[13px] font-semibold text-[#1A2B38]">
              {currentUser?.name ?? '—'} 간호사
            </div>
            <div className="text-[11px] text-[#6B8090] mt-[1px] flex items-center gap-1">
              <span className="inline-block w-[7px] h-[7px] rounded-full bg-[#2E7D5E]" />
              {shiftLabel}
            </div>
          </div>
        </div>

        {/* 네비게이션 */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {navSections.map(section => (
            <div key={section.label}>
              <div className="text-[10px] font-bold text-[#6B8090] uppercase tracking-[0.8px] px-5 pt-[10px] pb-1">
                {section.label}
              </div>
              {section.items.map(item => (
                <NavLink
                  key={item.label}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-[10px] px-5 py-[10px]',
                      'text-[13px] font-medium no-underline',
                      'transition-all duration-150 relative',
                      isActive
                        ? 'bg-[#EBF4F8] text-[#2C6E8A] font-semibold border-r-[3px] border-[#2C6E8A]'
                        : 'text-[#6B8090] hover:bg-[#F0F4F7] hover:text-[#1A2B38]',
                    ].join(' ')
                  }
                >
                  <span className="text-[16px] w-5 text-center">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge != null && (
                    <span
                      className={[
                        'ml-auto text-white text-[10px] font-bold px-[6px] py-[1px] rounded-[10px]',
                        item.badgeVariant === 'warn'
                          ? 'bg-[#D4860A]'
                          : item.badgeVariant === 'ok'
                          ? 'bg-[#2E7D5E]'
                          : 'bg-[#C0392B]',
                      ].join(' ')}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* 로그아웃 */}
        <div className="px-5 py-[14px] border-t border-[#DDE3E8]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-[13px] text-[#6B8090] px-[10px] py-2 rounded-[8px] w-full transition-all duration-150 hover:bg-[#F0F4F7] hover:text-[#C0392B] cursor-pointer border-none bg-transparent"
          >
            <span>🚪</span>
            <span>로그아웃</span>
          </button>
        </div>
      </aside>
    </>
  )
}
