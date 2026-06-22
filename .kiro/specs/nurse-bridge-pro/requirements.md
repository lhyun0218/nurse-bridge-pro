# Requirements Document

## Introduction

Nurse-Bridge PRO는 병원 간호사의 교대 근무 중 발생하는 인수인계 누락, 반복적 행정 업무, 병동 관제 어려움을 해결하기 위한 웹 기반 간호 업무 지원 시스템이다. React 18 + TypeScript + Redux Toolkit 기반으로 구현되며, 5개 화면(로그인, 메인 대시보드, 환자 상세, 재고 관리, 수간호사 관제)을 제공한다. MSW(Mock Service Worker)를 통해 API를 시뮬레이션하고, Framer Motion 애니메이션과 Recharts 차트를 활용한다.

## Glossary

- **System**: Nurse-Bridge PRO 웹 애플리케이션 전체
- **Auth_Module**: 로그인 및 인증 처리 모듈 (authSlice + LoginPage)
- **Dashboard**: 메인 대시보드 화면 (SCR-02)
- **Patient_Detail**: 환자 상세 페이지 (SCR-03)
- **Inventory_Module**: 재고 관리 화면 (SCR-04)
- **HeadNurse_Dashboard**: 수간호사 관제 대시보드 (SCR-05)
- **Redux_Store**: Redux Toolkit 기반 전역 상태 저장소 (authSlice, patientsSlice, tasksSlice, inventorySlice, nursesSlice)
- **MSW**: Mock Service Worker — API 요청을 가로채 Mock 응답을 반환하는 서비스 워커
- **Severity**: 환자 중증도 — High(위험), Medium(주의), Low(안정) 세 단계
- **NursingTask**: 간호 업무 항목 — taskId, patientId, taskName, status(Pending/Completed), category 포함
- **InventoryItem**: 재고 물품 항목 — itemId, itemName, category, quantity, reorderPoint, status 포함
- **ShiftType**: 근무조 — Day(주간), Evening(저녁), Night(야간)
- **UserRole**: 사용자 역할 — Nurse(일반 간호사), HeadNurse(수간호사), Admin(관리자)
- **SeverityBadge**: 중증도를 색상과 텍스트로 표시하는 UI 컴포넌트
- **VitalChip**: 활력징후 수치를 이상 여부에 따라 색상으로 표시하는 UI 컴포넌트
- **ProgressBar**: 완료율을 시각적으로 표시하는 진행 바 컴포넌트
- **Topbar**: 페이지 상단 바 (페이지 제목, 현재 시간, 알림 버튼 포함)
- **Sidebar**: 좌측 고정 네비게이션 바 (데스크톱 220px 고정)
- **BottomNav**: 모바일 하단 네비게이션 바
- **AI_Summary**: Mock 텍스트 기반 AI 인수인계 요약 (최대 5줄)
- **OccupancyChart**: 병상 가동률 Bar Chart (Recharts)
- **SeverityPieChart**: 환자 중증도 분포 Pie Chart (Recharts)
- **OvertimeChart**: 간호사별 오버타임 Horizontal Bar Chart (Recharts)

---

## Requirements

### Requirement 1: 인증 및 권한 관리 (AUTH)

**User Story:** As a 간호사, I want to 사번과 비밀번호로 로그인하고 근무조를 선택할 수 있기를, so that 내 역할에 맞는 화면으로 안전하게 접근할 수 있다.

#### Acceptance Criteria

1. WHEN 사용자가 사번(employeeId)과 비밀번호를 입력하고 로그인 버튼을 클릭하면, THE Auth_Module SHALL MSW POST /api/auth/login 엔드포인트를 호출하여 인증을 처리해야 한다
2. WHEN 인증이 성공하면, THE Auth_Module SHALL Redux loginSuccess 액션을 디스패치하고 사용자 역할(UserRole)에 따라 Nurse는 /dashboard로, HeadNurse는 /head-nurse로 라우팅해야 한다
3. WHEN 인증이 실패하면, THE Auth_Module SHALL 오류 메시지("사번 또는 비밀번호가 올바르지 않습니다.")를 폼 하단에 표시하고 입력 필드를 초기화하지 않아야 한다
4. THE Auth_Module SHALL 로그인 폼에 Day / Evening / Night 세 가지 근무조 선택 라디오 버튼을 제공해야 한다
5. WHEN 근무조가 선택되면, THE Auth_Module SHALL 선택된 ShiftType을 Redux updateShift 액션으로 저장해야 한다
6. THE Auth_Module SHALL 데모 계정 버튼 2개(일반 간호사: EMP001/1234, 수간호사: EMP006/1234)를 제공하여 클릭 시 해당 자격증명을 자동 입력해야 한다
7. WHILE 사용자가 인증된 상태이면, THE System SHALL 보호된 라우트(/dashboard, /head-nurse, /patient/:id, /inventory)에 접근을 허용해야 한다
8. IF 인증되지 않은 사용자가 보호된 라우트에 접근하면, THEN THE System SHALL /login 페이지로 리다이렉트해야 한다
9. THE Auth_Module SHALL Framer Motion을 사용하여 로그인 카드에 페이드인(opacity 0→1, y 20→0) 진입 애니메이션을 적용해야 한다
10. WHERE 사용자가 HeadNurse 역할이 아닌 경우, THE System SHALL /head-nurse 라우트 접근을 차단하고 /dashboard로 리다이렉트해야 한다

---

### Requirement 2: 메인 대시보드 (DASH)

**User Story:** As a 일반 간호사, I want to 내 담당 환자 목록과 병동 현황을 한눈에 파악하기를, so that 업무 우선순위를 빠르게 결정하고 중요한 환자에게 집중할 수 있다.

#### Acceptance Criteria

1. WHEN 대시보드가 로드되면, THE Dashboard SHALL Redux Store에서 현재 로그인한 간호사의 assignedPatients 목록에 해당하는 환자만 필터링하여 표시해야 한다
2. THE Dashboard SHALL 환자 카드를 중증도 순(High → Medium → Low)으로 정렬하여 표시해야 한다
3. THE Dashboard SHALL 상단에 통계 요약 카드 4개(High 환자 수, Medium 환자 수, Low 환자 수, Todo 전체 완료율)를 표시해야 한다
4. THE Dashboard SHALL 위험 환자 알림 배너를 표시하고, 각 알림 칩은 danger(빨강)/warn(주황)/info(파랑) 색상으로 구분해야 한다
5. THE Dashboard SHALL 퀵 메뉴 5개(물품재고→/inventory, 투약스케줄, 동료현황, 인수인계, 퇴근신청)를 제공해야 한다
6. WHEN 퇴근신청 버튼이 클릭되면, THE Dashboard SHALL 현재 로그인한 간호사의 모든 담당 환자 Todo가 전부 완료된 경우에만 퇴근 신청을 허용하고, 미완료 Todo가 있으면 경고 메시지를 표시해야 한다
7. THE Dashboard SHALL 각 환자 카드에 병실번호, SeverityBadge, 환자명, 나이/성별/입원일차, 진단 태그, VitalChip(이상 수치 색상 강조), Todo 미니 ProgressBar를 표시해야 한다
8. WHEN 환자 카드가 클릭되면, THE Dashboard SHALL /patient/:id 라우트로 이동해야 한다
9. THE Dashboard SHALL 중증도 필터 버튼(전체/High/Medium/Low)을 제공하고, 선택된 필터에 따라 환자 카드 목록을 즉시 필터링해야 한다
10. THE Dashboard SHALL 데스크톱(≥1024px)에서 4열, 태블릿(769~1023px)에서 2열, 모바일(<768px)에서 1열 그리드 레이아웃을 적용해야 한다
11. THE Dashboard SHALL 좌측에 220px 고정 Sidebar를 표시하고, 모바일(<768px)에서는 Sidebar를 숨기고 BottomNav를 표시해야 한다
12. THE Topbar SHALL 현재 시간을 1초 간격으로 업데이트하여 표시해야 한다

---

### Requirement 3: 환자 상세 페이지 (PAT)

**User Story:** As a 일반 간호사, I want to 특정 환자의 상세 정보와 간호 업무 목록을 확인하고 업무를 완료 처리하기를, so that 인수인계 누락 없이 정확한 케어를 제공할 수 있다.

#### Acceptance Criteria

1. WHEN 환자 상세 페이지가 로드되면, THE Patient_Detail SHALL 페이지 최상단에 AI_Summary 카드를 표시해야 한다 (파란 그라디언트 배경, 체크 아이콘 리스트, 최대 5줄)
2. THE Patient_Detail SHALL 환자 기본정보(이름, 나이, 성별, 병실번호, 진단명, 입원일차)와 활력징후 6개 항목(혈압, 심박수, 체온, 호흡수, 산소포화도, 혈당/통증점수/GCS)을 2열 그리드로 표시해야 한다
3. THE Patient_Detail SHALL 활력징후 수치가 정상 범위를 벗어난 경우 VitalChip을 danger(빨강) 또는 warn(주황) 색상으로 강조 표시해야 한다
4. THE Patient_Detail SHALL 최근 검사결과(recentLabs)와 처방 약물(medications, 투여경로 배지 포함)을 2열 그리드로 표시해야 한다
5. THE Patient_Detail SHALL 해당 환자의 NursingTask 목록을 카테고리 배지(Monitoring/Medication/Hygiene/Documentation), 예상 소요 시간, 체크박스와 함께 표시해야 한다
6. WHEN Todo 체크박스가 클릭되면, THE Patient_Detail SHALL Redux toggleTask 액션을 즉시 디스패치하고 완료율 ProgressBar를 재계산하여 업데이트해야 한다
7. THE Patient_Detail SHALL Framer Motion을 사용하여 Todo 체크박스 완료 시 체크 애니메이션(scale 0→1)을 적용해야 한다
8. WHEN 저장 버튼이 클릭되면, THE Patient_Detail SHALL 현재 Todo 완료 상태를 기반으로 인수인계 로그(ShiftReport)를 생성하고 성공 토스트 메시지를 표시해야 한다
9. IF 해당 환자의 모든 Todo가 완료되면, THEN THE Patient_Detail SHALL 환자 헤더에 "완료" 배지를 표시해야 한다
10. THE Patient_Detail SHALL 헤더에 뒤로가기 버튼을 제공하고, 클릭 시 /dashboard로 이동해야 한다

---

### Requirement 4: 재고 관리 (INV)

**User Story:** As a 일반 간호사, I want to 병동 물품 재고를 카테고리별로 확인하고 소비 및 청구를 처리하기를, so that 물품 부족으로 인한 업무 중단을 예방할 수 있다.

#### Acceptance Criteria

1. THE Inventory_Module SHALL 물품을 카테고리별 탭(주사기/거즈/수액/린넨/장갑/기타)으로 분류하여 표시해야 한다
2. THE Inventory_Module SHALL 상단에 요약 카드 3개(충분 개수/부족주의 개수/긴급부족 개수)를 표시해야 한다
3. THE Inventory_Module SHALL 각 재고 아이템에 좌측 컬러 보더(ok=초록/warn=주황/danger=빨강), 물품명, 상태 배지, 현재재고/경고선, 재고 ProgressBar를 표시해야 한다
4. WHEN 소비 버튼(-1/-5/-10)이 클릭되면, THE Inventory_Module SHALL Redux consumeItem 액션을 디스패치하고 재고를 즉시 감소시키며 상태(sufficient/warning/critical)를 재계산해야 한다
5. WHEN 재고가 reorderPoint 미만이면, THE Inventory_Module SHALL 청구 버튼을 활성화해야 한다
6. WHEN 청구 버튼이 클릭되면, THE Inventory_Module SHALL MSW POST /api/inventory/:id/request를 호출하고 성공 시 토스트 메시지를 표시해야 한다
7. THE Inventory_Module SHALL 모든 소비 및 청구 이력을 간호사 ID와 타임스탬프와 함께 InventoryItem.history 배열에 기록해야 한다
8. THE Inventory_Module SHALL 헤더에 "부족 물품 일괄 청구" 버튼을 제공하고, 클릭 시 status가 warning 또는 critical인 모든 물품에 대해 일괄 청구 요청을 처리해야 한다
9. WHEN 소비 버튼 클릭으로 재고가 0이 되면, THE Inventory_Module SHALL 해당 아이템 상태를 critical로 변경하고 소비 버튼을 비활성화해야 한다

---

### Requirement 5: 수간호사 관제 대시보드 (HEAD)

**User Story:** As a 수간호사, I want to 병동 전체 현황과 간호사별 업무 부하를 실시간으로 파악하기를, so that 오버타임을 예방하고 최적의 환자 배분을 결정할 수 있다.

#### Acceptance Criteria

1. THE HeadNurse_Dashboard SHALL 상단에 통계 카드 4개(병상가동률, Todo처리율, 근무종료까지 남은 시간, 오버타임 경고 간호사 수)를 표시해야 한다
2. THE OccupancyChart SHALL Recharts BarChart를 사용하여 근무조별(Day/Evening/Night) 병상 가동률을 시각화해야 한다
3. THE SeverityPieChart SHALL Recharts PieChart를 사용하여 전체 환자의 중증도 분포(High/Medium/Low)를 시각화해야 한다
4. THE OvertimeChart SHALL Recharts BarChart를 사용하여 간호사별 예상 오버타임을 수평 막대 차트로 시각화해야 한다
5. THE HeadNurse_Dashboard SHALL 간호사 현황 테이블에 이름, 담당환자 수, 완료 Todo 수, 예상 오버타임, 상태를 표시해야 한다
6. WHEN 간호사의 overtimeHours가 3시간 이상이면, THE HeadNurse_Dashboard SHALL 해당 간호사 행을 warn(주황) 색상으로 강조하고, 5시간 이상이면 danger(빨강) 색상으로 강조해야 한다
7. THE HeadNurse_Dashboard SHALL AI 재배치 추천 배너를 표시하고, "적용" 버튼 클릭 시 Redux reassignPatient 액션을 디스패치하여 환자 재배분을 처리해야 한다
8. WHEN AI 재배치 추천이 적용되면, THE HeadNurse_Dashboard SHALL 간호사 현황 테이블과 차트를 즉시 업데이트해야 한다

---

### Requirement 6: 공통 레이아웃 및 디자인 시스템

**User Story:** As a 간호사, I want to 일관된 디자인과 반응형 레이아웃을 경험하기를, so that 다양한 기기에서 불편함 없이 시스템을 사용할 수 있다.

#### Acceptance Criteria

1. THE System SHALL 디자인 토큰(primary: #2C6E8A, bg: #F0F4F7, surface: #FFFFFF, border: #DDE3E8, text: #1A2B38, danger: #C0392B, warn: #D4860A, ok: #2E7D5E)을 Tailwind CSS v4 CSS 변수로 정의하고 모든 컴포넌트에 일관되게 적용해야 한다
2. THE System SHALL 카드 컴포넌트에 border-radius 10px, box-shadow 0 2px 12px rgba(44,110,138,.09)를 적용해야 한다
3. THE Sidebar SHALL 데스크톱(≥1024px)에서 220px 고정 너비로 표시되어야 한다
4. THE BottomNav SHALL 모바일(<768px)에서 화면 하단에 고정 표시되어야 한다
5. THE System SHALL 모든 인터랙티브 버튼의 최소 터치 영역을 44px × 44px 이상으로 보장해야 한다
6. THE System SHALL TypeScript strict 모드를 활성화하고 모든 컴포넌트에 명시적 타입을 적용해야 한다
7. THE System SHALL 페이지 초기 로딩을 3초 이내에 완료해야 한다
8. THE System SHALL Redux 상태 업데이트를 100ms 이내에 UI에 반영해야 한다

---

### Requirement 7: 공통 컴포넌트 라이브러리

**User Story:** As a 개발자, I want to 재사용 가능한 공통 컴포넌트를 사용하기를, so that 일관된 UI를 효율적으로 구현할 수 있다.

#### Acceptance Criteria

1. THE SeverityBadge SHALL High/Medium/Low 값을 받아 각각 danger-bg/warn-bg/ok-bg 배경색과 danger/warn/ok 텍스트 색상으로 렌더링해야 한다
2. THE VitalChip SHALL 활력징후 이름, 수치, isAbnormal, isBorderline 속성을 받아 이상 시 danger 색상, 경계 시 warn 색상, 정상 시 기본 색상으로 렌더링해야 한다
3. THE ProgressBar SHALL 0~100 사이의 percentage 값을 받아 너비 비율로 시각화하고, percentage에 따라 ok(≥80%)/warn(50~79%)/danger(<50%) 색상을 적용해야 한다
4. THE Button SHALL variant(primary/secondary/danger/ghost) prop을 받아 각 variant에 맞는 색상과 스타일을 적용해야 한다
5. THE System SHALL 공통 컴포넌트를 src/components/common/ 디렉토리에 위치시키고 index.ts에서 일괄 export해야 한다
