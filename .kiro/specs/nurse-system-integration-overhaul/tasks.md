# Implementation Plan

## Overview

Nurse Bridge Pro 시스템의 전면 연동 개선 작업입니다. scheduleSlice를 단일 진실 소스로 삼아 모든 슬라이스를 연결하고 하드코딩을 제거합니다. 총 15개 태스크로 구성되며, 기반 인프라(상수/슬라이스) → 제거 작업 → 기능 개선 → 검증 순으로 진행합니다.

## Tasks

- [x] 1. SHIFT_TIMES 공유 상수 파일 생성
  - `src/constants/shiftTimes.ts` 신규 파일 생성
  - `SHIFT_TIMES` 상수 정의 (Day: 07:30~16:00 / Evening: 15:30~00:00 / Night: 23:30~08:00)
  - `shiftCodeToType(code)`, `minutesUntilShiftEnd(shiftType, now?)`, `isOnTimeDeparture(shiftType, now?)`, `getNurseShiftToday(nurseId, rows, dateIndex, fallback)` 함수 export
  - **Requires:** 없음

- [x] 2. Inventory 모듈 완전 제거
  - `src/pages/InventoryPage.tsx` 삭제
  - `src/store/slices/inventorySlice.ts` 삭제
  - `src/components/inventory/` 폴더 전체 삭제 (InventoryItemCard, InventorySummary, InventoryTabs)
  - `store/index.ts`에서 inventoryReducer import, `inventory` 리듀서 등록, `medicationAutoConsumeMiddleware` 전체 제거
  - `App.tsx`에서 `/inventory` 라우트 및 InventoryPage import 제거
  - 네비게이션(BottomNav, Sidebar, AppLayout)에서 재고 메뉴 항목 제거
  - `mockData.ts`에서 `mockInventory` 및 `InventoryItem` import 제거
  - **Requires:** 없음

- [x] 3. 수간호사 자동 재배정 기능 제거
  - `src/components/head-nurse/ReassignBanner.tsx` 파일 삭제
  - `src/components/head-nurse/index.ts`에서 `ReassignBanner` export 제거
  - `HeadNursePage.tsx`에서 `ReassignBanner` JSX, `getReassignmentSuggestion` 호출, `suggestion` 상태, `handleReassign` 함수 모두 제거
  - **Requires:** 없음

- [x] 4. attendanceSlice 확장 (휴게 및 조기퇴근)
  - `AttendanceRecord` 인터페이스에 `breakStart?: number`, `breakEnd?: number`, `earlyLeaveReason?: string` 필드 추가
  - `startBreak` 액션 추가 — checkIn 없으면 무시, 있으면 `onBreak: true` + `breakStart: Date.now()`
  - `endBreak` 액션 추가 — `onBreak: false` + `breakEnd: Date.now()`
  - `requestEarlyLeave` 액션 추가 — `checkoutRequested: true` + `earlyLeaveReason` 저장
  - **Requires:** 없음

- [x] 5. computeStatus 수정 (BeforeShift 상태 추가)
  - `StatusKey` 타입에 `'BeforeShift'` 추가
  - `computeStatus` 함수 시그니처에 `shiftType: ShiftType` 파라미터 추가
  - checkIn 기록 없을 때 현재 시각이 `SHIFT_TIMES[shiftType].workStart` 이전이면 `'BeforeShift'` 반환
  - checkIn 기록 없을 때 `isNowInRange` 기반 `'Active'` 반환 경로 완전 제거
  - **Requires:** 1

- [x] 6. 근태 페이지 명칭 변경 및 휴게/퇴근 로직 구현
  - `AttendancePage.tsx` 헤더 `'출근 · 퇴근'` → `'근태'`, 캘린더 `'출석 달력'` → `'근태 달력'` 변경
  - `HeadNurseAttendancePage.tsx` `'출석 관리'` → `'근태 관리'`, `'월별 출석 현황'` → `'월별 근태 현황'` 변경
  - `AttendancePage.tsx`에 휴게 시작 버튼 추가 (출근 후 활성화, `startBreak` dispatch)
  - `AttendancePage.tsx`에 휴게 종료 버튼 추가 (휴게 중 활성화, `endBreak` dispatch)
  - 정시 퇴근: `isOnTimeDeparture()` true이면 퇴근 버튼 즉시 활성화 (승인 불필요)
  - 조기 퇴근: `isOnTimeDeparture()` false이면 `'조기 퇴근 신청'` 버튼만 표시
  - `EarlyLeaveModal` 컴포넌트 구현 (textarea 사유 입력, `requestEarlyLeave` dispatch + broadcast)
  - `HeadNurseAttendancePage.tsx` 레코드 카드에 `breakStart`/`breakEnd` 표시
  - 수간호사 조기 퇴근 승인 시 `earlyLeaveReason` 표시 추가
  - **Requires:** 1, 4, 5

- [x] 7. 대시보드 남은 근무 시간 위젯 연동
  - 대시보드/Topbar의 남은 근무 위젯 위치 파악 및 수정
  - `checkOut` 기록 있으면 `'퇴근 완료'` 표시
  - 출근 전이면 `'출근 전'` 표시
  - 근무 중이면 `minutesUntilShiftEnd(shiftType)` 계산 결과 표시 (1분 인터벌 갱신)
  - `Nurse.workEnd` 하드코딩 참조 제거, `SHIFT_TIMES` 기반으로 교체
  - **Requires:** 1, 4

- [x] 8. 인수인계 보고서 하드코딩 제거 및 실데이터 연동
  - `store/index.ts`의 `mockInitReports` 배열 정의 및 `store.dispatch(setReports(...))` 블록 전체 삭제
  - `buildPatientSnapshots(patients, tasks, notes)` 유틸 함수 구현
  - `HandoverPage.tsx` 보고서 저장 시 `buildPatientSnapshots` 호출하여 실시간 스냅샷 생성
  - 저장 시 `nurseName`, `shiftDate`(현재 ISO 문자열), `patientSnapshots` 포함 확인
  - `ShiftReportModal.tsx` 보고서 없을 때 `'저장된 보고서가 없습니다'` 빈 상태 메시지 표시
  - **Requires:** 없음

- [x] 9. 투약 스케줄 체크 기능 및 Todo 연동
  - `MedicationSchedulePage.tsx`에 `checkedMeds: Set<string>` 로컬 상태 추가
  - 투약 스케줄 테이블 각 행에 체크 버튼(원형 체크박스) 추가
  - 체크 시 `checkedMeds`에 키 추가 + 취소선 스타일 적용
  - 체크 시 `tasksSlice`에서 해당 환자 `category === 'Medication'` && 약물명 일치 Pending 태스크 `toggleTask` dispatch
  - 의사 처방 오더 탭에 '다음 투여 예정 시각' 컬럼 추가
  - `calcNextDoseTime(prescription)` 함수 구현 (frequency 파싱 후 다음 투여 시각 계산)
  - **Requires:** 없음

- [x] 10. 동료 현황 데이터 정확화
  - `ColleaguesPage.tsx`에서 `scheduleSlice` 현재 월 근무표 조회
  - `getNurseShiftToday` 함수로 각 간호사 오늘 ShiftType 계산 (없으면 `nurse.shiftType` fallback)
  - 근무 시간 표시를 `SHIFT_TIMES[todayShiftType]` 기반으로 교체 (nurse.workStart/workEnd 제거)
  - 담당 환자 수를 `assignmentsSlice.byDate[todayKey]` 기반으로 계산
  - `STATUS_CONFIG`에 `BeforeShift` 항목 추가, `computeStatus` 호출 시 shiftType 인자 전달
  - **Requires:** 1, 5

- [x] 11. 환자 등록 정상화
  - `patientsSlice`에 `addPatient` 액션 추가 (없는 경우)
  - `PatientFormPage.tsx` 필수 필드(이름, 병실번호, 진단명) 검증 및 오류 메시지 표시
  - 폼 제출 성공 시 `dispatch(addPatient(newPatient))` 즉시 실행
  - 신규 환자 등록 후 `autoAssignPatients` 호출하여 오늘 날짜 배정 생성 및 `setAssignments` dispatch
  - 등록 완료 후 헤드너스 페이지로 리다이렉트
  - **Requires:** 없음

- [x] 12. OccupancyChart 병상 가동률 정상화
  - `OccupancyChart.tsx` 하드코딩된 교대별 병상 수 데이터 제거
  - `scheduleSlice` 및 `assignmentsSlice` 기반 교대별 담당 환자 수 계산 로직 구현
  - scheduleSlice 없을 때 `Math.floor(patients.length / 3)` fallback 적용
  - 차트에 실제 계산 데이터 반영
  - **Requires:** 1

- [x] 13. 다크모드 하드코딩 텍스트 색상 수정
  - 전체 컴포넌트에서 `color: '#1A2B38'` → `var(--color-text)` 교체
  - `color: '#6B8090'` (일반 보조 텍스트) → `var(--color-muted)` 교체
  - `background: '#FFF'`, `background: '#ffffff'` → `var(--color-surface)` 교체
  - `border: '1px solid #E8EDF0'` → `var(--color-border)` 교체
  - 특히 `HandoverPage.tsx`, `HeadNursePage.tsx`, `HeadNurseAttendancePage.tsx` 집중 점검
  - **Requires:** 없음

- [x] 14. 근무 일정 페이지 시간 표시 정확화
  - `SchedulePage.tsx` 범례 시간 문자열 하드코딩 전부 `SHIFT_TIMES` 참조로 교체
  - 근무 상세 리스트의 `shiftTime` 변수 하드코딩 → `SHIFT_TIMES` 조회로 교체
  - **Requires:** 1

- [x] 15. 전체 빌드 검증
  - `npm run build` 실행하여 컴파일 오류 없음 확인
  - Inventory 관련 import 잔재 전체 검색 확인
  - ReassignBanner 관련 import 잔재 전체 검색 확인
  - 하드코딩된 교대 시간 문자열 잔재 검색 (`'06:00'`, `'15:00'`, `'14:00'` 등)
  - `'출석'` 텍스트 잔재 검색 (`'출석 관리'`, `'출석 달력'`)
  - **Requires:** 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": [1, 2, 3, 4, 8, 9, 11, 13] },
    { "wave": 2, "tasks": [5, 6, 7, 10, 12, 14] },
    { "wave": 3, "tasks": [15] }
  ]
}
```

## Notes

- Task 1은 다른 많은 태스크의 기반이므로 가장 먼저 완료해야 합니다.
- Task 2, 3은 삭제 작업으로 독립적으로 빠르게 처리 가능합니다.
- 다크모드 수정(Task 13)은 다른 태스크와 병행 진행 가능합니다.
- `SHIFT_TIMES.Evening.workEnd = '00:00'`, `SHIFT_TIMES.Night.workEnd = '08:00'`은 자정 경계를 넘으므로 `minutesUntilShiftEnd` 구현 시 반드시 다음 날 날짜 처리가 필요합니다.
- 기존 `onBreak: boolean` 필드가 attendanceSlice에 이미 있으므로 Task 4에서 해당 필드는 유지하고 `breakStart`/`breakEnd` 타임스탬프만 추가합니다.
