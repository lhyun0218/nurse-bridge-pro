import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LuMenu, LuSun, LuMoon, LuClock, LuBellDot } from 'react-icons/lu'
import { useAppSelector } from '../../hooks/useAppSelector'
import { useTheme } from '../../hooks/useTheme'
import { minutesUntilShiftEnd } from '../../constants/shiftTimes'
import type { ShiftType } from '../../types'

interface TopbarProps {
  pageTitle: string
  onMenuToggle: () => void
  onNotificationClick?: () => void
}

export default function Topbar({ pageTitle, onMenuToggle, onNotificationClick }: TopbarProps) {
  const [currentTime, setCurrentTime] = useState(() => new Date())
  const [remainingStr, setRemainingStr] = useState('')
  const [dark, setDark] = useState(false)
  const currentUser      = useAppSelector(s => s.auth.currentUser)
  const vitalAlerts      = useAppSelector(s => s.alerts.vitalAlerts)
  const medicationAlerts = useAppSelector(s => s.alerts.medicationAlerts)
  const unreadCount      = useAppSelector(s => s.notifications.items.filter(n => !n.read).length)
  const hasAlerts        = vitalAlerts.length > 0 || medicationAlerts.length > 0 || unreadCount > 0

  // 오늘 출근/퇴근 기록 조회
  const todayStr = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const attendanceRecords = useAppSelector(s => s.attendance.records)
  const todayRecord = currentUser
    ? attendanceRecords.find(r => r.nurseId === currentUser.id && r.date === todayStr)
    : undefined

  const { isDark, toggleTheme } = useTheme()

  // 1초 인터벌: 시계 갱신
  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // 1분 인터벌: 남은 근무 시간 계산 (SHIFT_TIMES 기반)
  useEffect(() => {
    const calc = () => {
      if (!currentUser?.shiftType) {
        setRemainingStr('출근 전')
        return
      }

      // checkOut 기록이 있으면 퇴근 완료
      if (todayRecord?.checkOut != null) {
        setRemainingStr('퇴근 완료')
        return
      }

      // checkIn 기록이 없으면 출근 전
      if (!todayRecord?.checkIn) {
        setRemainingStr('출근 전')
        return
      }

      // 근무 중: minutesUntilShiftEnd 기반 계산
      const shiftType = currentUser.shiftType as ShiftType
      const mins = minutesUntilShiftEnd(shiftType)
      if (mins <= 0) {
        setRemainingStr('근무 종료')
        return
      }
      const hours = Math.floor(mins / 60)
      const m = mins % 60
      if (hours > 0) {
        setRemainingStr(`남은 근무: ${hours}시간 ${m}분`)
      } else {
        setRemainingStr(`남은 근무: ${m}분`)
      }
    }

    calc() // 즉시 실행
    const id = setInterval(calc, 60000) // 1분 인터벌
    return () => clearInterval(id)
  }, [currentUser, todayRecord])

  useEffect(() => { setDark(isDark()) })

  const handleToggle = () => { toggleTheme(); setDark(!dark) }

  const dateStr = currentTime.toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  })
  const shiftLabel =
    currentUser?.shiftType === 'Day'     ? 'Day 근무'
    : currentUser?.shiftType === 'Evening' ? 'Evening 근무'
    : 'Night 근무'

  const btnStyle = {
    backgroundColor: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-muted)',
    width: '36px', height: '36px',
    borderRadius: '8px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', position: 'relative' as const,
    flexShrink: 0,
  }

  return (
    <header style={{
      backgroundColor: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      height: '60px', minHeight: '60px',
      padding: '0 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 100,
      transition: 'background-color 0.3s ease, border-color 0.3s ease',
      gap: '12px',
    }}>
      {/* 좌측 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
        <button
          onClick={onMenuToggle}
          style={btnStyle}
          className="hamburger-btn"
          aria-label="메뉴 열기"
        >
          <LuMenu style={{ width: '18px', height: '18px' }} />
        </button>

        <div style={{ minWidth: 0 }}>
          <div style={{ color: 'var(--color-text)', fontSize: '16px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {pageTitle}
          </div>
          <div style={{ color: 'var(--color-muted)', fontSize: '12px', whiteSpace: 'nowrap' }}>
            {dateStr} · {shiftLabel}
          </div>
        </div>
      </div>

      {/* 우측 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {/* 시간 칩 */}
        <div style={{
          backgroundColor: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-muted)',
          padding: '5px 12px',
          borderRadius: '20px',
          fontSize: '12px', fontWeight: 500,
          whiteSpace: 'nowrap',
          fontVariantNumeric: 'tabular-nums',
          fontFeatureSettings: '"tnum"',
          minWidth: '160px', textAlign: 'center',
          letterSpacing: '0.02em',
          display: 'flex', alignItems: 'center', gap: '5px',
        }}>
          <LuClock style={{ width: '13px', height: '13px', flexShrink: 0 }} />
          {remainingStr}
        </div>

        {/* 다크 모드 토글 */}
        <motion.button
          onClick={handleToggle}
          whileTap={{ scale: 0.9 }}
          style={{ ...btnStyle, overflow: 'hidden' }}
          aria-label={dark ? '라이트 모드로 전환' : '다크 모드로 전환'}
        >
          <AnimatePresence mode="wait" initial={false}>
            {dark ? (
              <motion.span key="sun"
                initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                <LuSun style={{ width: '17px', height: '17px' }} />
              </motion.span>
            ) : (
              <motion.span key="moon"
                initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                <LuMoon style={{ width: '17px', height: '17px' }} />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* 알림 버튼 */}
        <motion.button
          onClick={onNotificationClick}
          whileTap={{ scale: 0.9 }}
          style={btnStyle}
          aria-label="알림 센터 열기"
        >
          <LuBellDot style={{ width: '17px', height: '17px' }} />
          {unreadCount > 0 ? (
            <span style={{
              position: 'absolute', top: '-4px', right: '-4px',
              backgroundColor: '#C0392B', color: '#fff',
              fontSize: '10px', fontWeight: 700, lineHeight: 1,
              padding: '2px 5px', borderRadius: '10px',
              minWidth: '18px', textAlign: 'center',
              border: '2px solid var(--color-surface)',
              whiteSpace: 'nowrap',
            }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : hasAlerts ? (
            <span style={{
              position: 'absolute', top: '4px', right: '4px',
              width: '8px', height: '8px', borderRadius: '50%',
              backgroundColor: '#C0392B',
              border: '2px solid var(--color-surface)',
            }} />
          ) : null}
        </motion.button>
      </div>
    </header>
  )
}
