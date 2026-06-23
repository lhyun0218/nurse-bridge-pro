import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LuLayoutDashboard, LuUsers, LuClipboardList,
  LuCalendarDays, LuHeartPulse,
  LuUserPlus, LuLogOut, LuWand,
  LuPill, LuUserCheck, LuArrowLeftRight,
} from 'react-icons/lu'
import { useAppSelector } from '../../hooks/useAppSelector'
import { useAppDispatch } from '../../hooks/useAppDispatch'
import { logout } from '../../store/slices/authSlice'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface NavItem {
  icon: React.ReactNode
  label: string
  to: string
  exact?: boolean
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
  const userRole    = useAppSelector(s => s.auth.userRole)
  const allPatients = useAppSelector(s => s.patients.allPatients)
  const allTasks    = useAppSelector(s => s.tasks.allTasks)
  const attendanceRecords = useAppSelector(s => s.attendance.records)
  const todayKey = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })()
  const assignsToday = useAppSelector(s => s.assignments.byDate[todayKey] ?? {})

  const isHeadNurse = userRole === 'HeadNurse'

  const pendingTaskCount = currentUser
    ? allTasks.filter(t => {
        const myIds = allPatients
          .filter(p => Object.values(assignsToday[p.id] ?? {}).includes(currentUser.id))
          .map(p => p.id)
        return myIds.includes(t.patientId) && t.status === 'Pending'
      }).length
    : 0

  const myPatientCount = allPatients.filter(p => Object.values(assignsToday[p.id] ?? {}).includes(currentUser?.id ?? '')).length

  // 수간호사: 오늘 퇴근 신청 대기 건수
  const pendingCheckoutCount = isHeadNurse
    ? attendanceRecords.filter(r => r.date === todayKey && r.checkoutRequested && !r.checkoutApproved).length
    : 0

  // 일반 간호사: 내 퇴근 신청 상태
  const myTodayRec = !isHeadNurse
    ? attendanceRecords.find(r => r.nurseId === currentUser?.id && r.date === todayKey)
    : null
  const myAttBadge = myTodayRec?.checkoutApproved ? null
    : myTodayRec?.checkoutRequested ? 1 : null

  const iconStyle = { width: '18px', height: '18px', flexShrink: 0 }

  // ── 일반 간호사 메뉴
  const nurseNav: NavSection[] = [
    {
      label: '메인',
      items: [
        { icon: <LuLayoutDashboard style={iconStyle} />, label: '대시보드', to: '/dashboard', exact: true },
      ],
    },
    {
      label: '업무',
      items: [
        {
          icon: <LuUsers style={iconStyle} />,
          label: '내 담당 환자',
          to: '/patients', exact: true,
          badge: myPatientCount || null, badgeVariant: 'ok',
        },
        {
          icon: <LuClipboardList style={iconStyle} />,
          label: '오늘의 Todo',
          to: '/todos', exact: true,
          badge: pendingTaskCount > 0 ? pendingTaskCount : null, badgeVariant: 'warn',
        },
        { icon: <LuPill         style={iconStyle} />, label: '투약 스케줄', to: '/medication', exact: true },
        { icon: <LuCalendarDays style={iconStyle} />, label: '근무 일정',   to: '/schedule',   exact: true },
        { icon: <LuUserCheck style={iconStyle} />,   label: '근태',       to: '/attendance', exact: true, badge: myAttBadge, badgeVariant: 'warn' as const },
      ],
    },
    {
      label: '커뮤니케이션',
      items: [
        { icon: <LuUserCheck       style={iconStyle} />, label: '동료 현황', to: '/colleagues', exact: true },
        { icon: <LuArrowLeftRight  style={iconStyle} />, label: '인수인계',  to: '/handover',   exact: true },
      ],
    },
  ]

  // ── 수간호사 메뉴
  const headNurseNav: NavSection[] = [
    {
      label: '메인',
      items: [
        { icon: <LuHeartPulse style={iconStyle} />, label: '병동 관제', to: '/head-nurse', exact: true },
      ],
    },
    {
      label: '병동 관리',
      items: [
        { icon: <LuUserPlus style={iconStyle} />,  label: '환자 등록', to: '/head-nurse/patients/new', exact: true },
      ],
    },
    {
      label: '일정',
      items: [
        { icon: <LuCalendarDays style={iconStyle} />, label: '근무 일정',     to: '/schedule',                     exact: true },
        { icon: <LuWand style={iconStyle} />,         label: '근무표 자동생성', to: '/head-nurse/schedule/generate', exact: true },
        { icon: <LuUserCheck style={iconStyle} />,   label: '근태 관리',     to: '/head-nurse/attendance', exact: true, badge: pendingCheckoutCount || null, badgeVariant: 'warn' as const },
      ],
    },
  ]

  const navSections = isHeadNurse ? headNurseNav : nurseNav

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login', { replace: true })
    onClose()
  }

  const avatarLetter = currentUser?.name?.charAt(0) ?? '?'
  const roleLabel   = isHeadNurse ? '수간호사' : '간호사'
  const avatarBg    = isHeadNurse ? '#D4860A' : '#2C6E8A'
  const roleBadgeBg = isHeadNurse ? '#D4860A' : '#2E7D5E'

  const shiftLabel =
    currentUser?.shiftType === 'Day'     ? `Day · 07:30~16:00`
    : currentUser?.shiftType === 'Evening' ? `Evening · 15:30~00:00`
    : `Night · 23:30~08:00`

  const linkBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '9px 20px', fontSize: '13px', fontWeight: 500,
    textDecoration: 'none',
    transition: 'background-color 0.15s, color 0.15s',
    boxSizing: 'border-box', width: '100%',
  }

  return (
    <>
      {isOpen && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)', zIndex: 299 }}
          className="md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0,
          zIndex: 300, width: '220px',
          backgroundColor: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)',
          display: 'flex', flexDirection: 'column',
          transition: 'transform 250ms ease, background-color 0.3s ease, border-color 0.3s ease',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
        className="sidebar-aside"
      >
        {/* 로고 */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '0 20px',
          height: '60px', minHeight: '60px',
          borderBottom: '1px solid var(--color-border)', flexShrink: 0,
          boxSizing: 'border-box',
        }}>
          <img
            src="/logo.jpeg"
            alt="너스브릿지 PRO 로고"
            style={{
              width: '34px', height: '34px',
              borderRadius: '9px', objectFit: 'cover', flexShrink: 0,
            }}
          />
          <div>
            <div style={{ color: 'var(--color-text)', fontSize: '14px', fontWeight: 700, lineHeight: 1.3 }}>
              너스브릿지
            </div>
            <div style={{ color: 'var(--color-muted)', fontSize: '10px', marginTop: '1px' }}>
              PRO v1.0
            </div>
          </div>
        </div>

        {/* 사용자 정보 */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '14px 20px',
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg)', flexShrink: 0,
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            backgroundColor: avatarBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: 700, color: 'white', flexShrink: 0,
          }}>
            {avatarLetter}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{
                color: 'var(--color-text)', fontSize: '13px', fontWeight: 600,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {currentUser?.name ?? '—'}
              </span>
              <span style={{
                fontSize: '10px', fontWeight: 700, padding: '1px 5px',
                borderRadius: '4px', color: '#fff',
                backgroundColor: roleBadgeBg, flexShrink: 0,
              }}>
                {roleLabel}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
              <span style={{
                display: 'inline-block', width: '7px', height: '7px',
                borderRadius: '50%', backgroundColor: '#2E7D5E', flexShrink: 0,
              }} />
              <span style={{
                color: 'var(--color-muted)', fontSize: '11px',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {shiftLabel}
              </span>
            </div>
          </div>
        </div>

        {/* 네비게이션 */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '6px 0 8px' }}>
          {navSections.map(section => (
            <div key={section.label}>
              <div style={{
                padding: '12px 20px 4px',
                color: 'var(--color-muted)',
                fontSize: '10px', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.8px',
              }}>
                {section.label}
              </div>

              {section.items.map(item => (
                <NavLink
                  key={`${section.label}-${item.to}`}
                  to={item.to}
                  end={item.exact ?? true}
                  onClick={onClose}
                  style={({ isActive }) =>
                    isActive
                      ? {
                          ...linkBase,
                          backgroundColor: 'var(--color-bg)',
                          color: 'var(--color-primary)',
                          fontWeight: 600,
                          borderRight: '3px solid var(--color-primary)',
                        }
                      : { ...linkBase, color: 'var(--color-muted)' }
                  }
                >
                  {item.icon}
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.label}
                  </span>
                  {item.badge != null && (
                    <span style={{
                      flexShrink: 0, color: '#fff',
                      fontSize: '11px', fontWeight: 700,
                      padding: '2px 7px', borderRadius: '10px',
                      lineHeight: '1.4', minWidth: '20px', textAlign: 'center',
                      backgroundColor:
                        item.badgeVariant === 'warn' ? '#D4860A'
                        : item.badgeVariant === 'ok' ? '#2E7D5E'
                        : '#C0392B',
                    }}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* 로그아웃 */}
        <div style={{ borderTop: '1px solid var(--color-border)', padding: '12px 20px', flexShrink: 0 }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              width: '100%', padding: '9px 10px',
              borderRadius: '8px', border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--color-muted)',
              fontSize: '13px', fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#FDECEA'
              e.currentTarget.style.color = '#C0392B'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = 'var(--color-muted)'
            }}
          >
            <LuLogOut style={{ width: '16px', height: '16px' }} />
            <span>로그아웃</span>
          </button>
        </div>
      </aside>
    </>
  )
}
