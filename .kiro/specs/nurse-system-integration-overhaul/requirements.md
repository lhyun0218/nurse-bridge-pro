# Requirements Document

## Introduction

Nurse Bridge Pro(React + TypeScript + Redux Toolkit) 간호 병동 관리 시스템의 전면적 시스템 연동 개선 및 버그 수정 스펙입니다.

현재 시스템은 근무표(scheduleSlice), 출퇴근(attendanceSlice), 환자배정(assignmentsSlice), 투약/처방(prescriptionsSlice), Todo(tasksSlice), 인수인계(shiftReportSlice) 등 각 슬라이스가 서로 독립적으로 동작하며 하드코딩된 데이터에 의존하는 문제가 있습니다. 이번 개선을 통해 모든 슬라이스가 scheduleSlice를 단일 진실 소스(Single Source of Truth)로 삼아 거미줄처럼 연결되어야 하며, 하드코딩은 전면 제거됩니다.

---

## Glossary

- **System**: Nurse Bridge Pro 전체 애플리케이션
- **Scheduler**: scheduleSlice 및 그에 접근하는 모든 컴포넌트
- **AttendanceModule**: attendanceSlice 및 출퇴근 관련 컴포넌트(AttendancePage, HeadNurseAttendancePage)
- **MedicationModule**: prescriptionsSlice, MedicationSchedulePage
- **TaskModule**: tasksSlice, TodoPage
- **HandoverModule**: shiftReportSlice, HandoverPage, ShiftReportModal
- **AssignmentModule**: assignmentsSlice
- **ColleaguesView**: ColleaguesPage
- **HeadNurseView**: HeadNursePage
- **SHIFT_TIMES**: 시스템 전체에서 단일 참조하는 교대 시간 상수
  - Day: 07:30 ~ 16:00
  - Evening: 15:30 ~ 00:00 (다음날)
  - Night: 23:30 ~ 08:00 (다음날)
  - OFF: 휴무
- **ShiftCode**: 근무표에서 사용하는 코드값 (`D` | `E` | `N` | `OFF`)
- **ShiftType**: UI 및 타입 시스템에서 사용하는 교대 타입 (`Day` | `Evening` | `Night`)
- **AttendanceRecord**: `{ nurseId, date, checkIn?, checkOut?, checkoutRequested?, checkoutApproved?, breakStart?, breakEnd?, earlyLeaveReason? }`
- **BeforeShift**: 출근 기록 없음 + 해당 교대 시작 시각 이전인 상태
- **Active**: 출근(checkIn) 기록이 있고 퇴근(checkOut) 기록이 없는 상태
- **OnBreak**: 휴게 시작(breakStart) 기록이 있고 휴게 종료(breakEnd) 기록이 없는 상태
- **ShiftEnd**: 퇴근(checkOut) 기록이 있는 상태

---

## Requirements

### 요구사항 1: 공유 교대 시간 상수(SHIFT_TIMES) 단일화

**User Story:** 개발자로서, 교대 시간을 전체 시스템에서 단 한 곳에서 관리하고 싶다. 그래야 시간 불일치 버그를 방지할 수 있다.

#### 수용 기준

1. THE System SHALL `src/constants/shiftTimes.ts` 파일에 `SHIFT_TIMES` 상수를 정의한다. 내용은 다음과 같다:
   - `Day`: workStart `'07:30'`, workEnd `'16:00'`
   - `Evening`: workStart `'15:30'`, workEnd `'00:00'`
   - `Night`: workStart `'23:30'`, workEnd `'08:00'`
2. THE System SHALL AttendancePage, ColleaguesPage, SchedulePage, HeadNursePage에서 로컬 하드코딩된 교대 시간 문자열을 모두 제거하고 `SHIFT_TIMES` 상수만 참조한다.
3. WHEN `SHIFT_TIMES`가 변경되면, THE System SHALL 전체 애플리케이션에서 변경된 시간이 일관되게 반영된다.
4. THE System SHALL `ShiftCode`를 `ShiftType`으로 변환하는 유틸 함수 `shiftCodeToType(code: ShiftCode): ShiftType | 'OFF'`를 동일 파일에 export한다.

---

### 요구사항 2: 동료 현황(ColleaguesPage) 상태 계산 정확화

**User Story:** 일반 간호사로서, 동료 현황 페이지에서 아직 출근하지 않은 동료가 '근무 종료'가 아닌 '출근 전'으로 정확히 표시되길 원한다. 그래야 실제 병동 상황을 정확히 파악할 수 있다.

#### 수용 기준

1. THE AttendanceModule SHALL `computeStatus` 함수에서 `BeforeShift` 상태를 지원한다. 구체적으로: checkIn 기록 없음 + checkOut 기록 없음 + 현재 시각이 해당 교대의 SHIFT_TIMES.workStart 이전인 경우 → `'BeforeShift'`를 반환한다.
2. THE ColleaguesView SHALL `BeforeShift` 상태인 간호사를 `'출근 전'` 레이블과 구분되는 색상으로 표시한다.
3. WHEN 간호사의 attendanceSlice에 checkIn 기록이 없으면, THE System SHALL 해당 간호사를 절대로 `'Active'(근무 중)` 상태로 표시하지 않는다.
4. THE ColleaguesView SHALL 각 간호사의 근무 시간을 Nurse.workStart/workEnd 하드코딩이 아닌 `scheduleSlice`의 오늘 날짜 ShiftCode → `SHIFT_TIMES` 변환 결과로 표시한다.
5. THE AssignmentModule SHALL 간호사별 담당 환자 수를 `assignmentsSlice.byDate[todayKey][patientId]`의 오늘 배정 데이터 기준으로 정확히 계산한다.

---

### 요구사항 3: 퇴근 로직 개선 (정시/조기 퇴근 분리)

**User Story:** 일반 간호사로서, 정시에 퇴근할 때는 별도 승인 없이 바로 퇴근할 수 있고, 조기 퇴근 시에는 사유를 입력하여 수간호사 승인을 받을 수 있길 원한다.

#### 수용 기준

1. WHEN 현재 시각이 `SHIFT_TIMES[shiftType].workEnd` 기준 ±10분 이내이면, THE AttendanceModule SHALL 퇴근 버튼을 즉시 활성화하고 수간호사 승인 없이 바로 `checkOut`을 기록한다.
2. WHEN 현재 시각이 `SHIFT_TIMES[shiftType].workEnd` 기준 −10분 이전(조기 퇴근)이면, THE AttendanceModule SHALL 퇴근 버튼을 비활성화하고 `조기 퇴근 신청` 버튼만 표시한다.
3. WHEN 간호사가 `조기 퇴근 신청` 버튼을 클릭하면, THE AttendanceModule SHALL 사유 입력 모달을 표시한다.
4. WHEN 간호사가 사유를 입력하고 신청을 완료하면, THE AttendanceModule SHALL `attendanceSlice`의 해당 AttendanceRecord에 `earlyLeaveReason` 필드와 `checkoutRequested: true`를 저장하고 수간호사에게 승인 요청 알림을 전송한다.
5. WHEN 수간호사가 조기 퇴근을 승인하면, THE AttendanceModule SHALL `checkoutApproved: true`로 갱신하고 해당 간호사의 퇴근 버튼을 활성화한다.
6. IF 간호사가 출근(checkIn) 기록 없이 퇴근 버튼 또는 조기 퇴근 신청 버튼을 클릭하면, THEN THE AttendanceModule SHALL 해당 액션을 차단하고 오류 메시지를 표시한다.

---

### 요구사항 4: 근태(AttendancePage) 명칭 변경 및 휴게 기능 추가

**User Story:** 일반 간호사로서, 근태 관리 페이지에서 휴게 시작/종료를 기록할 수 있길 원한다. 그래야 정확한 근무 시간 관리가 가능하다.

#### 수용 기준

1. THE AttendanceModule SHALL AttendancePage의 페이지 타이틀, 레이블, 캘린더 헤더 등 모든 '출석' 텍스트를 '근태'로 변경한다.
2. THE AttendanceModule SHALL `attendanceSlice`의 `AttendanceRecord`에 `breakStart?: number`, `breakEnd?: number` 필드를 추가한다.
3. WHEN 간호사가 `휴게 시작` 버튼을 클릭하면, THE AttendanceModule SHALL `attendanceSlice`에 `breakStart: Date.now()`를 기록하고 해당 간호사의 상태를 `'OnBreak'`로 변경한다.
4. WHEN 간호사가 `휴게 종료` 버튼을 클릭하면, THE AttendanceModule SHALL `attendanceSlice`에 `breakEnd: Date.now()`를 기록하고 해당 간호사의 상태를 `'Active'`로 복귀시킨다.
5. IF 간호사가 출근(checkIn) 기록 없이 `휴게 시작` 버튼을 클릭하면, THEN THE AttendanceModule SHALL 해당 액션을 차단한다.
6. THE AttendanceModule SHALL HeadNurseAttendancePage(수간호사 근태 관리)의 간호사별 기록 테이블에 `breakStart`, `breakEnd` 정보를 표시한다.

---

### 요구사항 5: 퇴근 후 대시보드 위젯 상태 연동

**User Story:** 간호사로서, 퇴근 후 대시보드 우측 상단의 '남은 근무 시간' 위젯이 실제 상태를 반영하길 원한다.

#### 수용 기준

1. WHILE 간호사가 근무 중(Active)이면, THE System SHALL 대시보드의 '남은 근무 시간' 위젯을 `SHIFT_TIMES[shiftType].workEnd` 기준으로 계산하여 표시한다.
2. WHEN 간호사가 퇴근(checkOut)을 완료하면, THE System SHALL 대시보드의 '남은 근무 시간' 위젯을 '퇴근 완료'로 변경한다.
3. THE System SHALL 남은 근무 시간을 scheduleSlice의 오늘 ShiftCode → SHIFT_TIMES 변환 결과를 기준으로 계산하며, Nurse.workEnd 하드코딩 값을 사용하지 않는다.

---

### 요구사항 6: 투약 스케줄 — 투약 체크 및 Todo 연동

**User Story:** 일반 간호사로서, 투약을 완료 처리하면 해당 내용이 오늘의 Todo에도 자동으로 반영되길 원한다. 그래야 이중으로 체크할 필요가 없다.

#### 수용 기준

1. THE MedicationModule SHALL 투약 스케줄 목록의 각 항목에 투약 완료 체크 버튼을 제공한다.
2. WHEN 간호사가 투약 완료 체크를 하면, THE MedicationModule SHALL 해당 항목에 시각적 완료 표시(취소선 또는 완료 배지)를 적용한다.
3. WHEN 투약 항목이 완료 처리되면, THE TaskModule SHALL `tasksSlice`에서 해당 환자의 `category === 'Medication'`인 태스크 중 약물명이 일치하는 항목을 자동으로 `'Completed'`로 변경한다.
4. THE MedicationModule SHALL 처방(Prescription)의 `frequency` 및 `startDate` 필드를 기반으로 다음 투여 예정 시각(scheduled time)을 계산하여 의사 처방 오더 목록에 표시한다.
5. THE MedicationModule SHALL 투약 스케줄을 scheduleSlice 기반으로 현재 근무 중인 교대(Day/Evening/Night)의 간호사만 해당 교대 시간대 투약을 담당하도록 필터링한다.

---

### 요구사항 7: 물품 재고(Inventory) 완전 제거

**User Story:** 시스템 관리자로서, 사용하지 않는 재고 관리 모듈을 완전히 제거하여 시스템을 단순화하고 싶다.

#### 수용 기준

1. THE System SHALL `InventoryPage` 컴포넌트, `inventorySlice`, `InventoryItemCard`, `InventorySummary`, `InventoryTabs` 컴포넌트 파일을 코드베이스에서 삭제한다.
2. THE System SHALL 네비게이션(BottomNav, Sidebar, AppLayout)에서 재고 관련 링크와 메뉴 항목을 완전히 제거한다.
3. THE System SHALL `store/index.ts`에서 `medicationAutoConsumeMiddleware`를 제거하고, `inventorySlice`의 import 및 `inventory` 리듀서 등록을 삭제한다.
4. THE System SHALL `/inventory` 라우트를 App.tsx에서 제거한다.
5. IF 재고 관련 코드가 삭제된 후 빌드를 실행하면, THEN THE System SHALL 컴파일 오류 없이 빌드를 완료한다.

---

### 요구사항 8: 인수인계 보고서 하드코딩 제거 및 실데이터 연동

**User Story:** 일반 간호사로서, 인수인계 보고서 미리보기에서 실제 저장된 데이터가 표시되길 원한다. 하드코딩된 샘플 데이터가 아닌 내가 작성한 실제 정보를 확인하고 싶다.

#### 수용 기준

1. THE HandoverModule SHALL `store/index.ts`에서 `mockInitReports` 하드코딩 초기 데이터 주입 로직을 제거한다. 보고서가 없으면 빈 배열로 시작한다.
2. THE HandoverModule SHALL `ShiftReportModal`에서 Props 또는 Redux store의 `shiftReportsSlice.reports`에서 실제 저장된 데이터를 불러와 렌더링한다.
3. WHEN 간호사가 인수인계 보고서를 저장하면, THE HandoverModule SHALL 저장 시점의 타임스탬프, 간호사명(`nurseName`), 담당 환자의 스냅샷(`patientSnapshots`)을 정확히 `shiftReportSlice`에 기록한다.
4. THE HandoverModule SHALL 보고서 저장 시 `patientSnapshots`에 포함되는 환자 스냅샷을 `patientsSlice`와 `tasksSlice`의 현재 실시간 데이터 기반으로 생성한다 (하드코딩 금지).
5. WHEN 저장된 보고서가 없으면, THE HandoverModule SHALL 보고서 미리보기 영역에 '저장된 보고서가 없습니다' 빈 상태 메시지를 표시한다.

---

### 요구사항 9: 전체 페이지 scheduleSlice 연동

**User Story:** 수간호사로서, 시스템의 모든 페이지(대시보드, 동료현황, 투약, Todo, 인수인계)가 실제 근무표를 기준으로 동작하길 원한다. 그래야 근무표와 실제 운영이 일치한다.

#### 수용 기준

1. THE Scheduler SHALL 오늘 날짜의 ShiftCode를 기준으로 어떤 간호사가 어떤 교대(Day/Evening/Night)를 담당하는지 결정하는 유틸 함수를 제공한다.
2. WHERE scheduleSlice에 해당 월 근무표가 저장되어 있지 않으면, THE Scheduler SHALL 각 간호사의 `Nurse.shiftType` 필드를 fallback으로 사용한다.
3. THE AssignmentModule SHALL `assignmentsSlice`의 `byDate[date][patientId]`에 Day, Evening, Night 교대별 담당 간호사 ID를 모두 저장할 수 있는 구조를 유지한다.
4. THE HandoverModule SHALL 인수인계 페이지 접근 시 scheduleSlice 기반으로 현재 근무조를 판단하고, 이전 교대의 보고서를 올바르게 조회한다.

---

### 요구사항 10: 환자 등록 정상화

**User Story:** 수간호사로서, 환자를 새로 등록하면 즉시 시스템 전체에 반영되길 원한다. 페이지를 새로고침하지 않아도 동료현황, 수간호사 페이지에서 바로 확인되어야 한다.

#### 수용 기준

1. WHEN `PatientFormPage`에서 환자 등록 폼이 제출되면, THE System SHALL `patientsSlice`에 신규 환자를 즉시 추가한다.
2. WHEN 환자가 `patientsSlice`에 추가되면, THE AssignmentModule SHALL `assignmentsSlice`에 오늘 날짜 기준으로 scheduleSlice에서 현재 근무 중인 간호사에게 기본 배정(Day/Evening/Night)을 자동으로 생성한다.
3. WHEN 환자 등록이 완료되면, THE System SHALL ColleaguesPage 및 HeadNursePage에서 새 환자가 즉시 반영된다.
4. IF 환자 등록 폼에서 필수 필드(이름, 병실번호, 진단명)가 비어있으면, THEN THE System SHALL 등록을 차단하고 오류 메시지를 표시한다.

---

### 요구사항 11: 근무조별 병상 가동률 차트 정상화

**User Story:** 수간호사로서, 병상 가동률 차트에서 Day/Evening/Night 교대별 실제 병상 가동 현황을 정확히 파악하고 싶다.

#### 수용 기준

1. THE HeadNurseView SHALL `OccupancyChart` 컴포넌트가 교대별 병상 가동률을 `scheduleSlice` 기반으로 계산한다. 구체적으로 Day/Evening/Night 각 교대에 배정된 간호사가 담당하는 환자 수의 합을 교대별 가동 병상 수로 사용한다.
2. THE HeadNurseView SHALL `OccupancyChart` 컴포넌트에서 하드코딩된 교대별 병상 수 데이터를 제거한다.
3. WHERE scheduleSlice에 근무표가 없으면, THE HeadNurseView SHALL 전체 입원 환자 수를 3으로 나눈 값을 교대별 기본값으로 사용한다.

---

### 요구사항 12: 수간호사 페이지 자동 재배정 기능 제거

**User Story:** 수간호사로서, 시스템이 자동으로 재배정 제안을 표시하지 않길 원한다. 재배정은 수간호사가 직접 판단하여 수행해야 한다.

#### 수용 기준

1. THE HeadNurseView SHALL `ReassignBanner` 컴포넌트를 HeadNursePage에서 제거한다.
2. THE System SHALL `getReassignmentSuggestion` 함수 호출과 관련 state를 HeadNursePage에서 제거한다.
3. THE System SHALL `ReassignBanner.tsx` 파일을 삭제한다.
4. IF 자동 재배정 관련 코드가 제거된 후 빌드를 실행하면, THEN THE System SHALL 컴파일 오류 없이 빌드를 완료한다.

---

### 요구사항 13: 다크모드 텍스트 가시성 수정

**User Story:** 시스템 사용자로서, 다크모드에서 텍스트가 검게 하드코딩되어 보이지 않는 문제를 수정하길 원한다.

#### 수용 기준

1. THE System SHALL 모든 페이지 컴포넌트에서 `color: '#1A2B38'`, `color: '#000'`, `color: 'black'`과 같이 하드코딩된 어두운 색상 값을 `var(--color-text)` 또는 `var(--color-muted)` CSS 변수로 교체한다.
2. THE System SHALL 배경색 하드코딩(`background: '#ffffff'`, `background: 'white'`)을 `var(--color-surface)` 또는 `var(--color-bg)` CSS 변수로 교체한다.
3. WHEN 다크모드가 활성화되면, THE System SHALL 모든 텍스트와 배경이 다크모드 CSS 변수 값으로 올바르게 렌더링된다.
4. THE System SHALL 상태별 하이라이트 색상(위험: `#C0392B`, 경고: `#D4860A`, 정상: `#2E7D5E`)은 의미 전달을 위해 유지하되, 일반 텍스트 색상은 CSS 변수를 사용한다.

---

### 요구사항 14: 근무 일정(SchedulePage) 표시 시간 정확화

**User Story:** 일반 간호사로서, 근무 일정 페이지에서 내 교대의 실제 시작/종료 시간이 정확하게 표시되길 원한다.

#### 수용 기준

1. THE Scheduler SHALL SchedulePage의 범례 및 근무 상세 리스트에서 `SHIFT_TIMES` 상수를 참조하여 교대 시간을 표시한다.
2. THE Scheduler SHALL 다음과 같은 정확한 교대 시간을 표시한다:
   - Day: 07:30 ~ 16:00
   - Evening: 15:30 ~ 00:00
   - Night: 23:30 ~ 08:00
3. THE Scheduler SHALL SchedulePage 내부에 하드코딩된 시간 문자열(`'06:00 ~ 15:00'`, `'14:00 ~ 23:00'`, `'22:00 ~ 07:00'` 등)을 모두 제거한다.
