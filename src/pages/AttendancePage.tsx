import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  LuLogIn, LuLogOut, LuClock, LuCalendar, LuCircleCheck,
  LuSun, LuSunset, LuMoon, LuChevronLeft, LuChevronRight,
  LuCoffee, LuX,
} from 'react-icons/lu'
import { useAppDispatch } from '../hooks/useAppDispatch'
import { useAppSelector } from '../hooks/useAppSelector'
import { checkIn, checkOut, setRecords, startBreak, endBreak, requestEarlyLeave } from '../store/slices/attendanceSlice'
import { addNotification } from '../store/slices/notificationsSlice'
import broadcast from '../utils/broadcast'
import { SHIFT_TIMES, isOnTimeDeparture } from '../constants/shiftTimes'
import type { ShiftType } from '../types'

/* ── shift meta ── */
const SHIFT_META = {
  Day:     { label: '데이',   icon: LuSun,     color: '#2C6E8A', bg: '#EAF4F9', time: `${SHIFT_TIMES.Day.workStart} – ${SHIFT_TIMES.Day.workEnd}` },
  Evening: { label: '이브닝', icon: LuSunset,  color: '#D4860A', bg: '#FEF3E2', time: `${SHIFT_TIMES.Evening.workStart} – ${SHIFT_TIMES.Evening.workEnd}` },
  Night:   { label: '나이트', icon: LuMoon,    color: '#3F51B5', bg: '#EEF0FB', time: `${SHIFT_TIMES.Night.workStart} – ${SHIFT_TIMES.Night.workEnd}` },
}

function fmtTime(ts?: number) {
  if (!ts) return '—'
  return new Date(ts).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

function hydrateFromStorage(dispatch: ReturnType<typeof useAppDispatch>) {
  try {
    const raw = localStorage.getItem('nb:persist:v1')
    if (!raw) return
    const p = JSON.parse(raw)
    if (p?.attendance?.records) dispatch(setRecords(p.attendance.records))
  } catch (_) {}
}

/* ─────────────────────────────── */
/*  Main Component                 */
/* ─────────────────────────────── */
const AttendancePage: React.FC = () => {
  const dispatch    = useAppDispatch()
  const currentUser = useAppSelector(s => s.auth.currentUser)
  const records     = useAppSelector(s => s.attendance.records)
  const today       = new Date().toISOString().slice(0, 10)
  const todayRec    = records.find(r => r.nurseId === currentUser?.id && r.date === today)

  /* calendar nav */
  const now = new Date()
  const [calYear,  setCalYear]  = useState(now.getFullYear())
  const [calMonth, setCalMonth] = useState(now.getMonth()) // 0-indexed

  /* 조기 퇴근 모달 */
  const [showEarlyLeaveModal, setShowEarlyLeaveModal] = useState(false)

  if (!currentUser) return <div style={{ padding: 24 }}>로그인이 필요합니다.</div>

  const shiftKey = (currentUser.shiftType ?? 'Day') as keyof typeof SHIFT_META
  const meta     = SHIFT_META[shiftKey] ?? SHIFT_META.Day
  const ShiftIcon = meta.icon

  /* status */
  const checkedIn      = !!todayRec?.checkIn
  const onBreak        = !!todayRec?.onBreak
  const checkoutReqd   = !!todayRec?.checkoutRequested
  const checkoutApprv  = !!todayRec?.checkoutApproved
  const checkedOut     = !!todayRec?.checkOut

  /* 정시 퇴근 여부 */
  const onTime = isOnTimeDeparture(shiftKey as ShiftType)

  const fireAttEvent = (type: string) => {
    // 다른 탭(수간호사 등)에만 broadcast — 같은 탭은 Redux dispatch로 이미 처리됨
    broadcast.send(type, { nurseId: currentUser.id, date: today })
  }

  const handleCheckIn = () => {
    dispatch(checkIn({ nurseId: currentUser.id, date: today }))
    fireAttEvent('attendance:checkin')
  }

  const handleStartBreak = () => {
    dispatch(startBreak({ nurseId: currentUser.id, date: today }))
  }

  const handleEndBreak = () => {
    dispatch(endBreak({ nurseId: currentUser.id, date: today }))
  }

  const handleCheckOut = () => {
    dispatch(checkOut({ nurseId: currentUser.id, date: today }))
    fireAttEvent('attendance:checkout')
  }

  const handleEarlyLeaveSubmit = (reason: string) => {
    dispatch(requestEarlyLeave({ nurseId: currentUser.id, date: today, reason }))
    const nid = `notif-earlyleave-${Date.now()}`
    dispatch(addNotification({ id: nid, type: 'info', title: '조기 퇴근 신청', message: '수간호사님께 조기 퇴근 승인을 요청했습니다.', timestamp: Date.now() }))
    broadcast.send('attendance:request', { nurseId: currentUser.id, date: today })
    setShowEarlyLeaveModal(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      style={{ padding: '22px 24px 60px', maxWidth: 960, margin: '0 auto' }}
    >
      {/* ── 조기 퇴근 모달 ── */}
      {showEarlyLeaveModal && (
        <EarlyLeaveModal
          onSubmit={handleEarlyLeaveSubmit}
          onClose={() => setShowEarlyLeaveModal(false)}
        />
      )}

      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--color-text)' }}>근태</h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-muted)' }}>
          {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </p>
      </div>

      {/* ── Shift badge + Today card ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>

        {/* Shift info card */}
        <div style={{
          padding: '20px 22px', borderRadius: 14,
          background: meta.bg, border: `1.5px solid ${meta.color}30`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ShiftIcon style={{ width: 20, height: 20, color: '#fff' }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: meta.color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                오늘 교대
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: meta.color }}>
                {meta.label}
              </div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: meta.color, opacity: 0.85 }}>{meta.time}</div>
          <div style={{ marginTop: 8, fontSize: 13, color: 'var(--color-text)', fontWeight: 600 }}>
            {currentUser.name} 간호사님
          </div>
        </div>

        {/* Today status card */}
        <div style={{
          padding: '20px 22px', borderRadius: 14,
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        }}>
          <div style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            오늘 근태 현황
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: '출근', icon: LuLogIn,     value: fmtTime(todayRec?.checkIn), done: checkedIn },
              { label: '휴게', icon: LuCoffee, value: todayRec?.breakStart ? (todayRec?.breakEnd ? `${fmtTime(todayRec.breakStart)}~${fmtTime(todayRec.breakEnd)}` : `${fmtTime(todayRec.breakStart)} 시작`) : '—', done: !!todayRec?.breakEnd, warn: onBreak },
              { label: '퇴근', icon: LuLogOut,    value: fmtTime(todayRec?.checkOut), done: checkedOut },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                  background: row.done ? '#E8F5EE' : row.warn ? '#FEF3E2' : 'var(--color-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <row.icon style={{ width: 14, height: 14, color: row.done ? '#2E7D5E' : row.warn ? '#D4860A' : 'var(--color-muted)' }} />
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-muted)', width: 60 }}>{row.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: row.done ? '#2E7D5E' : row.warn ? '#D4860A' : 'var(--color-text)' }}>
                  {row.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Action buttons ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 16 }}>
        {/* 출근 버튼 */}
        <ActionBtn
          icon={LuLogIn}
          label="출근"
          sub="출근 시간 기록"
          color="#2E7D5E"
          bg="#E8F5EE"
          disabled={checkedIn}
          done={checkedIn}
          doneLabel={checkedIn ? `${fmtTime(todayRec?.checkIn)} 출근` : undefined}
          onClick={handleCheckIn}
        />
        {/* 정시 퇴근 버튼 또는 조기 퇴근 신청 버튼 */}
        {(!checkoutReqd && !checkedOut) ? (
          onTime ? (
            <ActionBtn
              icon={LuLogOut}
              label="퇴근"
              sub="퇴근 시간 기록"
              color="#C0392B"
              bg="#FDECEA"
              disabled={!checkedIn || checkedOut}
              done={checkedOut}
              doneLabel={checkedOut ? `${fmtTime(todayRec?.checkOut)} 퇴근` : undefined}
              onClick={handleCheckOut}
            />
          ) : (
            <ActionBtn
              icon={LuClock}
              label="조기 퇴근 신청"
              sub="수간호사 승인 요청"
              color="#D4860A"
              bg="#FEF3E2"
              disabled={!checkedIn}
              done={false}
              onClick={() => setShowEarlyLeaveModal(true)}
            />
          )
        ) : checkedOut ? (
          <ActionBtn
            icon={LuLogOut}
            label="퇴근"
            sub="퇴근 시간 기록"
            color="#C0392B"
            bg="#FDECEA"
            disabled={true}
            done={true}
            doneLabel={`${fmtTime(todayRec?.checkOut)} 퇴근`}
            onClick={() => {}}
          />
        ) : checkoutApprv ? (
          <ActionBtn
            icon={LuLogOut}
            label="퇴근"
            sub="퇴근 시간 기록"
            color="#C0392B"
            bg="#FDECEA"
            disabled={false}
            done={false}
            onClick={handleCheckOut}
          />
        ) : (
          <ActionBtn
            icon={LuClock}
            label="조기 퇴근 신청"
            sub="승인 대기 중"
            color="#D4860A"
            bg="#FEF3E2"
            disabled={true}
            done={false}
            doneLabel="승인 대기 중"
            onClick={() => {}}
          />
        )}
      </div>

      {/* ── 휴게 버튼 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 32 }}>
        <ActionBtn
          icon={LuCoffee}
          label="휴게 시작"
          sub="휴게 시간 기록"
          color="#7B5EA7"
          bg="#F3EEF9"
          disabled={!checkedIn || onBreak || checkedOut}
          done={onBreak}
          doneLabel={onBreak ? `${fmtTime(todayRec?.breakStart)} 시작` : undefined}
          onClick={handleStartBreak}
        />
        <ActionBtn
          icon={LuCoffee}
          label="휴게 종료"
          sub="업무 복귀"
          color="#5C6BC0"
          bg="#EEF0FB"
          disabled={!onBreak || checkedOut}
          done={!!todayRec?.breakEnd && !onBreak}
          doneLabel={todayRec?.breakEnd && !onBreak ? `${fmtTime(todayRec?.breakEnd)} 종료` : undefined}
          onClick={handleEndBreak}
        />
      </div>

      {/* ── Status flow bar ── */}
      <div style={{
        padding: '16px 20px', borderRadius: 12,
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        marginBottom: 32,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {(['출근', '휴게', '퇴근'] as const).map((step, i) => {
            const done = [checkedIn, !!todayRec?.breakEnd, checkedOut][i]
            const active = [false, onBreak, checkoutReqd && !checkedOut][i]
            return (
              <React.Fragment key={step}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', margin: '0 auto 6px',
                    background: done ? '#2E7D5E' : active ? '#D4860A' : 'var(--color-bg)',
                    border: `2px solid ${done ? '#2E7D5E' : active ? '#D4860A' : 'var(--color-border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {done
                      ? <LuCircleCheck style={{ width: 14, height: 14, color: '#fff' }} />
                      : <span style={{ fontSize: 11, fontWeight: 700, color: active ? '#D4860A' : 'var(--color-muted)' }}>{i + 1}</span>
                    }
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: done ? '#2E7D5E' : active ? '#D4860A' : 'var(--color-muted)' }}>{step}</div>
                </div>
                {i < 2 && (
                  <div style={{
                    height: 2, width: 24, flexShrink: 0,
                    background: done ? '#2E7D5E' : 'var(--color-border)',
                    marginBottom: 22,
                  }} />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* ── Calendar ── */}
      <AttendanceCalendar
        nurseId={currentUser.id}
        records={records}
        year={calYear}
        month={calMonth}
        onPrev={() => {
          if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) }
          else setCalMonth(m => m - 1)
        }}
        onNext={() => {
          if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) }
          else setCalMonth(m => m + 1)
        }}
      />
    </motion.div>
  )
}

/* ── EarlyLeaveModal component ── */
interface EarlyLeaveModalProps {
  onSubmit: (reason: string) => void
  onClose: () => void
}

const EarlyLeaveModal: React.FC<EarlyLeaveModalProps> = ({ onSubmit, onClose }) => {
  const [reason, setReason] = React.useState('')
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 16, padding: '28px 28px 24px',
        width: '100%', maxWidth: 420,
        boxShadow: '0 8px 40px rgba(0,0,0,0.22)',
        position: 'relative',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 14, right: 14,
            width: 30, height: 30, borderRadius: 8,
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-muted)',
          }}
        >
          <LuX style={{ width: 15, height: 15 }} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: '#FEF3E2', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <LuClock style={{ width: 18, height: 18, color: '#D4860A' }} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)' }}>조기 퇴근 신청</div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>수간호사 승인 후 퇴근 가능</div>
          </div>
        </div>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: 8 }}>
          조기 퇴근 사유 <span style={{ color: '#C0392B' }}>*</span>
        </label>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="조기 퇴근이 필요한 사유를 입력해주세요."
          rows={4}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '12px 14px', borderRadius: 10,
            border: '1.5px solid var(--color-border)',
            background: 'var(--color-bg)',
            fontSize: 13, color: 'var(--color-text)',
            resize: 'vertical', outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '11px 0', borderRadius: 9,
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg)',
              fontSize: 13, fontWeight: 600,
              color: 'var(--color-text)', cursor: 'pointer',
            }}
          >
            취소
          </button>
          <button
            onClick={() => { if (reason.trim()) onSubmit(reason.trim()) }}
            disabled={!reason.trim()}
            style={{
              flex: 2, padding: '11px 0', borderRadius: 9,
              border: 'none',
              background: reason.trim() ? '#D4860A' : 'var(--color-border)',
              fontSize: 13, fontWeight: 700,
              color: '#fff', cursor: reason.trim() ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s',
            }}
          >
            신청하기
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── ActionBtn component ── */
interface ActionBtnProps {
  icon: React.ElementType
  label: string
  sub: string
  color: string
  bg: string
  disabled: boolean
  done: boolean
  doneLabel?: string
  onClick: () => void
}

const ActionBtn: React.FC<ActionBtnProps> = ({ icon: Icon, label, sub, color, bg, disabled, done, doneLabel, onClick }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      padding: '18px 14px', borderRadius: 14, border: `1.5px solid ${done ? color : disabled ? 'var(--color-border)' : color}30`,
      background: done ? bg : disabled ? 'var(--color-bg)' : bg,
      cursor: disabled ? 'not-allowed' : 'pointer',
      textAlign: 'left', transition: 'all 0.15s',
      opacity: disabled && !done ? 0.55 : 1,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <div style={{
        width: 36, height: 36, borderRadius: 9,
        background: done ? color : disabled ? 'var(--color-border)' : color,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {done
          ? <LuCircleCheck style={{ width: 18, height: 18, color: '#fff' }} />
          : <Icon style={{ width: 18, height: 18, color: '#fff' }} />
        }
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: done ? color : disabled ? 'var(--color-muted)' : color }}>
          {label}
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 1 }}>{sub}</div>
      </div>
    </div>
    {doneLabel && (
      <div style={{ fontSize: 12, color: color, fontWeight: 600, paddingLeft: 2 }}>{doneLabel}</div>
    )}
  </button>
)

/* ── AttendanceCalendar component ── */
interface CalendarProps {
  nurseId: string
  records: Array<{
    nurseId: string; date: string; checkIn?: number; checkOut?: number
    checkoutRequested?: boolean; checkoutApproved?: boolean
  }>
  year: number
  month: number // 0-indexed
  onPrev: () => void
  onNext: () => void
}

const AttendanceCalendar: React.FC<CalendarProps> = ({ nurseId, records, year, month, onPrev, onNext }) => {
  const myRecs  = useMemo(() => records.filter(r => r.nurseId === nurseId), [records, nurseId])
  const today   = new Date().toISOString().slice(0, 10)

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startDay    = new Date(year, month, 1).getDay() // 0=Sun

  const cells = useMemo(() => {
    const arr = []
    for (let i = 0; i < startDay; i++) arr.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const rec = myRecs.find(r => r.date === dateStr)
      arr.push({ day: d, dateStr, rec })
    }
    return arr
  }, [myRecs, year, month, daysInMonth, startDay])

  const monthLabel = new Date(year, month, 1).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })

  return (
    <div style={{ background: 'var(--color-surface)', borderRadius: 14, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
      {/* Calendar header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', borderBottom: '1px solid var(--color-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <LuCalendar style={{ width: 18, height: 18, color: 'var(--color-muted)' }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)' }}>근태 달력</span>
          <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>{monthLabel}</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <NavArrow onClick={onPrev}><LuChevronLeft style={{ width: 16, height: 16 }} /></NavArrow>
          <NavArrow onClick={onNext}><LuChevronRight style={{ width: 16, height: 16 }} /></NavArrow>
        </div>
      </div>

      <div style={{ padding: '14px 16px 20px' }}>
        {/* Weekday headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 8 }}>
          {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
            <div key={d} style={{
              textAlign: 'center', fontSize: 11, fontWeight: 700, padding: '6px 0',
              color: i === 0 ? '#C0392B' : i === 6 ? '#2C6E8A' : 'var(--color-muted)',
            }}>{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
          {cells.map((cell, idx) => {
            if (!cell) return <div key={`empty-${idx}`} />
            const isToday = cell.dateStr === today
            const rec = cell.rec
            const hasIn  = !!rec?.checkIn
            const hasOut = !!rec?.checkOut
            const isApprv = !!rec?.checkoutApproved
            const isReqd  = !!rec?.checkoutRequested && !isApprv

            let dotColor = 'transparent'
            if (isApprv)     dotColor = '#2E7D5E'
            else if (isReqd) dotColor = '#D4860A'
            else if (hasIn)  dotColor = '#2C6E8A'

            return (
              <div key={cell.dateStr} style={{
                borderRadius: 9, overflow: 'hidden',
                border: isToday ? '2px solid #2C6E8A' : '1px solid var(--color-border)',
                background: isToday ? '#EAF4F9' : 'var(--color-bg)',
                minHeight: 64,
              }}>
                {/* Top color strip */}
                <div style={{ height: 4, background: dotColor }} />
                <div style={{ padding: '6px 7px' }}>
                  <div style={{
                    fontSize: 12, fontWeight: isToday ? 800 : 600,
                    color: isToday ? '#2C6E8A' : 'var(--color-text)',
                    marginBottom: 4,
                  }}>{cell.day}</div>
                  {rec ? (
                    <div style={{ fontSize: 10, lineHeight: 1.5, color: 'var(--color-muted)' }}>
                      {hasIn  && <div>🟢 {fmtTime(rec.checkIn)}</div>}
                      {hasOut && <div>🔴 {fmtTime(rec.checkOut)}</div>}
                      {!hasIn && !hasOut && <div style={{ color: 'var(--color-border)' }}>기록없음</div>}
                    </div>
                  ) : (
                    <div style={{ fontSize: 10, color: 'var(--color-border)' }}>—</div>
                  )}
                  {isApprv && <div style={{ fontSize: 9, color: '#2E7D5E', fontWeight: 700, marginTop: 2 }}>✓승인</div>}
                  {isReqd  && <div style={{ fontSize: 9, color: '#D4860A', fontWeight: 700, marginTop: 2 }}>⏳대기</div>}
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div style={{ marginTop: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[
            { color: '#2E7D5E', label: '퇴근 승인' },
            { color: '#D4860A', label: '퇴근 대기' },
            { color: '#2C6E8A', label: '출근 기록' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: l.color }} />
              <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* small nav arrow button */
const NavArrow: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      width: 30, height: 30, borderRadius: 8,
      border: '1px solid var(--color-border)', background: 'var(--color-bg)',
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--color-text)',
    }}
  >
    {children}
  </button>
)

/* ── Broadcast wrapper (keeps live sync) ── */
const AttendancePageWrapper: React.FC = () => {
  const dispatch = useAppDispatch()
  useEffect(() => {
    const unsub = broadcast.subscribe((msg: any) => {
      if (msg?.type?.startsWith('attendance')) hydrateFromStorage(dispatch)
    })
    return () => { if (typeof unsub === 'function') unsub() }
  }, [dispatch])
  return <AttendancePage />
}

export default AttendancePageWrapper
