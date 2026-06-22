import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  LuWand, LuDownload, LuFileSpreadsheet, LuRefreshCw,
  LuTriangleAlert, LuCircleCheck, LuInfo,
} from 'react-icons/lu'
import { useAppDispatch } from '../hooks/useAppDispatch'
import { useAppSelector } from '../hooks/useAppSelector'
import {
  generateSchedule,
  SHIFT_LABEL,
  SHIFT_COLOR,
  type ShiftCode,
  type NurseScheduleRow,
  type GenerateOptions,
} from '../utils/scheduleGenerator'
import { saveSchedule } from '../store/slices/scheduleSlice'
import generateAssignmentsForMonth from '../store/thunks/assignmentsThunks'
import { exportAllNursesScheduleToExcel } from '../utils/exportScheduleExcel'

const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토']

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

const ScheduleGeneratorPage: React.FC = () => {
  const dispatch = useAppDispatch()
  const nurses = useAppSelector(s => s.nurses.allNurses).filter(n => n.role === 'Nurse')

  const now = new Date()
  const [year,  setYear]  = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1) // 현재 달
  const savedSchedule = useAppSelector(s => s.schedule.saved[`${year}-${String(month).padStart(2, '0')}`] ?? null)

  // 제약조건 설정
  const [opts, setOpts] = useState<Partial<GenerateOptions>>({
    minPerShift:       1,
    maxNightPerMonth:  8,
    maxConsecWork:     5,
    minRestAfterNight: 2,
  })

  const [schedule, setSchedule] = useState<NurseScheduleRow[] | null>(savedSchedule)
  const [isGenerated, setIsGenerated] = useState(Boolean(savedSchedule))

  useEffect(() => {
    setSchedule(savedSchedule)
    setIsGenerated(Boolean(savedSchedule))
  }, [savedSchedule, year, month])

  const days = useMemo(() => daysInMonth(year, month), [year, month])

  // 자동 생성
  const handleGenerate = () => {
    const result = generateSchedule(
      nurses.map(n => ({ id: n.id, name: n.name })),
      { year, month, ...opts },
    )
    setSchedule(result)
    setIsGenerated(true)
    dispatch(saveSchedule({ year, month, rows: result }))
    dispatch(generateAssignmentsForMonth(year, month, opts.minPerShift ?? 1))
  }

  // 셀 클릭으로 교대 순환 변경
  const handleCellClick = (nurseIdx: number, dayIdx: number) => {
    if (!schedule) return
    const cycle: ShiftCode[] = ['D', 'E', 'N', 'OFF']
    const current = schedule[nurseIdx].shifts[dayIdx]
    const nextIdx = (cycle.indexOf(current) + 1) % cycle.length
    const next    = cycle[nextIdx]

    const updated = schedule.map((row, i) => {
      if (i !== nurseIdx) return row
      const newShifts = [...row.shifts]
      newShifts[dayIdx] = next
      const stats = {
        dayCount:     newShifts.filter(s => s === 'D').length,
        eveningCount: newShifts.filter(s => s === 'E').length,
        nightCount:   newShifts.filter(s => s === 'N').length,
        offCount:     newShifts.filter(s => s === 'OFF').length,
        weekendWork:  newShifts.filter((s, idx) => {
          const dow = new Date(year, month - 1, idx + 1).getDay()
          return s !== 'OFF' && (dow === 0 || dow === 6)
        }).length,
        overtimeRisk: newShifts.filter(s => s !== 'OFF').length > 22,
      }
      return { ...row, shifts: newShifts, stats }
    })
    setSchedule(updated)
    dispatch(saveSchedule({ year, month, rows: updated }))
    dispatch(generateAssignmentsForMonth(year, month, opts.minPerShift ?? 1))
  }

  // Excel 내보내기
  const handleExport = () => {
    if (!schedule) return
    const allSchedules = schedule.map(row => ({
      nurseId:   row.nurseId,
      nurseName: row.nurseName,
      schedule: row.shifts.map((shift, i) => ({
        date:  i + 1,
        shift: shift === 'D' ? 'Day' : shift === 'E' ? 'Evening' : shift === 'N' ? 'Night' : 'Off' as any,
      })),
    }))
    exportAllNursesScheduleToExcel(allSchedules, year, month)
  }

  // 날짜 헤더 색상
  const headerColor = (dayIdx: number) => {
    const dow = new Date(year, month - 1, dayIdx + 1).getDay()
    return dow === 0 ? '#C0392B' : dow === 6 ? '#2C6E8A' : 'var(--color-muted)'
  }

  const cardStyle: React.CSSProperties = {
    background: 'var(--color-surface)',
    borderRadius: '10px',
    boxShadow: '0 2px 12px rgba(44,110,138,.08)',
    padding: '20px',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ padding: '22px 24px 60px' }}
    >
      {/* 헤더 */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
          ✨ 근무표 자동 생성
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '4px' }}>
          제약조건을 설정하고 자동으로 균형잡힌 근무표를 생성합니다
        </p>
      </div>

      {/* 설정 카드 */}
      <div style={{ ...cardStyle, marginBottom: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>

          {/* 연/월 */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', display: 'block', marginBottom: '6px' }}>
              대상 연월
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="number"
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                style={{
                  width: '80px', padding: '8px 10px', borderRadius: '8px',
                  border: '1.5px solid var(--color-border)',
                  background: 'var(--color-bg)', color: 'var(--color-text)',
                  fontSize: '13px', outline: 'none',
                }}
              />
              <select
                value={month}
                onChange={e => setMonth(Number(e.target.value))}
                style={{
                  padding: '8px 10px', borderRadius: '8px',
                  border: '1.5px solid var(--color-border)',
                  background: 'var(--color-bg)', color: 'var(--color-text)',
                  fontSize: '13px', outline: 'none', cursor: 'pointer',
                }}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}월</option>
                ))}
              </select>
            </div>
          </div>

          {/* 교대당 최소 인원 */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', display: 'block', marginBottom: '6px' }}>
              교대당 최소 인원
            </label>
            <input
              type="number" min={1} max={5}
              value={opts.minPerShift}
              onChange={e => setOpts(o => ({ ...o, minPerShift: Number(e.target.value) }))}
              style={{
                width: '80px', padding: '8px 10px', borderRadius: '8px',
                border: '1.5px solid var(--color-border)',
                background: 'var(--color-bg)', color: 'var(--color-text)',
                fontSize: '13px', outline: 'none',
              }}
            />
          </div>

          {/* 월간 최대 야간 */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', display: 'block', marginBottom: '6px' }}>
              월간 최대 야간 횟수
            </label>
            <input
              type="number" min={1} max={15}
              value={opts.maxNightPerMonth}
              onChange={e => setOpts(o => ({ ...o, maxNightPerMonth: Number(e.target.value) }))}
              style={{
                width: '80px', padding: '8px 10px', borderRadius: '8px',
                border: '1.5px solid var(--color-border)',
                background: 'var(--color-bg)', color: 'var(--color-text)',
                fontSize: '13px', outline: 'none',
              }}
            />
          </div>

          {/* 최대 연속 근무 */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', display: 'block', marginBottom: '6px' }}>
              최대 연속 근무일
            </label>
            <input
              type="number" min={2} max={7}
              value={opts.maxConsecWork}
              onChange={e => setOpts(o => ({ ...o, maxConsecWork: Number(e.target.value) }))}
              style={{
                width: '80px', padding: '8px 10px', borderRadius: '8px',
                border: '1.5px solid var(--color-border)',
                background: 'var(--color-bg)', color: 'var(--color-text)',
                fontSize: '13px', outline: 'none',
              }}
            />
          </div>

          {/* 야간 후 최소 휴식 */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', display: 'block', marginBottom: '6px' }}>
              야간 후 최소 휴식일
            </label>
            <input
              type="number" min={1} max={4}
              value={opts.minRestAfterNight}
              onChange={e => setOpts(o => ({ ...o, minRestAfterNight: Number(e.target.value) }))}
              style={{
                width: '80px', padding: '8px 10px', borderRadius: '8px',
                border: '1.5px solid var(--color-border)',
                background: 'var(--color-bg)', color: 'var(--color-text)',
                fontSize: '13px', outline: 'none',
              }}
            />
          </div>

        </div>

        {/* 생성 버튼 */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', alignItems: 'center' }}>
          <button
            onClick={handleGenerate}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 22px', borderRadius: '8px',
              border: 'none',
              background: 'var(--color-primary)', color: '#fff',
              fontSize: '14px', fontWeight: 700,
              cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#1E5470' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-primary)' }}
          >
            <LuWand style={{ width: '16px', height: '16px' }} />
            {isGenerated ? '다시 생성' : '근무표 자동 생성'}
          </button>

          {isGenerated && (
            <>
              <button
                onClick={handleGenerate}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '10px 16px', borderRadius: '8px',
                  border: '1.5px solid var(--color-border)',
                  background: 'var(--color-bg)', color: 'var(--color-muted)',
                  fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                }}
              >
                <LuRefreshCw style={{ width: '14px', height: '14px' }} />
                재생성
              </button>

              <button
                onClick={handleExport}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '10px 16px', borderRadius: '8px',
                  border: '1.5px solid #2E7D5E',
                  background: '#E8F5EE', color: '#2E7D5E',
                  fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#2E7D5E'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#E8F5EE'; e.currentTarget.style.color = '#2E7D5E' }}
              >
                <LuFileSpreadsheet style={{ width: '15px', height: '15px' }} />
                Excel 저장
                <LuDownload style={{ width: '13px', height: '13px', opacity: 0.7 }} />
              </button>
            </>
          )}
        </div>

        {/* 안내 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginTop: '12px', padding: '10px 12px', background: 'var(--color-bg)', borderRadius: '8px' }}>
          <LuInfo style={{ width: '14px', height: '14px', color: 'var(--color-primary)', flexShrink: 0, marginTop: '1px' }} />
          <span style={{ fontSize: '12px', color: 'var(--color-muted)', lineHeight: 1.5 }}>
            생성 후 셀을 클릭하면 <strong style={{ color: 'var(--color-text)' }}>D → E → N → 휴 → D</strong> 순으로 직접 수정할 수 있습니다.
          </span>
        </div>
      </div>

      {/* 근무표 그리드 */}
      {schedule && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
              {year}년 {month}월 병동 근무표
            </h3>
            {/* 범례 */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {(['D', 'E', 'N', 'OFF'] as ShiftCode[]).map(s => {
                const cfg = SHIFT_COLOR[s]
                return (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{
                      display: 'inline-block', width: '26px', height: '20px',
                      borderRadius: '4px', background: cfg.bg,
                      border: `1px solid ${cfg.border}`,
                      fontSize: '10px', fontWeight: 700, color: cfg.text,
                      textAlign: 'center', lineHeight: '20px',
                    }}>
                      {s}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                      {SHIFT_LABEL[s]}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 스크롤 가능한 테이블 */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: '12px', minWidth: '100%' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg)' }}>
                  <th style={{
                    padding: '8px 12px', textAlign: 'left', fontSize: '11px',
                    fontWeight: 700, color: 'var(--color-muted)',
                    borderBottom: '2px solid var(--color-border)',
                    position: 'sticky', left: 0, background: 'var(--color-bg)',
                    zIndex: 1, whiteSpace: 'nowrap', minWidth: '80px',
                  }}>간호사</th>

                  {Array.from({ length: days }, (_, i) => {
                    const dow = new Date(year, month - 1, i + 1).getDay()
                    const isWknd = dow === 0 || dow === 6
                    return (
                      <th key={i} style={{
                        padding: '4px 2px', textAlign: 'center',
                        borderBottom: '2px solid var(--color-border)',
                        minWidth: '32px',
                      }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: headerColor(i) }}>
                          {i + 1}
                        </div>
                        <div style={{ fontSize: '9px', color: isWknd ? headerColor(i) : 'var(--color-muted)', opacity: 0.8 }}>
                          {WEEKDAY[dow]}
                        </div>
                      </th>
                    )
                  })}

                  {/* 통계 헤더 */}
                  {['D', 'E', 'N', '휴', '주말'].map(h => (
                    <th key={h} style={{
                      padding: '8px 6px', textAlign: 'center',
                      fontSize: '10px', fontWeight: 700, color: 'var(--color-muted)',
                      borderBottom: '2px solid var(--color-border)',
                      borderLeft: '1px solid var(--color-border)',
                      minWidth: '28px', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                  <th style={{
                    padding: '8px 6px', textAlign: 'center',
                    fontSize: '10px', fontWeight: 700, color: 'var(--color-muted)',
                    borderBottom: '2px solid var(--color-border)',
                    borderLeft: '1px solid var(--color-border)',
                    minWidth: '28px',
                  }}>OT</th>
                </tr>
              </thead>

              <tbody>
                {schedule.map((row, nurseIdx) => (
                  <tr key={row.nurseId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {/* 간호사 이름 */}
                    <td style={{
                      padding: '6px 12px', fontWeight: 600,
                      color: 'var(--color-text)', whiteSpace: 'nowrap',
                      position: 'sticky', left: 0,
                      background: 'var(--color-surface)', zIndex: 1,
                    }}>
                      {row.nurseName}
                    </td>

                    {/* 근무 셀 */}
                    {row.shifts.map((shift, dayIdx) => {
                      const cfg = SHIFT_COLOR[shift]
                      const dow = new Date(year, month - 1, dayIdx + 1).getDay()
                      const isWknd = dow === 0 || dow === 6
                      return (
                        <td key={dayIdx}
                          onClick={() => handleCellClick(nurseIdx, dayIdx)}
                          title="클릭하여 교대 변경"
                          style={{
                            padding: '3px 2px', textAlign: 'center',
                            cursor: 'pointer',
                            background: isWknd && shift === 'OFF' ? 'rgba(107,128,144,0.05)' : 'transparent',
                          }}
                        >
                          {shift !== 'OFF' ? (
                            <span style={{
                              display: 'inline-block',
                              width: '26px', height: '22px', lineHeight: '22px',
                              borderRadius: '5px',
                              background: cfg.bg,
                              border: `1px solid ${cfg.border}`,
                              color: cfg.text,
                              fontSize: '11px', fontWeight: 700,
                              transition: 'transform 0.1s',
                            }}>
                              {shift}
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-block',
                              width: '26px', height: '22px', lineHeight: '22px',
                              color: 'var(--color-border)',
                              fontSize: '10px',
                              textAlign: 'center',
                            }}>
                              —
                            </span>
                          )}
                        </td>
                      )
                    })}

                    {/* 통계 셀 */}
                    <td style={{ padding: '6px', textAlign: 'center', borderLeft: '1px solid var(--color-border)', color: '#2C6E8A', fontWeight: 600, fontSize: '12px' }}>
                      {row.stats.dayCount}
                    </td>
                    <td style={{ padding: '6px', textAlign: 'center', color: '#D4860A', fontWeight: 600, fontSize: '12px' }}>
                      {row.stats.eveningCount}
                    </td>
                    <td style={{ padding: '6px', textAlign: 'center', color: '#3F51B5', fontWeight: 600, fontSize: '12px' }}>
                      {row.stats.nightCount}
                    </td>
                    <td style={{ padding: '6px', textAlign: 'center', color: 'var(--color-muted)', fontSize: '12px' }}>
                      {row.stats.offCount}
                    </td>
                    <td style={{ padding: '6px', textAlign: 'center', color: 'var(--color-muted)', fontSize: '12px' }}>
                      {row.stats.weekendWork}
                    </td>
                    <td style={{ padding: '6px', textAlign: 'center', borderLeft: '1px solid var(--color-border)' }}>
                      {row.stats.overtimeRisk ? (
                        <LuTriangleAlert style={{ width: '14px', height: '14px', color: '#C0392B' }} title="오버타임 위험" />
                      ) : (
                        <LuCircleCheck style={{ width: '14px', height: '14px', color: '#2E7D5E' }} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* 하루 교대별 합계 행 */}
              <tfoot>
                {(['D', 'E', 'N'] as ShiftCode[]).map(s => (
                  <tr key={s} style={{ background: 'var(--color-bg)' }}>
                    <td style={{
                      padding: '4px 12px', fontSize: '10px', fontWeight: 700,
                      color: SHIFT_COLOR[s].text, position: 'sticky', left: 0,
                      background: 'var(--color-bg)',
                    }}>
                      {s} 인원
                    </td>
                    {Array.from({ length: days }, (_, dayIdx) => {
                      const cnt = schedule.filter(r => r.shifts[dayIdx] === s).length
                      const low = cnt < (opts.minPerShift ?? 1)
                      return (
                        <td key={dayIdx} style={{
                          padding: '4px 2px', textAlign: 'center',
                          fontSize: '11px', fontWeight: 700,
                          color: low ? '#C0392B' : SHIFT_COLOR[s].text,
                          background: low ? 'rgba(192,57,43,0.08)' : 'transparent',
                        }}>
                          {cnt}
                        </td>
                      )
                    })}
                    <td colSpan={6} />
                  </tr>
                ))}
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* 빈 상태 */}
      {!isGenerated && (
        <div style={{
          ...cardStyle, textAlign: 'center', padding: '52px 24px',
        }}>
          <LuWand style={{ width: '40px', height: '40px', margin: '0 auto 12px', color: 'var(--color-border)' }} />
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '6px' }}>
            제약조건을 설정하고 근무표를 생성하세요
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
            생성 후 셀 클릭으로 개별 수정, Excel로 저장할 수 있습니다
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default ScheduleGeneratorPage
