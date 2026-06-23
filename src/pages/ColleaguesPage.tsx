import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { LuUsers, LuClock, LuTriangleAlert, LuCircleCheck, LuCoffee } from 'react-icons/lu'
import { useAppDispatch } from '../hooks/useAppDispatch'
import { useAppSelector } from '../hooks/useAppSelector'
import { setNurses } from '../store/slices/nursesSlice'
import { setPatients } from '../store/slices/patientsSlice'
import { computeStatus } from '../utils/attendanceStatus'
import { getNurseShiftToday, SHIFT_TIMES } from '../constants/shiftTimes'
import type { ShiftType } from '../types'

const STATUS_CONFIG = {
  BeforeShift: { label: '출근 전',  bg: '#EEF2FF', color: '#3F51B5', icon: LuClock },
  Active:      { label: '근무 중',  bg: '#E8F5EE', color: '#2E7D5E', icon: LuCircleCheck },
  OnBreak:     { label: '휴게 중',  bg: '#FEF3E2', color: '#D4860A', icon: LuCoffee },
  ShiftEnd:    { label: '근무 종료', bg: '#F0F4F7', color: '#8FA0B0', icon: LuClock },
}

const SHIFT_LABEL = { Day: '주간', Evening: '저녁', Night: '야간' }
const SHIFT_COLOR = { Day: '#2C6E8A', Evening: '#D4860A', Night: '#3F51B5' }

const ColleaguesPage: React.FC = () => {
  const dispatch = useAppDispatch()
  const nurses     = useAppSelector(s => s.nurses.allNurses)
  const patients   = useAppSelector(s => s.patients.allPatients)
  const attendance = useAppSelector(s => s.attendance.records)
  const now        = new Date()
  const todayKey   = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const assignsToday = useAppSelector(s => s.assignments.byDate[todayKey] ?? {})

  // 현재 월 근무표 행 (scheduleSlice)
  const scheduleKey  = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const scheduleRows = useAppSelector(s => s.schedule.saved[scheduleKey] ?? [])
  // 오늘 날짜 인덱스 (0-based)
  const dateIndex    = now.getDate() - 1

  useEffect(() => {
    const shouldFetchNurses   = nurses.length === 0
    const shouldFetchPatients = patients.length === 0
    if (!shouldFetchNurses && !shouldFetchPatients) return

    const fetches = [
      shouldFetchNurses   ? fetch('/api/nurses')   : Promise.resolve(null),
      shouldFetchPatients ? fetch('/api/patients') : Promise.resolve(null),
    ]
    Promise.all(fetches)
      .then(([nRes, pRes]) => Promise.all([
        nRes ? nRes.json() : Promise.resolve(null),
        pRes ? pRes.json() : Promise.resolve(null),
      ]))
      .then(([n, p]) => {
        if (n) dispatch(setNurses(n))
        if (p) dispatch(setPatients(p))
      })
      .catch(console.error)
  }, [dispatch, nurses.length, patients.length])

  const activeNurses = nurses.filter(n => n.role === 'Nurse')

  // 오늘 날짜 키 (todayKey 와 동일)
  const today = todayKey

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ padding: '22px 24px 60px' }}
    >
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LuUsers style={{ width: '20px', height: '20px', color: 'var(--color-primary)' }} />
          동료 현황
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '4px' }}>
          현재 병동 근무 중인 간호사 {activeNurses.filter(n => computeStatus(attendance, n, today, n.shiftType) === 'Active').length}명
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
        {activeNurses.map(nurse => {
          // 근무표에서 오늘 ShiftType 조회, 없으면 nurse.shiftType 으로 fallback
          const rawShift = getNurseShiftToday(nurse.id, scheduleRows, dateIndex, nurse.shiftType)
          const todayShiftType: ShiftType = rawShift === 'OFF' ? nurse.shiftType : rawShift

          const statusKey = computeStatus(attendance, nurse, today, todayShiftType)
          const cfg = STATUS_CONFIG[statusKey]
          const StatusIcon = cfg.icon
          const assignedCount = patients.filter(p => Object.values(assignsToday[p.id] ?? {}).includes(nurse.id)).length
          const isOT = nurse.overtimeHours >= 3

          // SHIFT_TIMES 기반 근무 시간
          return (
            <motion.div
              key={nurse.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                background: 'var(--color-surface)',
                borderRadius: '10px',
                boxShadow: '0 2px 12px rgba(44,110,138,.09)',
                padding: '18px 20px',
                borderLeft: `4px solid ${SHIFT_COLOR[todayShiftType]}`,
              }}
            >
              {/* 헤더 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '50%',
                    background: SHIFT_COLOR[todayShiftType],
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '14px', fontWeight: 700, flexShrink: 0,
                  }}>
                    {nurse.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>
                      {nurse.name}
                      {(nurse.yearsOfExperience ?? 99) <= 1 && (
                        <span style={{ marginLeft: '6px', fontSize: '10px', padding: '1px 6px', borderRadius: '6px', background: '#EBF4F8', color: '#2C6E8A', fontWeight: 600 }}>
                          신입
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-muted)' }}>{nurse.employeeId}</div>
                  </div>
                </div>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: cfg.bg, color: cfg.color }}>
                  <StatusIcon style={{ width: '12px', height: '12px' }} />
                  {cfg.label}
                </span>
              </div>

              {/* 근무조 / 시간 */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: `${SHIFT_COLOR[nurse.shiftType]}18`, color: SHIFT_COLOR[nurse.shiftType] }}>
                  {SHIFT_LABEL[nurse.shiftType]}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <LuClock style={{ width: '11px', height: '11px' }} />
                  {SHIFT_TIMES[todayShiftType].workStart} ~ {SHIFT_TIMES[todayShiftType].workEnd}
                </span>
              </div>

              {/* 통계 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--color-bg)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-muted)', marginBottom: '2px' }}>담당 환자</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-primary)' }}>{assignedCount}명</div>
                </div>
                <div style={{
                  padding: '8px 10px', borderRadius: '8px',
                  background: isOT ? '#FDECEA' : 'var(--color-bg)',
                }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-muted)', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    {isOT && <LuTriangleAlert style={{ width: '10px', height: '10px', color: '#C0392B' }} />}
                    예상 오버타임
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: isOT ? '#C0392B' : '#2E7D5E' }}>
                    {nurse.overtimeHours}h
                  </div>
                </div>
              </div>

              {/* 메모 */}
              {nurse.note && (
                <div style={{ marginTop: '10px', padding: '8px 10px', borderRadius: '7px', background: 'var(--color-bg)', fontSize: '11px', color: 'var(--color-muted)', lineHeight: 1.5 }}>
                  {nurse.note}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

export default ColleaguesPage
