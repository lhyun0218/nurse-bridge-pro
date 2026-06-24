import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  LuCircleCheck, LuClock, LuUsers, LuCalendar,
  LuChevronLeft, LuChevronRight, LuSearch, LuSun, LuSunset, LuMoon,
  LuLogIn, LuLogOut,
} from 'react-icons/lu'
import { useAppDispatch } from '../hooks/useAppDispatch'
import { useAppSelector } from '../hooks/useAppSelector'
import { approveCheckout, setLeaveStatus, setRecords } from '../store/slices/attendanceSlice'
import { addNotification } from '../store/slices/notificationsSlice'
import broadcast from '../utils/broadcast'
import { PERSIST_KEY } from '../store'

/* ── types ── */
interface AttendanceRecord {
  nurseId: string; date: string
  checkIn?: number; checkOut?: number
  checkoutRequested?: boolean; checkoutApproved?: boolean
  leaveRequested?: boolean; leaveStatus?: 'Pending' | 'Approved' | 'Denied'
  onBreak?: boolean; breakStart?: number; breakEnd?: number
  earlyLeaveReason?: string
}

/* ── shift meta ── */
const SHIFT_LABEL: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  Day:     { label: '데이',   icon: LuSun,    color: '#2C6E8A', bg: '#EAF4F9' },
  Evening: { label: '이브닝', icon: LuSunset, color: '#D4860A', bg: '#FEF3E2' },
  Night:   { label: '나이트', icon: LuMoon,   color: '#3F51B5', bg: '#EEF0FB' },
}

function fmtTime(ts?: number) {
  if (!ts) return '—'
  return new Date(ts).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

function hydrateFromStorage(dispatch: ReturnType<typeof useAppDispatch>) {
  try {
    const raw = localStorage.getItem(PERSIST_KEY)
    if (!raw) return
    const p = JSON.parse(raw)
    if (p?.attendance?.records) dispatch(setRecords(p.attendance.records))
  } catch (_) {}
}

/* ─────────────────────────────── */
/*  Main Component                 */
/* ─────────────────────────────── */
const HeadNurseAttendancePage: React.FC = () => {
  const dispatch = useAppDispatch()
  const records  = useAppSelector(s => s.attendance.records)
  const nurses   = useAppSelector(s => s.nurses.allNurses)

  const today = new Date().toISOString().slice(0, 10)

  /* tab: 'today' | 'all' */
  const [tab, setTab] = useState<'today' | 'all'>('today')
  /* filter */
  const [search, setSearch] = useState('')
  const [shiftFilter, setShiftFilter] = useState<'All' | 'Day' | 'Evening' | 'Night'>('All')

  /* calendar nav */
  const now = new Date()
  const [calYear,  setCalYear]  = useState(now.getFullYear())
  const [calMonth, setCalMonth] = useState(now.getMonth())

  /* ── derived data ── */
  const todayRecords = useMemo(() =>
    records.filter(r => r.date === today), [records, today])

  const pendingRequests = useMemo(() =>
    records.filter(r => r.checkoutRequested && !r.checkoutApproved), [records])

  /* enrich records with nurse info */
  const enriched = useMemo(() => {
    const base = tab === 'today' ? todayRecords : records
    return base
      .map(r => {
        const nurse = nurses.find(n => n.id === r.nurseId)
        return { ...r, nurseName: nurse?.name ?? r.nurseId, shiftType: nurse?.shiftType ?? 'Day' }
      })
      .filter(r => {
        const matchName  = !search || r.nurseName.includes(search)
        const matchShift = shiftFilter === 'All' || r.shiftType === shiftFilter
        return matchName && matchShift
      })
      .sort((a, b) => {
        // pending first
        const aP = a.checkoutRequested && !a.checkoutApproved ? 0 : 1
        const bP = b.checkoutRequested && !b.checkoutApproved ? 0 : 1
        return aP - bP || a.nurseName.localeCompare(b.nurseName)
      })
  }, [tab, todayRecords, records, nurses, search, shiftFilter])

  /* ── summary stats for today ── */
  const stats = useMemo(() => {
    const activeNurses = nurses.filter(n => n.role === 'Nurse')
    const checkedIn    = todayRecords.filter(r => r.checkIn).length
    const pending      = pendingRequests.length
    const approved     = todayRecords.filter(r => r.checkoutApproved).length
    return { total: activeNurses.length, checkedIn, pending, approved }
  }, [nurses, todayRecords, pendingRequests])

  const handleApprove = (r: AttendanceRecord) => {
    dispatch(approveCheckout({ nurseId: r.nurseId, date: r.date }))
    const nurse = nurses.find(n => n.id === r.nurseId)
    const nid = `notif-approved-${Date.now()}`
    dispatch(addNotification({
      id: nid, type: 'info', title: '퇴근 승인',
      message: `${nurse?.name ?? r.nurseId}님의 퇴근을 승인했습니다.`,
      timestamp: Date.now(),
    }))
    // 다른 탭(간호사)에게만 broadcast — 같은 탭은 addNotification으로 이미 처리
    broadcast.send('attendance:approve', { nurseId: r.nurseId, date: r.date, notifId: nid })
  }

  const handleBulkApprove = () => {
    pendingRequests.forEach(r => handleApprove(r))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      style={{ padding: '22px 24px 60px', maxWidth: 1100, margin: '0 auto' }}
    >
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--color-text)' }}>근태 관리</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-muted)' }}>
            {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
        </div>
        {pendingRequests.length > 0 && (
          <button
            onClick={handleBulkApprove}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 16px', borderRadius: 9, border: 'none',
              background: '#2E7D5E', color: '#fff',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            <LuCircleCheck style={{ width: 15, height: 15 }} />
            일괄 승인 ({pendingRequests.length}건)
          </button>
        )}
      </div>

      {/* ── Summary stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 26 }}>
        {[
          { label: '전체 간호사',  value: stats.total,     icon: LuUsers,        color: '#2C6E8A', bg: '#EAF4F9' },
          { label: '오늘 출근',    value: stats.checkedIn,  icon: LuLogIn,        color: '#2E7D5E', bg: '#E8F5EE' },
          { label: '퇴근 요청',   value: stats.pending,    icon: LuClock,        color: '#D4860A', bg: '#FEF3E2' },
          { label: '퇴근 승인',   value: stats.approved,   icon: LuCircleCheck, color: 'var(--color-muted)', bg: 'var(--color-bg)' },
        ].map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} style={{
              padding: '16px 18px', borderRadius: 12,
              background: s.bg, border: `1px solid ${s.color}20`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <Icon style={{ width: 18, height: 18, color: s.color }} />
                <span style={{ fontSize: 11, color: s.color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  {s.label}
                </span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>명</div>
            </div>
          )
        })}
      </div>


      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'var(--color-bg)', borderRadius: 10, padding: 4, width: 'fit-content', border: '1px solid var(--color-border)' }}>
        {([['today', '오늘 기록'], ['all', '전체 기록']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: '7px 18px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600,
              background: tab === key ? 'var(--color-surface)' : 'transparent',
              color: tab === key ? 'var(--color-text)' : 'var(--color-muted)',
              cursor: 'pointer', boxShadow: tab === key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {label}
            {key === 'today' && pendingRequests.length > 0 && (
              <span style={{
                marginLeft: 6, fontSize: 10, fontWeight: 800,
                background: '#D4860A', color: '#fff',
                borderRadius: 10, padding: '1px 6px',
              }}>{pendingRequests.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {/* search */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <LuSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--color-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="간호사 이름 검색"
            style={{
              paddingLeft: 30, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
              borderRadius: 8, border: '1px solid var(--color-border)',
              background: 'var(--color-surface)', fontSize: 13, color: 'var(--color-text)',
              outline: 'none', width: 180,
            }}
          />
        </div>

        {/* shift filter */}
        <div style={{ display: 'flex', gap: 6 }}>
          {(['All', 'Day', 'Evening', 'Night'] as const).map(s => {
            const meta = s === 'All' ? null : SHIFT_LABEL[s]
            return (
              <button
                key={s}
                onClick={() => setShiftFilter(s)}
                style={{
                  padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  border: `1.5px solid ${shiftFilter === s ? (meta?.color ?? '#2C6E8A') : 'var(--color-border)'}`,
                  background: shiftFilter === s ? (meta?.bg ?? '#EAF4F9') : 'var(--color-surface)',
                  color: shiftFilter === s ? (meta?.color ?? '#2C6E8A') : 'var(--color-muted)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {s === 'All' ? '전체' : meta?.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Records list ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 36 }}>
        {enriched.length === 0 && (
          <div style={{
            padding: '48px 24px', textAlign: 'center',
            background: 'var(--color-surface)', borderRadius: 12, border: '1px solid var(--color-border)',
            color: 'var(--color-muted)', fontSize: 14,
          }}>
            해당하는 기록이 없습니다
          </div>
        )}
        {enriched.map(r => {
          const meta     = SHIFT_LABEL[r.shiftType] ?? SHIFT_LABEL.Day
          const ShiftIcon = meta.icon
          const isPending  = !!r.checkoutRequested && !r.checkoutApproved
          const isApproved = !!r.checkoutApproved
          const hasLeave   = !!r.leaveRequested && r.leaveStatus === 'Pending'

          return (
            <div
              key={`${r.nurseId}-${r.date}`}
              style={{
                display: 'grid', gridTemplateColumns: 'auto 1fr auto',
                alignItems: 'center', gap: 16,
                padding: '16px 20px', borderRadius: 12,
                background: 'var(--color-surface)',
                border: isPending ? '1.5px solid #D4860A40' : '1px solid var(--color-border)',
                boxShadow: isPending ? '0 2px 12px rgba(212,134,10,0.10)' : '0 1px 4px rgba(0,0,0,0.04)',
                transition: 'box-shadow 0.15s',
              }}
            >
              {/* Shift avatar */}
              <div style={{
                width: 44, height: 44, borderRadius: 11,
                background: meta.bg, border: `1.5px solid ${meta.color}30`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <ShiftIcon style={{ width: 18, height: 18, color: meta.color }} />
                <div style={{ fontSize: 9, color: meta.color, fontWeight: 700, marginTop: 1 }}>{meta.label}</div>
              </div>

              {/* Info */}
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)' }}>{r.nurseName}</span>
                  <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>{r.date}</span>
                  {isPending && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px',
                      borderRadius: 8, background: '#FEF3E2', color: '#D4860A',
                    }}>퇴근 요청 대기</span>
                  )}
                  {isApproved && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px',
                      borderRadius: 8, background: '#E8F5EE', color: '#2E7D5E',
                    }}>퇴근 승인됨</span>
                  )}
                  {r.leaveStatus === 'Approved' && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px',
                      borderRadius: 8, background: '#EEF0FB', color: '#3F51B5',
                    }}>휴가 승인됨</span>
                  )}
                  {r.leaveStatus === 'Denied' && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px',
                      borderRadius: 8, background: '#FDECEA', color: '#C0392B',
                    }}>휴가 거절됨</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                  <TimeItem icon={LuLogIn}  label="출근" value={fmtTime(r.checkIn)} />
                  {r.breakStart && (
                    <TimeItem
                      icon={LuClock}
                      label="휴게"
                      value={r.breakEnd ? `${fmtTime(r.breakStart)}~${fmtTime(r.breakEnd)}` : `${fmtTime(r.breakStart)} 중`}
                    />
                  )}
                  <TimeItem icon={LuLogOut} label="퇴근" value={fmtTime(r.checkOut)} />
                  {r.checkoutRequested && (
                    <TimeItem icon={LuClock} label="퇴근신청" value={r.checkoutApproved ? '승인됨' : '대기 중'} highlight={isPending} />
                  )}
                </div>
                {isPending && r.earlyLeaveReason && (
                  <div style={{
                    marginTop: 6, fontSize: 12, color: '#D4860A',
                    background: '#FEF3E2', borderRadius: 6, padding: '4px 10px',
                    display: 'inline-block', maxWidth: '100%',
                  }}>
                    💬 조기퇴근 사유: {r.earlyLeaveReason}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {isPending && (
                  <button
                    onClick={() => handleApprove(r)}
                    style={{
                      padding: '8px 16px', borderRadius: 8, border: 'none',
                      background: '#2E7D5E', color: '#fff',
                      fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <LuCircleCheck style={{ width: 14, height: 14 }} />
                    퇴근 승인
                  </button>
                )}
                {hasLeave && (
                  <>
                    <button
                      onClick={() => dispatch(setLeaveStatus({ nurseId: r.nurseId, date: r.date, status: 'Approved' }))}
                      style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#3F51B5', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      휴가 승인
                    </button>
                    <button
                      onClick={() => dispatch(setLeaveStatus({ nurseId: r.nurseId, date: r.date, status: 'Denied' }))}
                      style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'transparent', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: 'var(--color-text)' }}
                    >
                      거절
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Monthly calendar overview ── */}
      <MonthlyOverview
        records={records}
        nurses={nurses.filter(n => n.role === 'Nurse')}
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

/* ── small helpers ── */
const TimeItem: React.FC<{ icon: React.ElementType; label: string; value: string; highlight?: boolean }> =
  ({ icon: Icon, label, value, highlight }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <Icon style={{ width: 13, height: 13, color: highlight ? '#D4860A' : 'var(--color-muted)' }} />
      <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: highlight ? '#D4860A' : 'var(--color-text)' }}>{value}</span>
    </div>
  )

/* ── Monthly overview calendar ── */
interface MonthlyOverviewProps {
  records: AttendanceRecord[]
  nurses: Array<{ id: string; name: string; shiftType: string }>
  year: number
  month: number
  onPrev: () => void
  onNext: () => void
}

const MonthlyOverview: React.FC<MonthlyOverviewProps> = ({ records, nurses, year, month, onPrev, onNext }) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthLabel  = new Date(year, month, 1).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })

  const days = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = String(i + 1).padStart(2, '0')
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${d}`
      const dayRecs = records.filter(r => r.date === dateStr)
      const checkedIn  = dayRecs.filter(r => r.checkIn).length
      const approved   = dayRecs.filter(r => r.checkoutApproved).length
      const pending    = dayRecs.filter(r => r.checkoutRequested && !r.checkoutApproved).length
      return { day: i + 1, dateStr, checkedIn, approved, pending }
    })
  }, [records, year, month, daysInMonth])

  const today    = new Date().toISOString().slice(0, 10)
  const startDay = new Date(year, month, 1).getDay()

  return (
    <div style={{ background: 'var(--color-surface)', borderRadius: 14, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', borderBottom: '1px solid var(--color-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <LuCalendar style={{ width: 18, height: 18, color: 'var(--color-muted)' }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)' }}>월별 근태 현황</span>
          <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>{monthLabel} · {nurses.length}명</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <NavArrow onClick={onPrev}><LuChevronLeft style={{ width: 16, height: 16 }} /></NavArrow>
          <NavArrow onClick={onNext}><LuChevronRight style={{ width: 16, height: 16 }} /></NavArrow>
        </div>
      </div>

      <div style={{ padding: '14px 16px 20px', overflowX: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', minWidth: 600, marginBottom: 8 }}>
          {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
            <div key={d} style={{
              textAlign: 'center', fontSize: 11, fontWeight: 700, padding: '6px 0',
              color: i === 0 ? '#C0392B' : i === 6 ? '#2C6E8A' : 'var(--color-muted)',
            }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5, minWidth: 600 }}>
          {Array.from({ length: startDay }, (_, i) => <div key={`e-${i}`} />)}
          {days.map(cell => {
            const isToday = cell.dateStr === today
            return (
              <div key={cell.dateStr} style={{
                borderRadius: 9, minHeight: 72, overflow: 'hidden',
                border: isToday ? '2px solid #2C6E8A' : '1px solid var(--color-border)',
                background: isToday ? '#EAF4F9' : 'var(--color-bg)',
              }}>
                {/* top strip */}
                <div style={{
                  height: 4,
                  background: cell.pending > 0 ? '#D4860A' : cell.approved > 0 ? '#2E7D5E' : cell.checkedIn > 0 ? '#2C6E8A' : 'transparent',
                }} />
                <div style={{ padding: '6px 7px' }}>
                  <div style={{
                    fontSize: 12, fontWeight: isToday ? 800 : 600,
                    color: isToday ? '#2C6E8A' : 'var(--color-text)', marginBottom: 4,
                  }}>{cell.day}</div>
                  <div style={{ fontSize: 10, color: 'var(--color-muted)', lineHeight: 1.6 }}>
                    {cell.checkedIn > 0  && <div>🟢 출근 {cell.checkedIn}명</div>}
                    {cell.pending > 0    && <div style={{ color: '#D4860A' }}>⏳ 대기 {cell.pending}건</div>}
                    {cell.approved > 0   && <div style={{ color: '#2E7D5E' }}>✓ 승인 {cell.approved}명</div>}
                    {cell.checkedIn === 0 && cell.pending === 0 && cell.approved === 0 && (
                      <div style={{ color: 'var(--color-border)' }}>—</div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const NavArrow: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <button onClick={onClick} style={{
    width: 30, height: 30, borderRadius: 8,
    border: '1px solid var(--color-border)', background: 'var(--color-bg)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--color-text)',
  }}>
    {children}
  </button>
)

/* ── Broadcast wrapper ── */
const HeadNurseAttendancePageWrapper: React.FC = () => {
  const dispatch = useAppDispatch()
  useEffect(() => {
    const unsub = broadcast.subscribe((msg: any) => {
      if (msg?.type?.startsWith('attendance')) hydrateFromStorage(dispatch)
    })
    return () => { if (typeof unsub === 'function') unsub() }
  }, [dispatch])
  return <HeadNurseAttendancePage />
}

export default HeadNurseAttendancePageWrapper
