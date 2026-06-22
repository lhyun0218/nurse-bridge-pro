/**
 * exportScheduleExcel.ts
 * 근무 일정을 병원 표준 듀티표 형식 Excel (.xlsx)로 내보내기
 * 라이브러리: xlsx (SheetJS)
 */
import * as XLSX from 'xlsx'
import type { ShiftType } from '../types'

interface DaySchedule {
  date: number
  shift: ShiftType | 'Off'
  overtimeHours?: number
}

const SHIFT_LABEL: Record<ShiftType | 'Off', string> = {
  Day:     'D',
  Evening: 'E',
  Night:   'N',
  Off:     '휴',
}

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토']

export function exportScheduleToExcel(
  schedule: DaySchedule[],
  year: number,
  month: number,
  nurseName: string,
): void {
  const wb = XLSX.utils.book_new()

  // ── 시트 데이터 구성 ──────────────────────────────────────────────────
  // 행 구조:
  // 행 0: 헤더 (병원명, 근무표 제목)
  // 행 1: 간호사명 / 연월 정보
  // 행 2: 날짜 번호 (1, 2, 3 ...)
  // 행 3: 요일 (일, 월, 화 ...)
  // 행 4: 근무 코드 (D, E, N, 휴)
  // 행 5: 오버타임 (있을 때만)
  // 행 7+: 통계 요약

  const daysInMonth = new Date(year, month, 0).getDate()

  // 날짜 / 요일 / 근무 배열
  const dateRow:    (string | number)[] = ['날짜']
  const weekRow:    string[]            = ['요일']
  const shiftRow:   string[]            = ['근무']
  const otRow:      string[]            = ['오버타임']

  let hasOT = false
  for (let d = 1; d <= daysInMonth; d++) {
    const dayOfWeek = new Date(year, month - 1, d).getDay()
    const entry = schedule.find(s => s.date === d)
    dateRow.push(d)
    weekRow.push(WEEKDAY_KO[dayOfWeek])
    shiftRow.push(entry ? SHIFT_LABEL[entry.shift] : '')
    const ot = entry?.overtimeHours ?? 0
    otRow.push(ot > 0 ? `+${ot}h` : '')
    if (ot > 0) hasOT = true
  }

  // 통계
  const workDays    = schedule.filter(s => s.shift !== 'Off').length
  const dayShifts   = schedule.filter(s => s.shift === 'Day').length
  const eveShifts   = schedule.filter(s => s.shift === 'Evening').length
  const nightShifts = schedule.filter(s => s.shift === 'Night').length
  const offDays     = daysInMonth - workDays
  const totalOT     = schedule.reduce((sum, s) => sum + (s.overtimeHours ?? 0), 0)

  // 워크시트 데이터
  const wsData: (string | number)[][] = [
    [`Nurse-Bridge PRO — 근무 일정표`],
    [`${nurseName} 간호사  |  ${year}년 ${month}월`],
    [],
    dateRow,
    weekRow,
    shiftRow,
    ...(hasOT ? [otRow] : []),
    [],
    ['── 근무 통계 ──'],
    ['총 근무일',   workDays,    '일'],
    ['주간 (D)',    dayShifts,   '일'],
    ['저녁 (E)',    eveShifts,   '일'],
    ['야간 (N)',    nightShifts, '일'],
    ['휴무',       offDays,     '일'],
    ['오버타임 합계', totalOT.toFixed(1), 'h'],
  ]

  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // ── 열 너비 설정 ────────────────────────────────────────────────────
  ws['!cols'] = [
    { wch: 12 },  // 첫 번째 열 (레이블)
    ...Array(daysInMonth).fill({ wch: 4 }),  // 날짜 열들
  ]

  // ── 셀 스타일 (제목 행) ──────────────────────────────────────────────
  // SheetJS CE는 스타일 미지원, PRO 버전 또는 exceljs 사용 시 색상 가능
  // 현재는 구조/데이터 정확성에 집중

  XLSX.utils.book_append_sheet(wb, ws, `${year}년 ${month}월`)

  // ── 파일 다운로드 ──────────────────────────────────────────────────
  const fileName = `근무표_${nurseName}_${year}년${month}월.xlsx`
  XLSX.writeFile(wb, fileName)
}

/**
 * 수간호사용: 전체 간호사 근무표를 하나의 엑셀 파일로
 * 각 간호사가 별도 시트로 구성
 */
export function exportAllNursesScheduleToExcel(
  allSchedules: Array<{
    nurseId: string
    nurseName: string
    schedule: DaySchedule[]
  }>,
  year: number,
  month: number,
): void {
  const wb = XLSX.utils.book_new()
  const daysInMonth = new Date(year, month, 0).getDate()

  // ── 요약 시트 (전체 병동 듀티표) ────────────────────────────────────
  const headerRow = ['간호사명', ...Array.from({ length: daysInMonth }, (_, i) => i + 1), '총근무', '야간수', 'OT(h)']
  const summaryData: (string | number)[][] = [
    [`Nurse-Bridge PRO — ${year}년 ${month}월 병동 근무표`],
    [],
    headerRow,
  ]

  allSchedules.forEach(({ nurseName, schedule }) => {
    const row: (string | number)[] = [nurseName]
    for (let d = 1; d <= daysInMonth; d++) {
      const entry = schedule.find(s => s.date === d)
      row.push(entry ? SHIFT_LABEL[entry.shift] : '')
    }
    row.push(schedule.filter(s => s.shift !== 'Off').length)
    row.push(schedule.filter(s => s.shift === 'Night').length)
    row.push(schedule.reduce((sum, s) => sum + (s.overtimeHours ?? 0), 0).toFixed(1))
    summaryData.push(row)
  })

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData)
  summaryWs['!cols'] = [
    { wch: 12 },
    ...Array(daysInMonth).fill({ wch: 4 }),
    { wch: 8 }, { wch: 8 }, { wch: 8 },
  ]
  XLSX.utils.book_append_sheet(wb, summaryWs, '전체 근무표')

  // ── 개인별 시트 ────────────────────────────────────────────────────
  allSchedules.forEach(({ nurseName, schedule }) => {
    const dateRow:  (string | number)[] = ['날짜']
    const weekRow:  string[] = ['요일']
    const shiftRow: string[] = ['근무']

    for (let d = 1; d <= daysInMonth; d++) {
      const dayOfWeek = new Date(year, month - 1, d).getDay()
      const entry = schedule.find(s => s.date === d)
      dateRow.push(d)
      weekRow.push(WEEKDAY_KO[dayOfWeek])
      shiftRow.push(entry ? SHIFT_LABEL[entry.shift] : '')
    }

    const wsData = [
      [`${nurseName} — ${year}년 ${month}월`],
      [],
      dateRow, weekRow, shiftRow,
    ]

    const ws = XLSX.utils.aoa_to_sheet(wsData)
    ws['!cols'] = [{ wch: 8 }, ...Array(daysInMonth).fill({ wch: 4 })]
    // 시트 이름 최대 31자 제한
    const sheetName = nurseName.slice(0, 28) || '간호사'
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
  })

  const fileName = `병동근무표_${year}년${month}월.xlsx`
  XLSX.writeFile(wb, fileName)
}
