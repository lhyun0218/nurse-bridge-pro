# Implementation Plan

## Overview

Nurse-Bridge PRO React 구현을 8개 태스크로 나눠 진행한다. 공통 컴포넌트 → 레이아웃 → 로그인 → 대시보드 → 환자 상세 → 재고 → 수간호사 관제 → 앱 초기화 순서로 구현한다. 견본 HTML 5개의 디자인 토큰과 레이아웃을 그대로 React 컴포넌트로 이식하며, MSW로 API를 시뮬레이션한다.

## Tasks

- [x] 1. 공통 컴포넌트 라이브러리 구현
  - `src/components/common/SeverityBadge.tsx` 구현 (High/Medium/Low 색상 배지)
  - `src/components/common/VitalChip.tsx` 구현 (이상 수치 색상 강조)
  - `src/components/common/ProgressBar.tsx` 구현 (완료율 진행 바, ok/warn/danger 색상)
  - `src/components/common/Button.tsx` 구현 (primary/outline/danger/ghost/done variant)
  - `src/components/common/Toast.tsx` 구현 (성공/오류 토스트 메시지)
  - `src/components/common/index.ts` 일괄 export 파일 생성
  - _Requirements: Requirement 7_

- [x] 2. 레이아웃 컴포넌트 구현
  - `src/components/layout/Sidebar.tsx` 구현 (220px 고정, 네비게이션 링크, 모바일 슬라이드)
  - `src/components/layout/Topbar.tsx` 구현 (페이지 제목, 현재 시간 1초 업데이트, 알림 버튼)
  - `src/components/layout/BottomNav.tsx` 구현 (모바일 하단 5탭 네비게이션)
  - `src/components/layout/AppLayout.tsx` 구현 (Sidebar + 콘텐츠 + BottomNav 조합)
  - Framer Motion 페이지 전환 애니메이션 적용 (fadeIn, y 20→0)
  - _Requirements: Requirement 6_

- [x] 3. 로그인 페이지 구현
  - `src/pages/LoginPage.tsx` 구현 (사번/비밀번호 폼, 근무조 라디오 버튼)
  - MSW POST /api/auth/login 호출 및 Redux loginSuccess 디스패치
  - 역할별 라우팅 (Nurse → /dashboard, HeadNurse → /head-nurse)
  - 인증 실패 오류 메시지 표시
  - 데모 계정 버튼 2개 구현 (EMP001 일반 간호사, EMP006 수간호사)
  - Framer Motion 로그인 카드 페이드인 애니메이션 적용
  - `src/App.tsx` ProtectedRoute 및 HeadNurse 전용 라우트 보호 완성
  - _Requirements: Requirement 1_

- [x] 4. 메인 대시보드 구현
  - `src/hooks/useMyPatients.ts` 커스텀 훅 구현 (담당 환자 필터링 + 중증도 정렬)
  - `src/components/dashboard/StatCards.tsx` 구현 (High/Medium/Low 수, Todo 완료율)
  - `src/components/dashboard/AlertBanner.tsx` 구현 (위험 환자 알림 칩)
  - `src/components/dashboard/QuickMenu.tsx` 구현 (5개 퀵 메뉴 카드)
  - `src/components/patient/PatientCard.tsx` 구현 (견본 HTML 구조 이식, hover 애니메이션)
  - `src/components/patient/PatientGrid.tsx` 구현 (4열/2열/1열 반응형 그리드)
  - 중증도 필터 버튼 구현 (전체/High/Medium/Low)
  - `src/pages/DashboardPage.tsx` 조합 및 MSW GET /api/patients, /api/tasks 호출
  - 퇴근 신청 버튼 활성화 조건 구현 (모든 Todo 완료 시에만 활성)
  - _Requirements: Requirement 2_

- [x] 5. 환자 상세 페이지 구현
  - `src/components/patient/AISummaryCard.tsx` 구현 (1.5초 로딩 후 Mock 요약 표시, Framer Motion 순차 등장)
  - `src/components/patient/VitalSignsGrid.tsx` 구현 (6개 활력징후 그리드, 이상 수치 색상)
  - `src/components/patient/LabResultsGrid.tsx` 구현 (검사 결과 2열 그리드)
  - `src/components/patient/MedicationList.tsx` 구현 (약물 목록, 투여경로 배지)
  - `src/components/patient/TodoList.tsx` 구현 (체크박스, 카테고리 배지, 소요시간)
  - Todo 체크 시 Redux toggleTask 디스패치 + Framer Motion 체크 애니메이션
  - 완료율 ProgressBar 실시간 업데이트
  - 저장 버튼 → 인수인계 로그 생성 + 성공 토스트 표시
  - `src/pages/PatientDetailPage.tsx` 조합 및 useParams로 환자 ID 조회
  - _Requirements: Requirement 3_

- [x] 6. 재고 관리 페이지 구현
  - `src/components/inventory/InventorySummary.tsx` 구현 (충분/부족/긴급 요약 카드)
  - `src/components/inventory/InventoryTabs.tsx` 구현 (카테고리별 탭)
  - `src/components/inventory/InventoryItem.tsx` 구현 (컬러 보더, 재고 바, 소비/청구 버튼)
  - 소비 버튼 클릭 → Redux consumeItem 디스패치 + 상태 재계산
  - 청구 버튼 클릭 → MSW POST /api/inventory/:id/request + 토스트
  - 재고 0 시 소비 버튼 비활성화
  - 부족 물품 일괄 청구 버튼 구현
  - `src/pages/InventoryPage.tsx` 조합 및 MSW GET /api/inventory 호출
  - _Requirements: Requirement 4_

- [x] 7. 수간호사 관제 대시보드 구현
  - `src/components/head-nurse/OccupancyChart.tsx` 구현 (Recharts BarChart, 근무조별 병상 가동률)
  - `src/components/head-nurse/SeverityPieChart.tsx` 구현 (Recharts PieChart 도넛, 중증도 분포)
  - `src/components/head-nurse/OvertimeChart.tsx` 구현 (Recharts 수평 BarChart, 간호사별 오버타임)
  - `src/components/head-nurse/NurseStatusTable.tsx` 구현 (간호사 현황 테이블, 오버타임 색상 강조)
  - `src/utils/overtime.ts` AI 재배치 추천 로직 구현 (규칙 기반)
  - `src/components/head-nurse/ReassignBanner.tsx` 구현 (AI 추천 배너, 적용 버튼)
  - 재배치 적용 → Redux reassignPatient 디스패치 + 차트/테이블 즉시 업데이트
  - `src/pages/HeadNursePage.tsx` 조합 및 HeadNurse 전용 라우트 보호
  - _Requirements: Requirement 5_

- [x] 8. 앱 초기화 및 마무리
  - 앱 시작 시 MSW GET /api/patients, /api/tasks, /api/inventory, /api/nurses 호출하여 Redux Store 초기화
  - `src/App.tsx` 라우팅 구조 완성 (모든 페이지 연결)
  - 전체 빌드 확인 (`npm run build` 에러 없음)
  - GitHub 커밋 및 푸시
  - _Requirements: Requirement 1, 2, 3, 4, 5, 6_

- [x] 9. 실시간 활력징후 모니터링
  - `src/hooks/useVitalMonitor.ts` 구현 — 5초마다 활력징후 Mock 업데이트 (useEffect + setInterval)
  - 혈당 > 180, SpO₂ < 94%, 혈압 > 160/100 등 임계값 초과 시 Redux 알림 상태 업데이트
  - 활력징후 수치 변화 시 Framer Motion 숫자 카운트업 애니메이션 적용
  - 임계값 초과 시 대시보드 AlertBanner에 즉시 알림 칩 추가
  - 환자 상세 페이지 VitalSignsGrid에 "실시간" 배지 표시
  - _Requirements: Requirement 3_

- [x] 10. 투약 타이머 알림
  - `src/hooks/useMedicationTimer.ts` 구현 — 처방 약물의 다음 투여 시간까지 카운트다운
  - 투여 10분 전 대시보드 AlertBanner에 자동 알림 등장 ("Ceftriaxone IV — 8분 후 투여 예정")
  - 환자 상세 MedicationList에 각 약물별 다음 투여까지 남은 시간 표시
  - 투여 시간 도달 시 Topbar 알림 버튼 빨간 점 배지 업데이트
  - _Requirements: Requirement 3_

- [x] 11. 인수인계 보고서 자동 생성
  - `src/components/report/ShiftReportModal.tsx` 구현 — 퇴근 신청 시 모달로 보고서 미리보기
  - 오늘 완료한 Todo, 미완료 항목(사유 입력), 특이사항 자동 정리
  - `react-to-print` 라이브러리로 PDF 인쇄/다운로드 기능 구현
  - 보고서 생성 시 Framer Motion 슬라이드업 모달 애니메이션 적용
  - _Requirements: Requirement 3_

- [x] 12. 환자 검색 및 복합 필터
  - 대시보드 상단에 실시간 검색창 추가 (이름, 병실번호, 진단명 검색)
  - 중증도 + 진단명 복합 필터 드롭다운 구현
  - 검색어 입력 시 Framer Motion으로 카드 목록 필터링 애니메이션 (AnimatePresence)
  - 검색 결과 없을 때 빈 상태 UI 표시
  - _Requirements: Requirement 2_

- [x] 13. 다크 모드
  - `src/hooks/useTheme.ts` 구현 — localStorage에 테마 설정 저장
  - Tailwind CSS `dark:` 클래스로 모든 컴포넌트 다크 모드 스타일 적용
  - Topbar에 라이트/다크 토글 버튼 추가 (Framer Motion 전환 애니메이션)
  - 야간 근무(Night Shift) 로그인 시 자동으로 다크 모드 활성화
  - _Requirements: Requirement 6_

- [x] 14. 알림 센터 (Notification Center)
  - `src/components/notifications/NotificationPanel.tsx` 구현 — 우측 슬라이드 패널
  - Topbar 알림 버튼 클릭 시 Framer Motion 슬라이드인 패널 표시
  - 알림 타입별(danger/warn/info) 필터 탭 구현
  - 읽음/안읽음 구분, 전체 읽음 처리 버튼
  - Redux notificationsSlice 추가 — 알림 목록 전역 상태 관리
  - _Requirements: Requirement 2_

- [x] 15. 근무 일정 캘린더
  - `/schedule` 라우트 및 `src/pages/SchedulePage.tsx` 구현
  - 월별 캘린더 뷰 — Day(파랑)/Evening(주황)/Night(남색) 근무조 색상 구분
  - 오버타임 발생 날짜 빨간 점 표시
  - 이번 달 근무 통계 요약 카드 (총 근무일, 오버타임 합계, 야간 근무 횟수)
  - Sidebar 네비게이션에 "근무 일정" 링크 연결
  - _Requirements: Requirement 6_

- [x] 16. 환자 등록 및 수정 (수간호사 전용)
  - `src/pages/PatientFormPage.tsx` 구현 — 새 환자 등록 / 기존 환자 수정 폼
  - 진단명 입력 시 해당 진단의 Todo 템플릿 자동 미리보기
  - 담당 간호사 배정 드롭다운 (현재 오버타임 상태 표시)
  - 폼 제출 시 Redux setPatients 업데이트 + 성공 토스트
  - 수간호사 관제 대시보드에 "환자 등록" 버튼 추가
  - _Requirements: Requirement 5_

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": [1] },
    { "wave": 2, "tasks": [2] },
    { "wave": 3, "tasks": [3] },
    { "wave": 4, "tasks": [4, 6] },
    { "wave": 5, "tasks": [5, 7, 12] },
    { "wave": 6, "tasks": [8, 9, 10, 13, 14] },
    { "wave": 7, "tasks": [11, 15, 16] }
  ]
}
```

## Notes

- 모든 컴포넌트는 견본 HTML(dashboard.html, patient-detail.html, inventory.html, head-nurse.html, index.html)의 디자인 토큰과 레이아웃을 그대로 이식한다
- 색상 토큰: primary #2C6E8A, danger #C0392B, warn #D4860A, ok #2E7D5E
- Tailwind CSS v4 `@theme` 블록에 CSS 변수로 정의된 토큰을 사용한다
- Phase 2 AI 연동(Claude API)은 Task 5의 AISummaryCard에서 확장 가능하도록 설계한다
- 데모 계정: EMP001/1234 (일반 간호사), EMP006/1234 (수간호사)
- Task 9~16은 핵심 기능(Task 1~8) 완성 후 순차적으로 구현한다
- Task 13 다크 모드: Night Shift 로그인 시 자동 활성화로 임상 배려 어필
- Task 11 인수인계 보고서: react-to-print 라이브러리 추가 설치 필요 (`npm install react-to-print`)
