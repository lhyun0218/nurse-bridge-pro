import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LuSun, LuSunset, LuMoon, LuCircleAlert } from 'react-icons/lu'
import { SHIFT_TIMES } from '../../constants/shiftTimes'

type ShiftType = 'Day' | 'Evening' | 'Night'

type Props = {
  open: boolean
  nurseName: string
  /** The shift that the nurse is scheduled for (from DB profile) */
  profileShift: ShiftType
  /** The shift the nurse selected on the login form */
  selectedShift: ShiftType
  onConfirm: (remember: boolean) => void
  onCancel: () => void
}

const SHIFT_META: Record<ShiftType, { label: string; time: string; icon: React.ElementType; color: string; bg: string }> = {
  Day:     { label: '데이',   time: `${SHIFT_TIMES.Day.workStart} – ${SHIFT_TIMES.Day.workEnd}`,         icon: LuSun,     color: '#2C6E8A', bg: '#EAF4F9' },
  Evening: { label: '이브닝', time: `${SHIFT_TIMES.Evening.workStart} – ${SHIFT_TIMES.Evening.workEnd}`, icon: LuSunset,  color: '#D4860A', bg: '#FEF3E2' },
  Night:   { label: '나이트', time: `${SHIFT_TIMES.Night.workStart} – ${SHIFT_TIMES.Night.workEnd}`,     icon: LuMoon,    color: '#3F51B5', bg: '#EEF0FB' },
}

const ConfirmShiftModal: React.FC<Props> = ({
  open,
  nurseName,
  profileShift,
  selectedShift,
  onConfirm,
  onCancel,
}) => {
  const [remember, setRemember] = React.useState(false)

  const profile  = SHIFT_META[profileShift]
  const selected = SHIFT_META[selectedShift]
  const ProfileIcon  = profile.icon
  const SelectedIcon = selected.icon

  return (
    <AnimatePresence>
      {open && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'absolute', inset: 0, background: 'rgba(10,16,22,0.55)', backdropFilter: 'blur(2px)' }}
            onClick={onCancel}
          />

          {/* Modal */}
          <motion.div
            initial={{ y: 16, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 8, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{
              position: 'relative', width: 440, maxWidth: '92vw',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(10,20,30,0.28)',
            }}
          >
            {/* Top accent bar */}
            <div style={{ height: 4, background: `linear-gradient(90deg, ${selected.color}, ${profile.color})` }} />

            <div style={{ padding: '24px 28px 28px' }}>
              {/* Icon + Title */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: '#FEF3E2', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <LuCircleAlert style={{ width: 22, height: 22, color: '#D4860A' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>
                    교대 확인이 필요합니다
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.5 }}>
                    선택하신 교대가 등록된 교대와 다릅니다
                  </p>
                </div>
              </div>

              {/* Nurse name banner */}
              <div style={{
                padding: '12px 16px', borderRadius: 10,
                background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                marginBottom: 16, fontSize: 14, fontWeight: 600, color: 'var(--color-text)',
              }}>
                👤 {nurseName} 간호사님
              </div>

              {/* Shift comparison */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center', marginBottom: 20 }}>
                {/* Profile shift */}
                <div style={{
                  padding: '14px 12px', borderRadius: 10,
                  background: profile.bg,
                  border: `1.5px solid ${profile.color}40`,
                  textAlign: 'center',
                }}>
                  <div style={{ marginBottom: 4, display: 'flex', justifyContent: 'center' }}>
                    <ProfileIcon style={{ width: 20, height: 20, color: profile.color }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 2 }}>등록된 교대</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: profile.color }}>{profile.label}</div>
                  <div style={{ fontSize: 11, color: profile.color, opacity: 0.8, marginTop: 2 }}>{profile.time}</div>
                </div>

                {/* Arrow */}
                <div style={{ fontSize: 18, color: 'var(--color-muted)', textAlign: 'center' }}>→</div>

                {/* Selected shift */}
                <div style={{
                  padding: '14px 12px', borderRadius: 10,
                  background: selected.bg,
                  border: `2px solid ${selected.color}`,
                  textAlign: 'center',
                }}>
                  <div style={{ marginBottom: 4, display: 'flex', justifyContent: 'center' }}>
                    <SelectedIcon style={{ width: 20, height: 20, color: selected.color }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 2 }}>선택한 교대</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: selected.color }}>{selected.label}</div>
                  <div style={{ fontSize: 11, color: selected.color, opacity: 0.8, marginTop: 2 }}>{selected.time}</div>
                </div>
              </div>

              {/* Confirm message */}
              <div style={{
                padding: '12px 16px', borderRadius: 10,
                background: `${selected.color}0E`,
                border: `1px solid ${selected.color}30`,
                fontSize: 13, color: 'var(--color-text)', lineHeight: 1.6,
                marginBottom: 18,
              }}>
                <strong style={{ color: selected.color }}>{selected.label} 교대</strong>로 로그인하시겠습니까?
              </div>

              {/* Remember checkbox */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 22 }}>
                <div
                  onClick={() => setRemember(r => !r)}
                  style={{
                    width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                    border: `2px solid ${remember ? selected.color : 'var(--color-border)'}`,
                    background: remember ? selected.color : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s', cursor: 'pointer',
                  }}
                >
                  {remember && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span style={{ fontSize: 13, color: 'var(--color-muted)', userSelect: 'none' }}>
                  이 선택을 기억하기 (다음 로그인 시 자동 적용)
                </span>
              </label>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={onCancel}
                  style={{
                    flex: 1, padding: '11px 0',
                    borderRadius: 9, border: '1.5px solid var(--color-border)',
                    background: 'transparent', fontSize: 14, fontWeight: 600,
                    color: 'var(--color-text)', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                >
                  취소
                </button>
                <button
                  onClick={() => onConfirm(remember)}
                  style={{
                    flex: 2, padding: '11px 0',
                    borderRadius: 9, border: 'none',
                    background: selected.color, fontSize: 14, fontWeight: 700,
                    color: '#fff', cursor: 'pointer', transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.88' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
                >
                  {selected.label} 교대로 로그인
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default ConfirmShiftModal
