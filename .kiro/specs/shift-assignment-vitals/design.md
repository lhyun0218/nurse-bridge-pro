# Design Document: Shift Assignment & Vitals

## 1. Overview

### 설계 목표

Nurse-Bridge PRO의 데이터 모델을 "간호사 중심 환자 목록"에서 **"환자 중심 24시간 담당 배정"** 방식으로 전환한다.
각 환자는 Day / Evening / Night 세 시간대에 각각 독립적인 담당 간호사를 가지며, 이 세 레코드가 하루 24시간 커버리지를 보장한다.
추가로 일반 환자(`isEmergency: false`)에 대한 시간대별 수기 활력징후 입력·이력 조회 기능과, ShiftReport에 VitalRecord를 자동 포함하는 기능을 구현한다.

**핵심 설계 원칙**:
- 하드코딩 금지 — 모든 배정·활력징후 데이터는 런타임에 동적으로 생성·조회
- Redux Store 단일 진실 원천 — 모든 상태 변경은 슬라이스 액션을 통해서만
- Emergency / General 환자 분기 — `isEmergency` 플래그로 UI 분기 처리
- 빈 상태 명시 — 데이터 없을 때 더미 렌더링 금지, 명시적 빈 상태 UI 표시
