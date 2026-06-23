# Design Document

## Overview

Nurse Bridge Pro 시스템의 전면적 연동 개선 설계입니다. 핵심 원칙은 **scheduleSlice를 단일 진실 소스(Single Source of Truth)** 로 삼아 모든 슬라이스를 거미줄처럼 연결하고, 하드코딩을 전면 제거하는 것입니다.

---

## Architecture

### 데이터 흐름 다이어그램

```
scheduleSlice (근무표 - SSoT)
    │
    ├── attendanceSlice (출퇴근/휴게)
    │       └── AttendancePage (근태)
    │       └── HeadNurseAttendancePage (수간호사 근태)
    │
    ├── assignmentsSlice (환자 배정)
    │       └── ColleaguesPage (동료현황)
    │       └── HeadNursePage (병동관제)
    │
    ├── tasksSlice (간호 업무 Todo)
    │       └── TodoPage
    │       └── MedicationSchedulePage (투약체크 → Task 완료)
    │
    ├── prescriptionsSlice (처방)
    │       └── MedicationSchedulePage
    │
    ├── shiftReportSlice (인수인계)
    │       └── HandoverPage
    │       └── ShiftReportModal (실데이터)
    │
    └── patientsSlice (환자)
            └── PatientFormPage (등록 → 즉시 반영)
```

### 공유 상수 계층 구조

```
src/constants/shiftTimes.ts  ← 모든 컴포넌트가 이 파일만 참조
    │
    ├── AttendancePage
    ├── ColleaguesPage
    ├── SchedulePage
    ├── HeadNursePage
    ├── DashboardPage (남은 근무 시간 위젯)
    └── attendanceStatus.ts (computeStatus)
```

---

## Component Design

### 1. `src/constants/shiftTimes.ts` (신규)

시스템 전체 교대 시간의 단일 소스.

```typescript
import type { ShiftType, ShiftCode } from '../types'

export const SHIFT_TIMES: Record<ShiftType, { workStart: string; workEnd: string }> = {
  Day:     { workStart: '07:30', workEnd: '16:00' },
  Evening: { workStart: '15:30', workEnd: '00:00' },
  Night:   { workStart: '23:30', workEnd: '08:00' },
}

// ShiftCode → ShiftType 변환 (근무표 슬라이스 D/E/N/OFF → 타입)
export function shiftCodeToType(code: ShiftCode): ShiftType | 'OFF' {
  if (code === 'D') return 'Day'
  if (code === 'E') return 'Evening'
  if (code === 'N') return 'Night'
  return 'OFF'
}

// workEnd까지 남은 분 계산 (자정 경계 처리 포함)
export function minutesUntilShiftEnd(shiftType: ShiftType, now = new Date()): number {
  const endStr = SHIFT_TIMES[shiftType].workEnd
  const [eH, eM] = endStr.split(':').map(Number)
  const end = new Date(now)
  end.setHours(eH, eM, 0, 0)
  // Evening(00:00), Night(08:00)은 다음날일 수 있음
  if (end <= now) end.setDate(end.getDate() + 1)
  return Math.round((end.getTime() - now.getTime()) / 60000)
}

// 정시 퇴근 가능 여부 (workEnd ±10분 이내)
export function isOnTimeDeparture(shiftType: ShiftType, now = new Date()): boolean {
  const mins = minutesUntilShiftEnd(shiftType, now)
  return mins >= -10 && mins <= 10
}

// 근무표에서 오늘 간호사의 ShiftType 조회 (scheduleSlice rows 기준)
export function getNurseShiftToday(
  nurseId: string,
  scheduleRows: Array<{ nurseId: string; shifts: ShiftCode[] }>,
  dateIndex: number, // 0-based day index
  fallbackShift: ShiftType
): ShiftType | 'OFF' {
  const row = scheduleRows.find(r => r.nurseId === nurseId)
  if (!row || !row.shifts[dateIndex]) return fallbackShift
  return shiftCodeToType(row.shifts[dateIndex])
}
```

---

### 2. `attendanceSlice` 수정

#### AttendanceRecord 인터페이스 확장

```typescript
interface AttendanceRecord {
  nurseId: string
  date: string
  checkIn?: number
  checkOut?: number
  checkoutRequested?: boolean
  checkoutApproved?: boolean
  leaveRequested?: boolean
  leaveStatus?: 'Pending' | 'Approved' | 'Denied'
  onBreak?: boolean
  // 신규 필드
  breakStart?: number        // 휴게 시작 타임스탬프 (Unix ms)
  breakEnd?: number          // 휴게 종료 타임스탬프 (Unix ms)
  earlyLeaveReason?: string  // 조기퇴근 사유
}
```

#### 신규 액션

```typescript
// 휴게 시작
startBreak: (state, action: PayloadAction<{ nurseId: string; date: string }>) => {
  const rec = findOrCreate(state, action.payload)
  if (!rec.checkIn) return // 출근 전이면 차단
  rec.onBreak = true
  rec.breakStart = Date.now()
}

// 휴게 종료
endBreak: (state, action: PayloadAction<{ nurseId: string; date: string }>) => {
  const rec = findOrCreate(state, action.payload)
  rec.onBreak = false
  rec.breakEnd = Date.now()
}

// 조기 퇴근 신청 (사유 포함)
requestEarlyLeave: (state, action: PayloadAction<{
  nurseId: string; date: string; reason: string
}>) => {
  const rec = findOrCreate(state, action.payload)
  rec.checkoutRequested = true
  rec.earlyLeaveReason = action.payload.reason
}
```

---

### 3. `src/utils/attendanceStatus.ts` 수정

#### StatusKey 타입 확장

```typescript
export type StatusKey = 'BeforeShift' | 'Active' | 'OnBreak' | 'ShiftEnd'
```

#### computeStatus 로직 수정

```typescript
export const computeStatus = (
  records: AttendanceRecord[],
  nurse: Nurse,
  dateKey: string,
  shiftType: ShiftType,  // scheduleSlice 기반으로 외부에서 주입
  now = new Date()
): StatusKey => {
  const rec = getTodayAttendance(records, nurse.id, dateKey)

  if (rec) {
    if (rec.checkOut) return 'ShiftEnd'
    if (rec.onBreak) return 'OnBreak'
    if (rec.checkIn) return 'Active'
    // checkIn 없으면 무조건 Active 금지
  }

  // 출근 기록 없음 → BeforeShift vs ShiftEnd 판단
  const startStr = SHIFT_TIMES[shiftType].workStart
  if (isNowInRange(startStr, '23:59', now) === false) {
    // 교대 시작 전
    return 'BeforeShift'
  }
  // 교대 시작 후인데 출근 안 함 = ShiftEnd (결근 처리)
  return 'ShiftEnd'
}
```

---

### 4. `AttendancePage` 수정 (근태 페이지)

#### 주요 변경사항

1. **명칭 변경**: '출석' → '근태', '출석 달력' → '근태 달력'

2. **퇴근 버튼 로직**:
```typescript
const isOnTime = isOnTimeDeparture(shiftType, new Date())
const canCheckoutDirectly = checkedIn && !checkedOut && isOnTime
const canRequestEarlyLeave = checkedIn && !checkedOut && !isOnTime && !checkoutReqd
```

3. **액션 버튼 구성**:
   - 출근 버튼 (기존 유지)
   - 휴게 시작 버튼 (출근 후 활성화)
   - 휴게 종료 버튼 (휴게 중 활성화)
   - 정시 퇴근 버튼 (workEnd ±10분 이내, 즉시 처리)
   - 조기 퇴근 신청 버튼 (workEnd -10분 이전, 모달 열기)

4. **조기 퇴근 모달**:
```typescript
const EarlyLeaveModal: React.FC<{ onSubmit: (reason: string) => void; onClose: () => void }>
// textarea로 사유 입력, 신청 시 requestEarlyLeave dispatch + broadcast
```

---

### 5. `ColleaguesPage` 수정

#### STATUS_CONFIG 확장

```typescript
const STATUS_CONFIG = {
  BeforeShift: { label: '출근 전',  bg: '#F0F4F7', color: '#9BA8B0', icon: LuClock },
  Active:      { label: '근무 중',  bg: '#E8F5EE', color: '#2E7D5E', icon: LuCircleCheck },
  OnBreak:     { label: '휴게 중',  bg: '#FEF3E2', color: '#D4860A', icon: LuCoffee },
  ShiftEnd:    { label: '근무 종료', bg: '#F0F4F7', color: '#6B8090', icon: LuLogOut },
}
```

#### 근무 시간 표시 수정

```typescript
// 기존: nurse.workStart / nurse.workEnd (하드코딩)
// 변경: scheduleSlice + SHIFT_TIMES 조회
const todayShiftType = getNurseShiftToday(nurse.id, currentMonthSchedule, todayIndex, nurse.shiftType)
const shiftTime = todayShiftType !== 'OFF'
  ? `${SHIFT_TIMES[todayShiftType].workStart} ~ ${SHIFT_TIMES[todayShiftType].workEnd}`
  : '휴무'
```

---

### 6. `MedicationSchedulePage` 수정

#### 투약 완료 체크 상태 관리

```typescript
// 로컬 상태 (medKey: `${patientId}-${medName}`)
const [checkedMeds, setCheckedMeds] = useState<Set<string>>(new Set())

const handleMedCheck = (patientId: string, medName: string) => {
  const key = `${patientId}-${medName}`
  setCheckedMeds(prev => new Set(prev).add(key))
  
  // tasksSlice에서 일치하는 Medication 태스크 완료 처리
  const matchingTask = allTasks.find(t =>
    t.patientId === patientId &&
    t.category === 'Medication' &&
    t.taskName.includes(medName) &&
    t.status === 'Pending'
  )
  if (matchingTask) dispatch(toggleTask(matchingTask.taskId))
}
```

#### 의사 처방 오더 - 다음 투여 시각 계산

```typescript
function calcNextDoseTime(prescription: Prescription): string {
  const { frequency, startDate } = prescription
  const start = new Date(startDate)
  const now = new Date()

  // frequency 파싱: "1일 3회", "8시간마다", "PRN" 등
  if (frequency.includes('PRN')) return 'PRN (필요시)'
  
  const intervalHours = parseFrequencyToHours(frequency) // 예: "1일 3회" → 8
  if (!intervalHours) return '-'
  
  let next = new Date(start)
  while (next <= now) next = new Date(next.getTime() + intervalHours * 3600000)
  
  return next.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}
```

---

### 7. Inventory 모듈 제거

#### 삭제 대상 파일

- `src/pages/InventoryPage.tsx`
- `src/store/slices/inventorySlice.ts`
- `src/components/inventory/InventoryItemCard.tsx`
- `src/components/inventory/InventorySummary.tsx`
- `src/components/inventory/InventoryTabs.tsx`
- `src/components/head-nurse/ReassignBanner.tsx`

#### `store/index.ts` 수정

```typescript
// 제거
- import inventoryReducer, { autoConsumeForMedication } from './slices/inventorySlice'
- inventory: inventoryReducer,
- const medicationAutoConsumeMiddleware: Middleware = ...
- .concat(medicationAutoConsumeMiddleware)
```

#### `App.tsx` 수정

```typescript
// 제거
- import InventoryPage from './pages/InventoryPage'
- <Route path="/inventory" element={<InventoryPage />} />
```

---

### 8. `ShiftReportModal` 실데이터 연동

#### store/index.ts 수정

```typescript
// 제거: mockInitReports 하드코딩 주입 블록 전체 삭제
// 보고서 없으면 빈 배열 그대로 유지
```

#### ShiftReportModal Props 설계

```typescript
interface ShiftReportModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (report: ShiftReport) => void
  // 저장된 보고서 목록 (HandoverPage에서 Redux 조회 후 전달)
  savedReports: ShiftReport[]
  currentUser: Nurse
  myPatients: Patient[]
  myTasks: NursingTask[]
}
```

#### 보고서 저장 시 patientSnapshots 생성

```typescript
// HandoverPage에서 보고서 저장 시 실시간 스냅샷 생성
const buildPatientSnapshots = (
  patients: Patient[],
  tasks: NursingTask[],
  notes: NursingNote[]
): ShiftReportPatientSnapshot[] => {
  return patients.map(p => {
    const ptTasks = tasks.filter(t => t.patientId === p.id)
    const ptNotes = notes.filter(n => n.patientId === p.id)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 3)
      .map(n => n.content)
    return {
      patientId: p.id,
      patientName: p.name,
      roomNumber: p.roomNumber,
      severity: p.severity,
      diagnosis: p.diagnosis,
      completedTaskCount: ptTasks.filter(t => t.status === 'Completed').length,
      pendingTaskCount: ptTasks.filter(t => t.status === 'Pending').length,
      pendingTaskNames: ptTasks.filter(t => t.status === 'Pending').map(t => t.taskName),
      nursingNotesSummary: ptNotes,
      vitalSigns: {
        bloodPressure: p.vitalSigns.bloodPressure,
        heartRate: p.vitalSigns.heartRate,
        temperature: p.vitalSigns.temperature,
        oxygenSaturation: p.vitalSigns.oxygenSaturation,
      },
    }
  })
}
```

---

### 9. `HeadNursePage` 자동 재배정 제거

```typescript
// 제거할 코드
- import { getReassignmentSuggestion } from '../utils/overtime'
- import { ReassignBanner } from '../components/head-nurse'
- const suggestion = getReassignmentSuggestion(...)
- const handleReassign = () => { ... }
- <ReassignBanner suggestion={suggestion} onApply={handleReassign} />
```

---

### 10. DashboardPage 남은 근무 시간 위젯

```typescript
// DashboardPage 또는 Topbar 컴포넌트
const todayRec = useAppSelector(s =>
  s.attendance.records.find(r => r.nurseId === currentUser?.id && r.date === today)
)

const remainingLabel = useMemo(() => {
  if (todayRec?.checkOut) return '퇴근 완료'
  if (!todayRec?.checkIn) return '출근 전'
  
  const shiftType = currentUser?.shiftType ?? 'Day'
  const mins = minutesUntilShiftEnd(shiftType)
  if (mins <= 0) return '근무 종료'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}시간 ${m}분 남음` : `${m}분 남음`
}, [todayRec, currentUser])
```

---

### 11. `PatientFormPage` 환자 등록 정상화

```typescript
const handleSubmit = (formData: PatientFormData) => {
  // 필수 필드 검증
  if (!formData.name || !formData.roomNumber || !formData.diagnosis.length) {
    setError('이름, 병실번호, 진단명은 필수입니다.')
    return
  }

  const newPatient: Patient = {
    id: `p${Date.now()}`,
    medicalRecordNo: `MRN${Date.now()}`,
    ...formData,
    vitalSigns: { bloodPressure: '-', heartRate: 0, temperature: 0, respiratoryRate: 0, oxygenSaturation: 0 },
    recentLabs: [],
    medications: [],
    nursingTaskIds: [],
    aiSummary: [],
    admissionDate: new Date().toISOString(),
    assignedNurseId: '',
  }

  dispatch(addPatient(newPatient))

  // 오늘 날짜 기준 자동 배정
  const todayIdx = new Date().getDate() - 1
  const assignmentMap = autoAssignPatients(nurses, [newPatient], {
    balance: true,
    scheduleRows: currentMonthSchedule,
    dateIndex: todayIdx,
  })
  dispatch(setAssignments({ date: todayKey, assignments: assignmentMap }))

  navigate('/head-nurse')
}
```

---

### 12. `OccupancyChart` 병상 가동률 정상화

```typescript
// scheduleSlice 기반으로 교대별 담당 환자 수 계산
const shiftPatientCounts = useMemo(() => {
  const todayIdx = new Date().getDate() - 1
  const counts = { Day: 0, Evening: 0, Night: 0 }

  if (scheduleRows.length === 0) {
    // fallback: 전체 환자 수 / 3
    const base = Math.floor(patients.length / 3)
    return { Day: base, Evening: base, Night: patients.length - base * 2 }
  }

  patients.forEach(p => {
    const assignment = assignmentsToday[p.id]
    if (assignment) {
      if (assignment.Day) counts.Day++
      if (assignment.Evening) counts.Evening++
      if (assignment.Night) counts.Night++
    }
  })
  return counts
}, [scheduleRows, patients, assignmentsToday])
```

---

### 13. 다크모드 CSS 변수 적용 원칙

모든 컴포넌트에서 다음 규칙을 적용:

| 하드코딩 값 | 교체할 CSS 변수 |
|---|---|
| `#1A2B38`, `#000`, `black` | `var(--color-text)` |
| `#6B8090` (보조 텍스트) | `var(--color-muted)` |
| `#ffffff`, `white` | `var(--color-surface)` |
| `#F0F4F7` (배경) | `var(--color-bg)` |
| `#DDE3E8`, `#E8EDF0` (테두리) | `var(--color-border)` |

상태 강조색은 유지:
- 위험: `#C0392B` (유지)
- 경고: `#D4860A` (유지)
- 정상: `#2E7D5E` (유지)
- Day 교대: `#2C6E8A` (유지)
- Evening 교대: `#D4860A` (유지)
- Night 교대: `#3F51B5` (유지)

---

## Components and Interfaces

### 신규 파일

| 파일 | 역할 |
|---|---|
| `src/constants/shiftTimes.ts` | SHIFT_TIMES 상수, shiftCodeToType, minutesUntilShiftEnd, isOnTimeDeparture, getNurseShiftToday |

### 수정 파일

| 파일 | 변경 내용 |
|---|---|
| `src/store/slices/attendanceSlice.ts` | breakStart/breakEnd/earlyLeaveReason 필드 추가, startBreak/endBreak/requestEarlyLeave 액션 추가 |
| `src/utils/attendanceStatus.ts` | StatusKey에 'BeforeShift' 추가, computeStatus 로직 수정 |
| `src/pages/AttendancePage.tsx` | '출석'→'근태' 명칭, 휴게 버튼, 정시/조기 퇴근 로직, EarlyLeaveModal |
| `src/pages/ColleaguesPage.tsx` | STATUS_CONFIG에 BeforeShift 추가, 근무시간 SHIFT_TIMES 참조 |
| `src/pages/MedicationSchedulePage.tsx` | 투약 체크 상태, tasksSlice 연동, 다음 투여 시각 표시 |
| `src/pages/HeadNursePage.tsx` | ReassignBanner 제거, OccupancyChart scheduleSlice 연동 |
| `src/pages/HeadNurseAttendancePage.tsx` | '출석 관리'→'근태 관리', breakStart/breakEnd 표시 |
| `src/pages/SchedulePage.tsx` | 하드코딩 시간 → SHIFT_TIMES 참조 |
| `src/pages/PatientFormPage.tsx` | 등록 시 patientsSlice 즉시 추가 + 자동 배정 |
| `src/pages/DashboardPage.tsx` | 남은 근무 시간 위젯 attendanceSlice 연동 |
| `src/pages/HandoverPage.tsx` | buildPatientSnapshots 실시간 생성 |
| `src/components/report/ShiftReportModal.tsx` | 실데이터 렌더링, 빈 상태 메시지 |
| `src/components/head-nurse/OccupancyChart.tsx` | scheduleSlice/assignmentsSlice 기반 계산 |
| `src/store/index.ts` | inventorySlice/미들웨어 제거, mockInitReports 제거 |
| `src/App.tsx` | /inventory 라우트 제거 |

### 삭제 파일

| 파일 | 이유 |
|---|---|
| `src/pages/InventoryPage.tsx` | 재고 모듈 제거 |
| `src/store/slices/inventorySlice.ts` | 재고 모듈 제거 |
| `src/components/inventory/InventoryItemCard.tsx` | 재고 모듈 제거 |
| `src/components/inventory/InventorySummary.tsx` | 재고 모듈 제거 |
| `src/components/inventory/InventoryTabs.tsx` | 재고 모듈 제거 |
| `src/components/head-nurse/ReassignBanner.tsx` | 자동 재배정 제거 |

---

## Correctness Properties

### Property 1: 출근 없이 Active 금지

`computeStatus(records, nurse, dateKey, shiftType)` 함수는 해당 날짜의 AttendanceRecord에 `checkIn` 값이 없으면 어떤 상황에서도 `'Active'`를 반환하지 않는다. 이를 위한 PBT: 임의의 records 배열에서 해당 nurseId의 checkIn이 undefined/falsy이면 반환값이 항상 'BeforeShift' 또는 'ShiftEnd'임을 검증.

**Validates: Requirements 2.3**

### Property 2: 퇴근 시간 일관성

`SHIFT_TIMES` 상수를 참조하는 모든 컴포넌트(AttendancePage, ColleaguesPage, SchedulePage, DashboardPage)는 동일한 Day/Evening/Night workStart/workEnd 값을 표시한다. 이를 위한 PBT: SHIFT_TIMES 값을 변경하면 모든 참조 지점에서 변경된 값이 일관되게 반영됨을 검증.

**Validates: Requirements 1.2, 1.3**

### Property 3: 자정 경계 처리

`minutesUntilShiftEnd(shiftType, now)` 함수는 Evening(workEnd '00:00') 및 Night(workEnd '08:00') 교대에 대해 임의의 `now` 입력에서 항상 0 이상의 값을 반환한다. 이를 위한 PBT: 임의의 Date 입력에 대해 결과가 0 이상 540(9시간) 이하임을 검증.

**Validates: Requirements 5.1, 5.3**

### Property 4: 보고서 스냅샷 무결성

`buildPatientSnapshots(patients, tasks, notes)` 함수가 생성하는 각 스냅샷에서 `completedTaskCount + pendingTaskCount === 해당 환자의 전체 태스크 수`가 항상 성립한다. 이를 위한 PBT: 임의의 patients/tasks 조합에 대해 이 등식이 성립함을 검증.

**Validates: Requirements 8.3, 8.4**

### Property 5: 투약 체크 → Task 완료 일관성

투약 체크 후 tasksSlice에서 해당 환자의 `category === 'Medication'` && 약물명 일치 태스크의 status가 'Completed'로 변경된다. 이를 위한 PBT: 임의의 약물명/환자 조합에서 체크 후 해당 태스크가 Completed임을 검증.

**Validates: Requirements 6.3**

---

## Data Models

### AttendanceRecord (확장)

```typescript
interface AttendanceRecord {
  nurseId: string
  date: string               // YYYY-MM-DD
  checkIn?: number           // Unix ms
  checkOut?: number          // Unix ms
  checkoutRequested?: boolean
  checkoutApproved?: boolean
  leaveRequested?: boolean
  leaveStatus?: 'Pending' | 'Approved' | 'Denied'
  onBreak?: boolean          // 현재 휴게 중 여부
  breakStart?: number        // 휴게 시작 타임스탬프
  breakEnd?: number          // 휴게 종료 타임스탬프
  earlyLeaveReason?: string  // 조기퇴근 사유
}
```

### StatusKey (확장)

```typescript
export type StatusKey = 'BeforeShift' | 'Active' | 'OnBreak' | 'ShiftEnd'
```

---

## Error Handling

- 출근 전 휴게/퇴근 시도: dispatch 차단 + 토스트 메시지
- 필수 필드 없이 환자 등록: 인라인 에러 메시지
- 조기 퇴근 사유 미입력: 모달 내 validation
- 근무표 미생성 상태: fallback으로 `Nurse.shiftType` 사용, UI에 '근무표 미생성' 안내 표시

---

## Testing Strategy

### Property-Based Testing 대상

1. `minutesUntilShiftEnd(shiftType, now)` — 항상 0~540 범위 반환, 자정 경계 처리 정확성
2. `isOnTimeDeparture(shiftType, now)` — workEnd ±10분 범위 외에서 false 반환 보장
3. `computeStatus(records, nurse, dateKey, shiftType)` — checkIn 없으면 절대 'Active' 반환 안함
4. `buildPatientSnapshots` — pendingTaskCount + completedTaskCount == 전체 태스크 수
5. `calcNextDoseTime` — 반환 시각이 항상 현재 시각보다 미래

### 단위 테스트 대상

- `shiftCodeToType`: D→Day, E→Evening, N→Night, OFF→'OFF'
- `getNurseShiftToday`: scheduleRows 없을 때 fallback 동작
- `attendanceSlice.startBreak`: checkIn 없으면 상태 변경 없음
- `attendanceSlice.requestEarlyLeave`: earlyLeaveReason 정확히 저장
