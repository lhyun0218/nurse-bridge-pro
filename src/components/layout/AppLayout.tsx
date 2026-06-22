import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import type { Transition } from 'framer-motion'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import BottomNav from './BottomNav'
import NotificationPanel from '../notifications/NotificationPanel'
import { useAppSelector } from '../../hooks/useAppSelector'
import { useAppDispatch } from '../../hooks/useAppDispatch'
import { addNotification } from '../../store/slices/notificationsSlice'
import broadcast from '../../utils/broadcast'
import { setRecords } from '../../store/slices/attendanceSlice'

/* ── 출퇴근 이벤트 팝업 토스트 ─────────────────────────────── */
interface AttendanceToast {
  id: string
  message: string
  type: 'checkin' | 'checkout' | 'approve' | 'request'
}

function AttendanceToastBanner({ toasts, onDismiss }: { toasts: AttendanceToast[]; onDismiss: (id: string) => void }) {
  const colorMap = {
    checkin:  { bg: '#E8F5EE', border: '#2E7D5E', color: '#2E7D5E', icon: '🟢' },
    request:  { bg: '#FEF3E2', border: '#D4860A', color: '#D4860A', icon: '⏳' },
    approve:  { bg: '#EAF4F9', border: '#2C6E8A', color: '#2C6E8A', icon: '✅' },
    checkout: { bg: '#F0F4F7', border: '#6B8090', color: '#6B8090', icon: '🔵' },
  }
  if (toasts.length === 0) return null
  return (
    <div style={{ position: 'fixed', top: 72, right: 20, zIndex: 1100, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 340 }}>
      <AnimatePresence>
        {toasts.map(t => {
          const c = colorMap[t.type]
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 60 }}
              transition={{ duration: 0.22 }}
              onClick={() => onDismiss(t.id)}
              style={{
                padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
                background: c.bg, border: `1.5px solid ${c.border}`,
                boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                display: 'flex', alignItems: 'center', gap: 10,
              }}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>{c.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: c.color, flex: 1 }}>{t.message}</span>
              <button
                onClick={e => { e.stopPropagation(); onDismiss(t.id) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.color, fontSize: 16, flexShrink: 0, lineHeight: 1 }}
                aria-label="닫기"
              >✕</button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

interface AppLayoutProps {
  children: React.ReactNode
  pageTitle: string
}

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -20 },
}

const pageTransition: Transition = {
  duration: 0.2,
  ease: 'easeOut',
}

export default function AppLayout({ children, pageTitle }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const location = useLocation()
  const dispatch = useAppDispatch()

  const vitalAlerts      = useAppSelector(s => s.alerts.vitalAlerts)
  const medicationAlerts = useAppSelector(s => s.alerts.medicationAlerts)
  const nurses           = useAppSelector(s => s.nurses.allNurses)
  const currentUser      = useAppSelector(s => s.auth.currentUser)

  // 출퇴근 이벤트 팝업 토스트
  const [attendanceToasts, setAttendanceToasts] = useState<AttendanceToast[]>([])
  const dismissToast = (id: string) => setAttendanceToasts(prev => prev.filter(t => t.id !== id))
  const pushToast = (toast: AttendanceToast) => {
    setAttendanceToasts(prev => [...prev.slice(-4), toast]) // 최대 5개
    setTimeout(() => dismissToast(toast.id), 6000)
  }

  // 출퇴근 이벤트 핸들러 — broadcast(타 탭) + window event(같은 탭) 공용
  const nursesRef = useRef(nurses)
  useEffect(() => { nursesRef.current = nurses }, [nurses])
  const currentUserRef = useRef(currentUser)
  useEffect(() => { currentUserRef.current = currentUser }, [currentUser])

  useEffect(() => {
    const handleMsg = (msg: any) => {
      if (!msg?.type) return
      // 본인이 발생시킨 출퇴근 이벤트는 토스트 생략 (addNotification으로 이미 알림 처리됨)
      const eventNurseId = msg.nurseId ?? msg.payload?.nurseId
      if (eventNurseId && eventNurseId === currentUserRef.current?.id) return
      if (msg.type.startsWith('attendance')) {
        try {
          const raw = localStorage.getItem('nb:persist:v1')
          if (raw) {
            const p = JSON.parse(raw)
            if (Array.isArray(p?.attendance?.records)) dispatch(setRecords(p.attendance.records))
          }
        } catch (_) {}
      }
      const nurseName = nursesRef.current.find((n: any) => n.id === eventNurseId)?.name ?? '간호사'
      const id = `att-toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
      if (msg.type === 'attendance:checkin')
        pushToast({ id, type: 'checkin',  message: `${nurseName}님이 출근했습니다` })
      else if (msg.type === 'attendance:request')
        pushToast({ id, type: 'request',  message: `${nurseName}님이 퇴근을 신청했습니다` })
      else if (msg.type === 'attendance:approve')
        pushToast({ id, type: 'approve',  message: `${nurseName}님의 퇴근이 승인되었습니다` })
      else if (msg.type === 'attendance:checkout')
        pushToast({ id, type: 'checkout', message: `${nurseName}님이 퇴근했습니다` })
    }

    const unsub = broadcast.subscribe(handleMsg)
    return () => {
      if (typeof unsub === 'function') unsub()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch])

  // 이전 알림 ID 추적 (새 알림만 notifications에 추가)
  const prevVitalIds      = useRef<Set<string>>(new Set())
  const prevMedIds        = useRef<Set<string>>(new Set())

  useEffect(() => {
    const now = Date.now()
    vitalAlerts.forEach(alert => {
      if (!prevVitalIds.current.has(alert.id)) {
        // 30초 이내 같은 id 알림이 이미 있으면 스킵
        dispatch(addNotification({
          id:          alert.id,
          type:        alert.type,
          title:       `활력징후 이상 — ${alert.patientName}`,
          message:     alert.message,
          timestamp:   now,
          patientId:   alert.patientId,
          patientName: alert.patientName,
          roomNumber:  alert.roomNumber,
        }))
      }
    })
    prevVitalIds.current = new Set(vitalAlerts.map(a => a.id))
  }, [vitalAlerts, dispatch])

  useEffect(() => {
    const now = Date.now()
    medicationAlerts.forEach(alert => {
      if (!prevMedIds.current.has(alert.id)) {
        dispatch(addNotification({
          id:          alert.id,
          type:        alert.type,
          title:       `투약 알림 — ${alert.patientName}`,
          message:     alert.message,
          timestamp:   now,
          patientId:   alert.patientId,
          patientName: alert.patientName,
          roomNumber:  alert.roomNumber,
        }))
      }
    })
    prevMedIds.current = new Set(medicationAlerts.map(a => a.id))
  }, [medicationAlerts, dispatch])

  const toggleSidebar = () => setSidebarOpen(prev => !prev)
  const closeSidebar  = () => setSidebarOpen(false)

  return (
    <div className="app-layout">
      {/* 사이드바 (데스크톱 고정 / 모바일 슬라이드) */}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* 콘텐츠 영역 */}
      <div
        className="app-content"
        style={{ backgroundColor: 'var(--color-bg)', transition: 'background-color 0.3s ease' }}
      >
        <Topbar
          pageTitle={pageTitle}
          onMenuToggle={toggleSidebar}
          onNotificationClick={() => setNotificationOpen(true)}
        />

        {/* 페이지 전환 애니메이션 */}
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            style={{ flex: 1, paddingBottom: '0' }}
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>

      {/* 모바일 하단 네비 */}
      <BottomNav onMenuToggle={toggleSidebar} />

      {/* 알림 센터 패널 */}
      <NotificationPanel
        isOpen={notificationOpen}
        onClose={() => setNotificationOpen(false)}
      />

      {/* 출퇴근 이벤트 팝업 */}
      <AttendanceToastBanner toasts={attendanceToasts} onDismiss={dismissToast} />
    </div>
  )
}
