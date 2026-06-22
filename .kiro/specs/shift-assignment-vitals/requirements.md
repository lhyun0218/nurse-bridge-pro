# Requirements Document

## Introduction

Nurse-Bridge PRO에 세 가지 핵심 기능을 추가한다.

1. **환자 중심 24시간 담당 배정 규칙**: 각 환자는 반드시 데이(Day) / 이브닝(Evening) / 나이트(Night) 세 시간대에 각각 별도의 담당 간호사가 배정되어야 한다. 이 세 명의 간호사가 로테이션을 통해 24시간 내내 해당 환자를 커버한다. 간호사가 퇴근하면 다음 시간대 담당 간호사가 이어받는 구조다. 기존의 "간호사 기준 환자 목록" 방식은 이 규칙으로 완전히 대체한다.

2. **수간호사 스케줄 자동 생성**: 위 배정 규칙을 반영하여, 모든 환자의 세 시간대 담당 간호사가 공백 없이 채워지도록 일정표를 자동으로 생성한다. 간호사 수가 부족하면 입원 환자 수를 조정하거나 경고를 표시한다. 오버타임이 많은 간호사는 우선 보호하며, 간호사들이 시간대별로 골고루 배분되도록 설계한다.

3. **일반 환자 활력징후 수기 입력**: 응급(실시간 모니터링) 환자와 달리, 일반 환자는 데이/이브닝/나이트 각 시간대 담당 간호사가 직접 활력징후를 측정·입력·저장한다. 입력된 데이터는 Todo 및 인수인계 보고서에도 반영된다.

**핵심 불변 원칙**:
- 모든 입원 환자는 24시간 내내 담당 간호사 공백이 없어야 한다 (Day 담당 + Evening 담당 + Night 담당 = 3명 필수)
- 간호사는 특정 시간대에 근무하며, 자신이 담당하는 시간대의 환자들을 책임진다
- 하드코딩 및 더미 데이터 삽입 절대 금지. 모든 데이터는 런타임에 동적으로 생성·조회·저장되어야 한다

---

## Glossary

- **System**: Nurse-Bridge PRO 애플리케이션 전체
- **Shift_Assignment_Engine**: 환자-간호사 시간대별 배정을 관리하는 로직 모듈
- **Schedule_Generator**: 수간호사 일정표를 자동 생성하는 로직 모듈
- **Vital_Input_Module**: 일반 환자의 활력징후 수기 입력·저장을 담당하는 UI/로직 모듈
- **Head_Nurse**: 수간호사 역할(`role: 'HeadNurse'`)을 가진 사용자
- **Nurse**: 일반 간호사 역할(`role: 'Nurse'`)을 가진 사용자. 각 Nurse는 하루 중 하나의 ShiftType(또는 휴무)에 배정된다
- **Patient**: 시스템에 등록된 입원 환자
- **General_Patient**: 실시간 자동 모니터링 장비가 없는 일반 입원 환자 (`isEmergency: false`)
- **Emergency_Patient**: 실시간 활력징후 모니터링 장비가 연결된 응급/중환자 환자 (`isEmergency: true`)
- **ShiftType**: 근무 시간대 — `Day` (06:00–13:59) / `Evening` (14:00–21:59) / `Night` (22:00–05:59)
- **NurseShift**: 특정 Nurse의 특정 날짜 근무 배정 — `Day` / `Evening` / `Night` / `Off`(휴무) 중 하나
- **ShiftDate**: Shift_Assignment 또는 VitalRecord가 귀속되는 날짜 (YYYY-MM-DD 형식)
- **Patient_ShiftCoverage**: 특정 Patient의 특정 ShiftDate에 대한 세 시간대(Day, Evening, Night) 담당 간호사 배정 집합. 세 시간대가 모두 채워진 경우 "완전 커버(Full Coverage)" 상태로 간주한다
- **Shift_Assignment**: 특정 Patient의 특정 ShiftDate·ShiftType에 배정된 Nurse를 나타내는 레코드 (복합키: patientId + shiftDate + shiftType)
- **Shift_Schedule**: 특정 날짜의 모든 간호사에 대한 NurseShift 배정 일정표
- **VitalRecord**: 특정 General_Patient의 특정 ShiftDate·ShiftType에 해당 시간대 담당 Nurse가 수기로 입력한 활력징후 데이터 (복합키: patientId + shiftDate + shiftType)
- **OvertimeHours**: 간호사가 정규 근무 시간을 초과하여 근무한 시간(시간 단위)
- **TodoTask**: 환자에게 할당된 간호 업무 항목 (`NursingTask`)
- **ShiftReport**: 근무 교대 시 생성되는 인수인계 보고서 (`ShiftReport`)
- **Coverage_Gap**: 특정 Patient의 특정 ShiftDate에 하나 이상의 ShiftType에 담당 Nurse가 배정되지 않은 상태

---

## Requirements

### 요구사항 1: 환자 중심 24시간 담당 배정 불변 규칙

**사용자 스토리:** 수간호사로서, 각 입원 환자에게 데이/이브닝/나이트 세 시간대마다 별도의 담당 간호사가 반드시 배정되어 있기를 원한다. 간호사가 퇴근하면 다음 시간대 담당 간호사가 자동으로 이어받아, 어떤 환자도 24시간 동안 담당 간호사 없이 방치되지 않아야 한다.

#### 수용 기준

1. THE Shift_Assignment_Engine SHALL 각 Patient에 대해 ShiftDate × ShiftType(`Day`, `Evening`, `Night`) 조합마다 독립적인 Shift_Assignment 레코드를 유지한다. 레코드 복합키는 `(patientId, shiftDate, shiftType)`이며, 한 Patient는 하루에 반드시 세 개의 Shift_Assignment 레코드를 가져야 한다.

2. WHEN 새로운 Patient가 시스템에 등록될 때, THE Shift_Assignment_Engine SHALL 등록 당일(ShiftDate = 오늘)을 기준으로 해당 Patient의 `Day`, `Evening`, `Night` 세 ShiftType 모두에 대해 `nurseId = null`, `status = 'Unassigned'`인 Shift_Assignment 레코드 3개를 즉시 생성한다.

3. IF 특정 `(patientId, shiftDate, shiftType)`의 Shift_Assignment 레코드에서 `nurseId`가 null이거나 레코드 자체가 없을 때, THEN THE Shift_Assignment_Engine SHALL 해당 레코드를 `status: 'Unassigned'`로 반환하며, null이나 undefined를 반환하지 않는다.

4. WHEN 수간호사가 특정 `(patientId, shiftDate, shiftType)`에 Nurse를 배정할 때, THE Shift_Assignment_Engine SHALL 해당 레코드의 `nurseId`를 새 Nurse의 ID로 업데이트하고, `status`를 `'Assigned'`로, `updatedAt`을 현재 시각으로 갱신한다.

5. IF 이미 `status = 'Assigned'`인 Shift_Assignment 레코드에 다른 Nurse를 재배정하려 할 때, THEN THE Shift_Assignment_Engine SHALL 기존 `nurseId`를 새 Nurse ID로 교체(덮어쓰기)하며, 동일 `(patientId, shiftDate, shiftType)`에 두 명 이상의 Nurse가 동시에 기본 담당자로 존재하는 상태를 허용하지 않는다.

6. THE System SHALL 모든 입원 Patient의 오늘 날짜 기준 Patient_ShiftCoverage 완전 커버 여부를 대시보드에서 확인할 수 있도록 Coverage_Gap이 있는 환자 수를 표시한다.

7. THE System SHALL 하드코딩된 Nurse ID나 더미 Shift_Assignment 데이터를 프로덕션 소스 코드 내에 직접 포함하지 않는다. 모든 Shift_Assignment는 런타임에 수간호사가 설정하거나 Schedule_Generator가 생성한 것이어야 한다.

---

### 요구사항 2: 환자별 24시간 담당 현황 조회

**사용자 스토리:** 간호사로서, 현재 내 근무 시간대에 내가 담당하는 환자 목록을 즉시 확인하고 싶다. 수간호사로서는 모든 환자의 세 시간대 담당 현황을 한눈에 보고, Coverage_Gap이 있는 환자를 바로 파악하고 싶다.

#### 수용 기준

1. WHEN 로그인한 Nurse가 자신의 담당 환자 목록을 조회할 때, THE System SHALL 오늘 날짜와 해당 Nurse가 배정된 NurseShift의 ShiftType을 기준으로, 해당 `(shiftDate, shiftType)`에서 `nurseId`가 로그인 Nurse의 ID와 일치하는 Shift_Assignment 레코드에 연결된 Patient 목록만을 반환한다.

2. WHEN Nurse의 담당 환자 목록이 반환될 때, THE System SHALL `status = 'Unassigned'`이거나 Shift_Assignment 레코드가 존재하지 않는 Patient를 목록에 포함하지 않는다.

3. WHEN Head_Nurse가 배정 현황 화면을 조회할 때, THE System SHALL 현재 입원 중인 모든 Patient를 행(row)으로, `Day` / `Evening` / `Night` 세 시간대를 열(column)로 구성한 테이블을 표시하며, 각 셀에 배정된 Nurse 이름 또는 '미배정' 텍스트를 렌더링한다.

4. IF 특정 Patient의 특정 ShiftType 셀이 `status = 'Unassigned'`일 때, THEN THE System SHALL 해당 셀을 배정 완료 셀과 시각적으로 구분 가능한 강조 스타일(예: 빨간 테두리 또는 주황 배경)로 렌더링하여 Coverage_Gap임을 명확히 전달한다.

5. WHEN Head_Nurse가 배정 현황 화면을 조회할 때, THE System SHALL 화면 상단에 오늘 날짜 기준 Coverage_Gap이 있는 Patient 수(세 시간대 중 하나라도 미배정인 환자 수)를 숫자로 표시한다.

---

### 요구사항 3: 수간호사 스케줄 자동 생성

**사용자 스토리:** 수간호사로서, 모든 환자의 세 시간대(데이/이브닝/나이트) 담당 간호사 공백이 없도록 일정표를 자동으로 생성하고 싶다. 간호사가 부족하면 적정 환자 수를 안내받고 싶으며, 오버타임이 많은 간호사는 보호해주고 싶다.

#### 수용 기준

1. WHEN Head_Nurse가 특정 ShiftDate의 스케줄 자동 생성을 요청할 때, THE Schedule_Generator SHALL 다음 두 단계를 순서대로 실행한다: (1) Active Nurse 목록을 Day / Evening / Night 세 그룹에 라운드로빈으로 배분하여 NurseShift를 결정하고, (2) 각 시간대 NurseShift에 배정된 Nurse들을 현재 입원 Patient들에게 분배하여 Shift_Assignment를 생성한다.

2. THE Schedule_Generator SHALL 스케줄 생성 시 `status = 'Active'`인 Nurse 목록을 Redux Store에서 동적으로 조회하며, 하드코딩된 간호사 ID 목록이나 정적 배열을 사용하지 않는다.

3. WHEN 스케줄 생성이 실행될 때, THE Schedule_Generator SHALL 각 Nurse의 `overtimeHours`를 내림차순으로 정렬한 후, `overtimeHours`가 높은 Nurse를 환자 수가 적은 시간대 또는 라운드로빈 순서상 먼저 배정받는 위치에 우선 배치하여 부하를 분산한다.

4. THE Schedule_Generator SHALL 동일 Nurse가 같은 ShiftDate에 두 개 이상의 ShiftType에 배정되지 않도록 한다. 단, Active Nurse 수가 현재 입원 Patient 수 × 3을 충당하기 부족한 경우, 해당 상황을 경고로 표시하고 가용 인원으로 최선의 배정을 진행한다.

5. WHEN 스케줄 생성 결과 특정 Patient의 세 시간대 중 하나라도 Nurse가 배정되지 않는 Coverage_Gap이 발생할 때, THE Schedule_Generator SHALL 해당 Patient 이름과 미배정 ShiftType을 열거한 경고 메시지를 표시하고, Head_Nurse가 직접 수정할 수 있는 편집 UI를 제공한다.

6. WHEN 자동 생성된 Shift_Schedule이 Head_Nurse에게 표시될 때, THE System SHALL (1) 각 Nurse의 배정된 ShiftType과 담당 Patient 수, (2) 현재 `overtimeHours`, (3) Coverage_Gap이 있는 Patient 수를 요약 섹션으로 함께 표시한다.

7. WHEN Head_Nurse가 자동 생성된 Shift_Schedule을 확정(저장)할 때, THE System SHALL 해당 ShiftDate에 기존 Shift_Assignment 레코드가 존재하면 "기존 배정을 덮어씁니다. 계속하시겠습니까?" 확인 다이얼로그를 표시한 후 Head_Nurse의 확인을 받아 일괄 저장한다.

8. IF Active Nurse 수가 현재 입원 Patient 수 × 3보다 적어 모든 환자를 완전 커버할 수 없을 때, THEN THE Schedule_Generator SHALL 완전 커버에 필요한 최소 Nurse 수와 현재 Nurse 수의 차이를 경고 메시지로 표시하고, 가능한 최선의 배정안(일부 환자에 Coverage_Gap 포함)을 제안하며, Head_Nurse가 배정을 수동으로 수정하거나 환자 수를 조정할 수 있도록 안내한다.

---

### 요구사항 4: 일반 환자 시간대별 활력징후 수기 입력

**사용자 스토리:** 담당 간호사로서, 내가 맡은 시간대의 일반 환자들의 활력징후를 직접 측정하여 시스템에 입력하고 저장하고 싶다. 입력한 기록이 인수인계 보고서에도 반영되어야 한다.

#### 수용 기준

1. THE Vital_Input_Module SHALL General_Patient(`isEmergency: false`)의 환자 상세 화면에서 Day / Evening / Night 세 시간대에 대한 별도의 활력징후 입력 섹션을 제공한다. 각 섹션은 수축기 혈압(mmHg), 이완기 혈압(mmHg), 심박수(bpm), 체온(°C), 호흡수(회/분), 산소포화도(%) 여섯 항목의 입력 필드를 포함한다.

2. WHEN Nurse가 General_Patient의 특정 ShiftType에 대한 활력징후를 입력하고 저장을 요청할 때, THE Vital_Input_Module SHALL 해당 데이터를 `(patientId, shiftDate, shiftType)`을 복합키로 하는 VitalRecord로 저장하고, 저장 성공 시 3초 이상 유지되는 Toast 알림으로 성공을 표시한다.

3. THE Vital_Input_Module SHALL `isEmergency: true`인 Emergency_Patient의 환자 상세 화면에서는 수기 활력징후 입력 섹션을 렌더링하지 않는다. Emergency_Patient 화면에는 실시간 모니터링 데이터만 표시된다.

4. WHEN VitalRecord가 저장될 때, THE System SHALL 해당 VitalRecord에 `nurseId`(입력 간호사 ID), `recordedAt`(저장 타임스탬프, ISO 8601 형식), `shiftType`을 포함하여 기록한다.

5. IF 활력징후 입력값이 아래 임상 정상 범위를 벗어날 때, THEN THE Vital_Input_Module SHALL 해당 항목 입력 필드에 시각적 경고 표시(빨간 테두리 또는 경고 아이콘)를 렌더링한다. 단, 경고가 있어도 저장 버튼은 활성 상태를 유지하여 저장을 막지 않는다.
   - 수축기 혈압: 90 mmHg 미만 또는 180 mmHg 초과
   - 이완기 혈압: 60 mmHg 미만 또는 110 mmHg 초과
   - 심박수: 50 bpm 미만 또는 120 bpm 초과
   - 체온: 36.0 °C 미만 또는 38.5 °C 초과
   - 호흡수: 12 회/분 미만 또는 25 회/분 초과
   - 산소포화도: 94% 미만

6. WHEN VitalRecord가 저장될 때, THE System SHALL 해당 Patient의 해당 ShiftType에 연결된 TodoTask 목록 중 카테고리가 '활력징후 측정'인 항목의 `status`를 `'Completed'`로 자동 업데이트한다.

7. IF 동일한 `(patientId, shiftDate, shiftType)` 조합의 VitalRecord가 이미 저장되어 있을 때, THEN THE Vital_Input_Module SHALL 기존 레코드의 활력징후 수치를 입력 폼에 사전 입력(pre-fill)하여 표시하고, 저장 시 활력징후 수치를 새 값으로 덮어쓴다. 최초 `nurseId`(`recordedBy`)와 `recordedAt`은 보존하고, 수정한 간호사 ID(`modifiedBy`)와 수정 타임스탬프(`modifiedAt`)를 별도 필드에 추가 기록한다.

8. THE System SHALL 하드코딩된 활력징후 기본값이나 더미 VitalRecord를 프로덕션 소스 코드 내에 직접 포함하지 않는다. 모든 VitalRecord는 Nurse가 직접 입력한 데이터에서만 생성된다.

9. WHEN VitalRecord가 저장될 때, THE System SHALL 저장된 VitalRecord 데이터를 해당 Patient의 해당 ShiftType ShiftReport에 자동으로 연결하여, 이후 ShiftReport 조회 시 해당 VitalRecord가 포함되도록 한다.

10. IF VitalRecord 저장 요청이 실패할 때, THEN THE Vital_Input_Module SHALL 실패 원인을 명시한 오류 메시지를 표시하고, 폼에 입력된 데이터를 그대로 유지하며 VitalRecord를 생성하지 않는다.

---

### 요구사항 5: 활력징후 이력 조회

**사용자 스토리:** 담당 간호사로서, 환자의 시간대별 활력징후 이력을 확인하여 상태 변화를 파악하고 싶다.

#### 수용 기준

1. WHEN Nurse 또는 Head_Nurse가 General_Patient의 환자 상세 화면에서 활력징후 이력을 조회할 때, THE System SHALL 해당 Patient의 저장된 VitalRecord 목록을 ShiftDate 내림차순, 동일 날짜 내에서는 ShiftType `Day → Evening → Night` 순으로 정렬하여 표시한다. 저장된 VitalRecord가 없을 경우 "기록 없음" 빈 상태 메시지를 표시한다.

2. WHEN VitalRecord 이력이 표시될 때, THE System SHALL 아래 임상 정상 범위를 벗어난 수치를 정상 수치와 시각적으로 구분 가능한 강조 스타일(예: 빨간색 텍스트 또는 배경색)로 렌더링한다.
   - 수축기 혈압: 90 mmHg 미만 또는 180 mmHg 초과
   - 이완기 혈압: 60 mmHg 미만 또는 110 mmHg 초과
   - 심박수: 50 bpm 미만 또는 120 bpm 초과
   - 체온: 36.0 °C 미만 또는 38.5 °C 초과
   - 호흡수: 12 회/분 미만 또는 25 회/분 초과
   - 산소포화도: 94% 미만

3. WHEN VitalRecord 이력이 표시될 때, THE System SHALL 각 레코드 행에 `recordedBy`(입력 간호사 이름)와 `recordedAt`을 `YYYY-MM-DD HH:mm` 형식으로 함께 표시한다.

---

### 요구사항 6: 인수인계 보고서에 활력징후 반영

**사용자 스토리:** 간호사로서, 인수인계 보고서를 생성할 때 내 근무 시간대에 측정·저장한 활력징후 데이터가 자동으로 포함되기를 원한다.

#### 수용 기준

1. WHEN ShiftReport가 생성될 때, THE System SHALL 보고서 대상 Patient의 `(patientId, shiftDate, shiftType)` 키에 해당하는 VitalRecord가 존재할 경우, 수축기 혈압, 이완기 혈압, 심박수, 체온, 호흡수, 산소포화도 수치와 `recordedAt`, 입력 Nurse 이름(`recordedBy`)을 보고서의 활력징후 섹션에 포함한다.

2. IF ShiftReport 생성 시 보고서 대상 Patient의 해당 `(shiftDate, shiftType)`에 저장된 VitalRecord가 존재하지 않을 때, THEN THE System SHALL 보고서의 활력징후 섹션에 '활력징후 미측정' 텍스트를 표시한다.

3. THE System SHALL ShiftReport에 포함되는 VitalRecord 데이터를 하드코딩하거나 임의로 생성하지 않는다. 반드시 Redux Store에 저장된 VitalRecord에서 조회한 데이터만을 사용한다.

4. WHEN ShiftReport가 생성될 때, THE System SHALL 보고서 내 활력징후 섹션에 해당 데이터가 귀속되는 ShiftType(`Day` / `Evening` / `Night`)을 명시적으로 표시하여 어느 근무조의 측정값인지 식별 가능하게 한다.

---

### 요구사항 7: 데이터 무결성 및 하드코딩 금지

**사용자 스토리:** 개발자이자 운영자로서, 시스템의 모든 배정·스케줄·활력징후 데이터가 런타임에 동적으로 관리되어야 한다. 하드코딩된 데이터나 더미 데이터가 프로덕션 코드에 포함되어서는 안 된다.

#### 수용 기준

1. THE System SHALL Shift_Assignment, Shift_Schedule, VitalRecord 데이터를 생성·조회·수정·삭제하는 모든 로직에서 Redux Store를 통해 데이터를 관리한다.

2. THE System SHALL 하드코딩된 환자 ID, 간호사 ID, 또는 배정 관계를 프로덕션 소스 코드(컴포넌트, 훅, 비즈니스 로직 파일) 내에 직접 포함하지 않는다. 테스트 파일 및 MSW 핸들러는 이 제약에서 제외된다.

3. IF Shift_Assignment, Shift_Schedule, 또는 VitalRecord 데이터가 존재하지 않는 빈 초기 상태일 때, THEN THE System SHALL 해당 영역에 "데이터 없음" 또는 "미배정" 등의 명시적 빈 상태 메시지를 렌더링하고, 더미 데이터를 생성하거나 렌더링하지 않는다.

4. IF 개발 또는 테스트 목적의 Mock 데이터가 필요할 때, THEN THE System SHALL 해당 데이터를 MSW(Mock Service Worker) 핸들러(`src/mocks/` 디렉터리)를 통해서만 주입하며, 컴포넌트나 비즈니스 로직 코드 내에 직접 포함하지 않는다.
