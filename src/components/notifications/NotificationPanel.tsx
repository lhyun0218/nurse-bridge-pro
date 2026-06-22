import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LuBell, LuBellOff, LuX, LuClock, LuCheckCheck, LuTrash2,
} from 'react-icons/lu'
import { useAppSelector } from '../../hooks/useAppSelector'
import { useAppDispatch } from '../../hooks/useAppDispatch'
import {
  markAsRead,
  markAllAsRead,
  dismissNotification,
  clearAllNotifications,
  type NotificationType,
} from '../../store/slices/notificationsSlice'

interface NotificationPanelProps {
  isOpen: boolean
  onClose: () => void
}

type FilterTab = 'all' | NotificationType

const TAB_LABELS: Record<FilterTab, string> = {
  all:    '전체',
  danger: '위험',
  warn:   '주의',
  info:   '정보',
}

const TYPE_COLORS: Record<NotificationType, { bg: string; text: string; border: string; dot: string }> = {
  danger: {
    bg:     'rgba(192,57,43,0.08)',
    text:   '#C0392B',
    border: 'rgba(192,57,43,0.25)',
    dot:    '#C0392B',
  },
  warn: {
    bg:     'rgba(212,134,10,0.08)',
    text:   '#D4860A',
    border: 'rgba(212,134,10,0.25)',
    dot:    '#D4860A',
  },
  info: {
    bg:     'rgba(44,110,138,0.08)',
    text:   '#2C6E8A',
    border: 'rgba(44,110,138,0.25)',
    dot:    '#2C6E8A',
  },
}

function formatTimestamp(ts: number): string {
  const now = Date.now()
  const diff = Math.floor((now - ts) / 1000)
  if (diff < 60) return `${diff}초 전`
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  return new Date(ts).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

export default function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const dispatch = useAppDispatch()
  const notifications = useAppSelector(s => s.notifications.items)
  const [activeTab, setActiveTab] = useState<FilterTab>('all')

  const filtered = activeTab === 'all'
    ? notifications
    : notifications.filter(n => n.type === activeTab)

  const unreadCount = notifications.filter(n => !n.read).length

  const handleItemClick = (id: string) => {
    dispatch(markAsRead(id))
  }

  const handleDismiss = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    dispatch(dismissNotification(id))
  }

  const handleMarkAllRead = () => {
    dispatch(markAllAsRead())
  }

  const handleClearAll = () => {
    dispatch(clearAllNotifications())
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 배경 오버레이 */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.3)',
              zIndex: 200,
            }}
          />

          {/* 슬라이드인 패널 */}
          <motion.aside
            key="panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: 'min(380px, 100vw)',
              backgroundColor: 'var(--color-surface)',
              borderLeft: '1px solid var(--color-border)',
              zIndex: 201,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
            }}
            role="dialog"
            aria-modal="true"
            aria-label="알림 센터"
          >
            {/* 헤더 */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <LuBell style={{ width: 18, height: 18, color: 'var(--color-primary)' }} />
                <span style={{ color: 'var(--color-text)', fontWeight: 700, fontSize: 16 }}>
                  알림 센터
                </span>
                {unreadCount > 0 && (
                  <span style={{
                    backgroundColor: '#C0392B', color: '#fff',
                    borderRadius: 10, padding: '1px 7px',
                    fontSize: 11, fontWeight: 700,
                  }}>
                    {unreadCount}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--color-muted)', padding: '4px',
                  borderRadius: 6, display: 'flex', alignItems: 'center',
                }}
                aria-label="닫기"
              >
                <LuX style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {/* 필터 탭 */}
            <div
              style={{
                display: 'flex',
                gap: 4,
                padding: '10px 16px',
                borderBottom: '1px solid var(--color-border)',
                flexShrink: 0,
              }}
            >
              {(Object.keys(TAB_LABELS) as FilterTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 20,
                    border: '1px solid',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: activeTab === tab ? 700 : 400,
                    transition: 'all 0.15s',
                    backgroundColor: activeTab === tab
                      ? (tab === 'all' ? 'var(--color-primary)' : TYPE_COLORS[tab as NotificationType].dot)
                      : 'transparent',
                    borderColor: activeTab === tab
                      ? (tab === 'all' ? 'var(--color-primary)' : TYPE_COLORS[tab as NotificationType].dot)
                      : 'var(--color-border)',
                    color: activeTab === tab ? '#fff' : 'var(--color-muted)',
                  }}
                >
                  {TAB_LABELS[tab]}
                  {tab !== 'all' && (
                    <span style={{ marginLeft: 4, opacity: 0.8 }}>
                      ({notifications.filter(n => n.type === tab).length})
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* 액션 버튼 */}
            {notifications.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  padding: '8px 16px',
                  borderBottom: '1px solid var(--color-border)',
                  flexShrink: 0,
                }}
              >
                <button
                  onClick={handleMarkAllRead}
                  style={{
                    flex: 1, padding: '6px 0', borderRadius: 8,
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'transparent', color: 'var(--color-muted)',
                    fontSize: 12, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  }}
                >
                  <LuCheckCheck style={{ width: 13, height: 13 }} />
                  전체 읽음
                </button>
                <button
                  onClick={handleClearAll}
                  style={{
                    flex: 1, padding: '6px 0', borderRadius: 8,
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'transparent', color: 'var(--color-muted)',
                    fontSize: 12, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  }}
                >
                  <LuTrash2 style={{ width: 13, height: 13 }} />
                  전체 삭제
                </button>
              </div>
            )}

            {/* 알림 목록 */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '8px 0',
              }}
            >
              <AnimatePresence initial={false}>
                {filtered.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '60px 20px',
                      gap: 12,
                    }}
                  >
                  <LuBellOff style={{ width: 40, height: 40, color: 'var(--color-border)' }} />
                    <p style={{ color: 'var(--color-muted)', fontSize: 14, textAlign: 'center' }}>
                      {activeTab === 'all' ? '알림이 없습니다' : `${TAB_LABELS[activeTab]} 알림이 없습니다`}
                    </p>
                  </motion.div>
                ) : (
                  filtered.map(notification => {
                    const colors = TYPE_COLORS[notification.type]
                    return (
                      <motion.div
                        key={notification.id}
                        layout
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 30, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => handleItemClick(notification.id)}
                        style={{
                          margin: '4px 12px',
                          padding: '12px 14px',
                          borderRadius: 10,
                          border: `1px solid ${notification.read ? 'var(--color-border)' : colors.border}`,
                          backgroundColor: notification.read ? 'transparent' : colors.bg,
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'background-color 0.2s',
                        }}
                      >
                        {/* 읽지 않음 점 */}
                        {!notification.read && (
                          <span
                            style={{
                              position: 'absolute',
                              top: 14,
                              left: 14,
                              width: 7,
                              height: 7,
                              borderRadius: '50%',
                              backgroundColor: colors.dot,
                            }}
                          />
                        )}

                        <div style={{ paddingLeft: notification.read ? 0 : 14 }}>
                          {/* 타입 배지 + 제목 */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: 4,
                                backgroundColor: colors.bg,
                                color: colors.text,
                                border: `1px solid ${colors.border}`,
                                textTransform: 'uppercase',
                              }}
                            >
                              {notification.type === 'danger' ? '위험' : notification.type === 'warn' ? '주의' : '정보'}
                            </span>
                            {notification.patientName && (
                              <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                                {notification.patientName}
                                {notification.roomNumber && ` · ${notification.roomNumber}`}
                              </span>
                            )}
                          </div>

                          {/* 제목 */}
                          <p
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: 'var(--color-text)',
                              marginBottom: 2,
                              lineHeight: 1.4,
                            }}
                          >
                            {notification.title}
                          </p>

                          {/* 메시지 */}
                          <p
                            style={{
                              fontSize: 12,
                              color: 'var(--color-muted)',
                              lineHeight: 1.5,
                              marginBottom: 6,
                            }}
                          >
                            {notification.message}
                          </p>

                          {/* 타임스탬프 + 삭제 버튼 */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 11, color: 'var(--color-muted)', opacity: 0.7, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <LuClock style={{ width: 11, height: 11 }} />
                              {formatTimestamp(notification.timestamp)}
                            </span>
                            <button
                              onClick={e => handleDismiss(e, notification.id)}
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'var(--color-muted)', padding: '2px 4px',
                                borderRadius: 4, opacity: 0.6,
                                display: 'flex', alignItems: 'center',
                              }}
                              aria-label="알림 삭제"
                            >
                              <LuX style={{ width: 13, height: 13 }} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })
                )}
              </AnimatePresence>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
