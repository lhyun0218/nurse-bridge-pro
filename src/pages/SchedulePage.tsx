import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { LuDownload, LuFileSpreadsheet, LuWand } from 'react-icons/lu'
import { useAppSelector } from '../hooks/useAppSelector'
import { exportScheduleToExcel } from '../utils/exportScheduleExcel'
import type { ShiftType } from '../types'

// ── 타입 ──────────────────────────────────────────────────────────────────
interface DaySchedule {
  date: number
  shift: ShiftType | 'Off'
  overtimeHours?: number
}

// ── 색상 / 레이블 매핑 ─────────────────────────────────────────────────────
const SHIFT_CONFIG: Record<ShiftType | 'Off', { label: string; bg: string; color: string; border: string }> = {
  Day:     { label: 'D',  bg: 'rgba(44,110,138,0.12)',  color: '#2C6E8A', border: '#2C6E8A' },
  Evening: { label: 'E',  bg: 'rgba(212,134,10,0.12)',  color: '#D4860A', border: '#D4860A' },
  Night:   { label: 'N',  bg: 'rgba(63,81,181,0.12)',   color: '#3F51B5', border: '#3F51B5' },
  Off:     { label: '휴', bg: 'rgba(107,128,144,0.08)', color: '#6B8090', border: 'transparent' },
}

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}

// ── 컴포넌트 ──────────────────────────────────────────────────────────────
const SchedulePage: React.FC = () => {
  const currentUser = useAppSelector(s => s.auth.currentUser)
  const allNurses = useAppSelector(s => s.nurses.allNurses)

  // 현재 표시 중인 연/월 (기본: 현재 달)
  const today = new Date()
  const [viewYear,  setViewYear]  = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1)   // 1-indexed

  // 간호사 선택 — null이면 currentUser 기준으로 자동 결정 (타이밍 이슈 원천 차단)
  const [overrideNurseId, setOverrideNurseId] = useState<string | null>(null)

  // currentUser가 HeadNurse(N006)이면 근무표에 없으므로 첫 번째 Nurse로 자동 선택
  const nurseList = allNurses.filter(n => n.role === 'Nurse')
  const defaultNurseId = currentUser?.role === 'Nurse'
    ? currentUser.id
    : (nurseList[0]?.id ?? 'N001')
  const selectedNurseId = overrideNurseId ?? defaultNurseId

  const selectedNurse = allNurses.find(n => n.id === selectedNurseId) ?? { id: selectedNurseId, name: currentUser?.name ?? '이현규', status: 'OnBreak' as const }
  const nurseName = selectedNurse.name
  

  const savedSchedules = useAppSelector(s => s.schedule.saved)
  const scheduleKey = `${viewYear}-${String(viewMonth).padStart(2, '0')}`
  const monthSchedule = savedSchedules[scheduleKey] ?? null
  const selectedRow = monthSchedule?.find(r => r.nurseId === selectedNurseId) ?? null
  const schedule: DaySchedule[] = selectedRow
    ? selectedRow.shifts.map((shift, index) => ({
        date: index + 1,
        shift: shift === 'OFF' ? 'Off' : shift === 'D' ? 'Day' : shift === 'E' ? 'Evening' : 'Night',
        overtimeHours: 0,
      } as DaySchedule))
    : []

  // ── 통계 계산 ──────────────────────────────────────────────────────────
  const workDays = schedule.filter(d => d.shift !== 'Off').length
  const dayShifts = schedule.filter(d => d.shift === 'Day').length
  const eveningShifts = schedule.filter(d => d.shift === 'Evening').length
  const nightShifts = schedule.filter(d => d.shift === 'Night').length
  const totalOvertime = schedule.reduce((sum, d) => sum + (d.overtimeHours ?? 0), 0)
  const overtimeDays = schedule.filter(d => (d.overtimeHours ?? 0) > 0).length

  // ── 캘린더 그리드 계산 ─────────────────────────────────────────────────
  // 해당 월 1일의 요일 (0=일, 6=토)
  const firstDayOfWeek = new Date(viewYear, viewMonth - 1, 1).getDay()
  const daysInMonth    = new Date(viewYear, viewMonth, 0).getDate()

  // 앞 빈칸 + 날짜 셀 배열
  const calendarCells: (DaySchedule | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...schedule,
  ]

  // 오늘 날짜 (하이라이트용)
  const isCurrentMonth = today.getFullYear() === viewYear && today.getMonth() + 1 === viewMonth
  const todayDate = today.getDate()

  // ── 월 이동 ────────────────────────────────────────────────────────────
  const prevMonth = () => {
    if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1) }
    else setViewMonth(m => m + 1)
  }

  // ── 스타일 헬퍼 ────────────────────────────────────────────────────────
  const cardStyle: React.CSSProperties = {
    background: 'var(--color-surface)',
    borderRadius: '10px',
    boxShadow: '0 2px 12px rgba(44,110,138,.08)',
    padding: '20px',
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.3 }}
      style={{ padding: '22px 24px 60px' }}
    >
      {/* ── 헤더 ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
            🗓️ 근무 일정
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '4px' }}>
            간호사별 월별 근무 스케줄
          </p>
        </div>

        {/* 간호사 선택 드롭다운 */}
        {allNurses.length > 0 && (
          <select
            value={selectedNurseId}
            onChange={(e) => setOverrideNurseId(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1.5px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              marginRight: '12px',
              minWidth: '150px',
            }}
          >
            {allNurses.filter(n => n.role === 'Nurse').map(nurse => (
              <option key={nurse.id} value={nurse.id}>
                {nurse.name} {nurse.shiftType ? `(${nurse.shiftType})` : ''}
              </option>
            ))}
          </select>
        )}

        {/* Excel 내보내기 버튼 */}
        <button
          onClick={() => exportScheduleToExcel(schedule, viewYear, viewMonth, nurseName)}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '9px 16px',
            borderRadius: '8px',
            border: '1.5px solid #2E7D5E',
            background: '#E8F5EE',
            color: '#2E7D5E',
            fontSize: '13px', fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s',
            flexShrink: 0,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#2E7D5E'
            e.currentTarget.style.color = '#fff'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#E8F5EE'
            e.currentTarget.style.color = '#2E7D5E'
          }}
          title="이번 달 근무표를 Excel 파일로 저장"
        >
          <LuFileSpreadsheet style={{ width: '16px', height: '16px' }} />
          Excel 내보내기
          <LuDownload style={{ width: '14px', height: '14px', opacity: 0.7 }} />
        </button>
      </div>

      {/* ── 통계 요약 카드 ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        marginBottom: '20px',
      }}>
        {/* 총 근무일 */}
        <div style={{ ...cardStyle, borderTop: '3px solid #2C6E8A' }}>
          <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginBottom: '6px' }}>총 근무일</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#2C6E8A' }}>{workDays}일</div>
          <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginTop: '3px' }}>
            D {dayShifts} · E {eveningShifts} · N {nightShifts}
          </div>
        </div>

        {/* 야간 근무 */}
        <div style={{ ...cardStyle, borderTop: '3px solid #3F51B5' }}>
          <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginBottom: '6px' }}>야간 근무</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#3F51B5' }}>{nightShifts}회</div>
          <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginTop: '3px' }}>
            이번 달 Night 근무
          </div>
        </div>

        {/* 오버타임 합계 */}
        <div style={{ ...cardStyle, borderTop: `3px solid ${totalOvertime > 0 ? '#C0392B' : '#2E7D5E'}` }}>
          <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginBottom: '6px' }}>오버타임 합계</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: totalOvertime > 0 ? '#C0392B' : '#2E7D5E' }}>
            {totalOvertime.toFixed(1)}h
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginTop: '3px' }}>
            {overtimeDays}일 발생
          </div>
        </div>

        {/* 휴무일 */}
        <div style={{ ...cardStyle, borderTop: '3px solid #2E7D5E' }}>
          <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginBottom: '6px' }}>휴무일</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#2E7D5E' }}>
            {daysInMonth - workDays}일
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginTop: '3px' }}>
            이번 달 Off
          </div>
        </div>
      </div>

      {/* ── 근무표 미생성 안내 (월 네비게이션 포함) ── */}
      {!selectedRow && (
        <div style={{ ...cardStyle, marginBottom: '16px' }}>
          {/* 월 네비게이션 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <button
              onClick={prevMonth}
              style={{
                background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                borderRadius: '8px', padding: '6px 14px', cursor: 'pointer',
                fontSize: '14px', color: 'var(--color-text)', transition: 'background 0.15s',
              }}
              aria-label="이전 달"
            >‹</button>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
              {viewYear}년 {viewMonth}월
            </h3>
            <button
              onClick={nextMonth}
              style={{
                background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                borderRadius: '8px', padding: '6px 14px', cursor: 'pointer',
                fontSize: '14px', color: 'var(--color-text)', transition: 'background 0.15s',
              }}
              aria-label="다음 달"
            >›</button>
          </div>
          {/* 미생성 안내 */}
          <div style={{ textAlign: 'center', padding: '24px 0 8px' }}>
            <LuWand style={{ width: '36px', height: '36px', margin: '0 auto 12px', color: 'var(--color-border)', display: 'block' }} />
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '6px' }}>
              {viewYear}년 {viewMonth}월 근무표가 아직 생성되지 않았습니다
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
              수간호사 페이지 → 근무표 자동 생성에서 생성하면 여기에 표시됩니다
            </div>
          </div>
        </div>
      )}

      {/* ── 캘린더 카드 ── */}
      {selectedRow && <div style={cardStyle}>
        {/* 월 네비게이션 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}>
          <button
            onClick={prevMonth}
            style={{
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '6px 14px',
              cursor: 'pointer',
              fontSize: '14px',
              color: 'var(--color-text)',
              transition: 'background 0.15s',
            }}
            aria-label="이전 달"
          >
            ‹
          </button>

          <h3 style={{
            fontSize: '16px',
            fontWeight: 700,
            color: 'var(--color-text)',
            margin: 0,
          }}>
            {viewYear}년 {viewMonth}월
          </h3>

          <button
            onClick={nextMonth}
            style={{
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '6px 14px',
              cursor: 'pointer',
              fontSize: '14px',
              color: 'var(--color-text)',
              transition: 'background 0.15s',
            }}
            aria-label="다음 달"
          >
            ›
          </button>
        </div>

        {/* 범례 */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '14px',
          flexWrap: 'wrap',
        }}>
          {(['Day', 'Evening', 'Night', 'Off'] as const).map(shift => {
            const cfg = SHIFT_CONFIG[shift]
            return (
              <div key={shift} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{
                  display: 'inline-block',
                  width: '20px',
                  height: '20px',
                  borderRadius: '5px',
                  background: cfg.bg,
                  border: `1.5px solid ${cfg.border}`,
                  textAlign: 'center',
                  lineHeight: '18px',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: cfg.color,
                }}>
                  {cfg.label}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                  {shift === 'Day' ? '주간 (06~15시)' :
                   shift === 'Evening' ? '저녁 (14~23시)' :
                   shift === 'Night' ? '야간 (22~07시)' : '휴무'}
                </span>
              </div>
            )
          })}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#C0392B',
            }} />
            <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>오버타임</span>
          </div>
        </div>

        {/* 요일 헤더 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '6px',
          marginBottom: '6px',
        }}>
          {WEEKDAY_LABELS.map((day, i) => (
            <div
              key={day}
              style={{
                textAlign: 'center',
                fontSize: '12px',
                fontWeight: 700,
                color: i === 0 ? '#C0392B' : i === 6 ? '#2C6E8A' : 'var(--color-muted)',
                padding: '6px 0',
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 셀 그리드 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '6px',
        }}>
          {calendarCells.map((cell, idx) => {
            if (!cell) {
              return (
                <div
                  key={`empty-${idx}`}
                  style={{ minHeight: '72px' }}
                />
              )
            }

            const cfg = SHIFT_CONFIG[cell.shift]
            const isToday = isCurrentMonth && cell.date === todayDate
            const colInWeek = (firstDayOfWeek + cell.date - 1) % 7
            const isSunday = colInWeek === 0
            const isSaturday = colInWeek === 6

            return (
              <div
                key={cell.date}
                style={{
                  position: 'relative',
                  borderRadius: '8px',
                  padding: '8px 6px',
                  background: isToday ? 'rgba(44,110,138,0.07)' : 'var(--color-bg)',
                  border: isToday ? '1.5px solid #2C6E8A' : '1.5px solid var(--color-border)',
                  textAlign: 'center',
                  minHeight: '72px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  gap: '6px',
                }}
              >
                {/* 날짜 숫자 */}
                <span style={{
                  fontSize: '13px',
                  fontWeight: isToday ? 700 : 500,
                  color: isToday
                    ? '#2C6E8A'
                    : isSunday
                    ? '#C0392B'
                    : isSaturday
                    ? '#2C6E8A'
                    : 'var(--color-text)',
                  lineHeight: 1,
                }}>
                  {cell.date}
                </span>

                {/* 근무 배지 */}
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '30px',
                  height: '30px',
                  borderRadius: '7px',
                  background: cfg.bg,
                  border: cell.shift !== 'Off' ? `1.5px solid ${cfg.border}` : 'none',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: cfg.color,
                }}>
                  {cfg.label}
                </span>

                {/* 오버타임 빨간 점 */}
                {(cell.overtimeHours ?? 0) > 0 && (
                  <span
                    title={`오버타임 ${cell.overtimeHours}h`}
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: '#C0392B',
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>}

      {/* ── 이번 달 근무 상세 리스트 ── */}
      {selectedRow && (
      <div style={{ ...cardStyle, marginTop: '16px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 14px' }}>
          📋 이번 달 근무 상세
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {schedule
            .filter(d => d.shift !== 'Off')
            .map(d => {
              const cfg = SHIFT_CONFIG[d.shift]
              const dayOfWeek = new Date(viewYear, viewMonth - 1, d.date).getDay()
              const weekdayLabel = WEEKDAY_LABELS[dayOfWeek]
              const shiftTime =
                d.shift === 'Day'     ? '06:00 ~ 15:00' :
                d.shift === 'Evening' ? '14:00 ~ 23:00' :
                                        '22:00 ~ 07:00'
              return (
                <div
                  key={d.date}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {/* 날짜 */}
                  <span style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: dayOfWeek === 0 ? '#C0392B' : dayOfWeek === 6 ? '#2C6E8A' : 'var(--color-text)',
                    minWidth: '52px',
                  }}>
                    {viewMonth}/{d.date} ({weekdayLabel})
                  </span>

                  {/* 근무 배지 */}
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '5px',
                    background: cfg.bg,
                    border: `1px solid ${cfg.border}`,
                    fontSize: '11px',
                    fontWeight: 700,
                    color: cfg.color,
                    minWidth: '52px',
                    textAlign: 'center',
                  }}>
                    {d.shift === 'Day' ? '주간' : d.shift === 'Evening' ? '저녁' : '야간'}
                  </span>

                  {/* 시간 */}
                  <span style={{ fontSize: '12px', color: 'var(--color-muted)', flex: 1 }}>
                    {shiftTime}
                  </span>

                  {/* 오버타임 */}
                  {(d.overtimeHours ?? 0) > 0 && (
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#C0392B',
                      background: 'rgba(192,57,43,0.08)',
                      padding: '2px 7px',
                      borderRadius: '4px',
                    }}>
                      OT +{d.overtimeHours}h
                    </span>
                  )}
                </div>
              )
            })}
        </div>
      </div>
      )}
    </motion.div>
  )
}

export default SchedulePage
