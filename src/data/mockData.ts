import type { Nurse, Patient, NursingTask, InventoryItem } from '../types'

// ── 간호사 Mock 데이터 ──────────────────────────
export const mockNurses: Nurse[] = [
  {
    id: 'N001', name: '이현규', employeeId: 'EMP001', role: 'Nurse',
    shiftType: 'Day', assignedPatients: ['P001','P002','P003','P004','P005','P007','P008','P010'],
    status: 'Active', overtimeHours: 1.5,
    workStart: '2026-05-26T06:00:00', workEnd: '2026-05-26T15:00:00',
  },
  {
    id: 'N002', name: '김지수', employeeId: 'EMP002', role: 'Nurse',
    shiftType: 'Day', assignedPatients: ['P006','P009','P011','P012','P013','P014'],
    status: 'Active', overtimeHours: 3.0,
    workStart: '2026-05-26T06:00:00', workEnd: '2026-05-26T15:00:00',
  },
  {
    id: 'N003', name: '박민준', employeeId: 'EMP003', role: 'Nurse',
    shiftType: 'Day', assignedPatients: ['P015','P016','P017','P018','P019','P020'],
    status: 'Active', overtimeHours: 0.5,
    workStart: '2026-05-26T06:00:00', workEnd: '2026-05-26T15:00:00',
  },
  {
    id: 'N004', name: '최서연', employeeId: 'EMP004', role: 'Nurse',
    shiftType: 'Day', assignedPatients: ['P021','P022','P023','P024','P025','P026','P027','P028','P029'],
    status: 'Active', overtimeHours: 2.5,
    workStart: '2026-05-26T06:00:00', workEnd: '2026-05-26T15:00:00',
  },
  {
    id: 'N005', name: '정다은', employeeId: 'EMP005', role: 'Nurse',
    shiftType: 'Day', assignedPatients: ['P030','P031','P032','P033','P034','P035','P036','P037','P038','P039','P040','P041'],
    status: 'Active', overtimeHours: 5.0,
    workStart: '2026-05-26T06:00:00', workEnd: '2026-05-26T15:00:00',
  },
  {
    id: 'N006', name: '박수진', employeeId: 'EMP006', role: 'HeadNurse',
    shiftType: 'Day', assignedPatients: [],
    status: 'Active', overtimeHours: 0,
    workStart: '2026-05-26T06:00:00', workEnd: '2026-05-26T15:00:00',
  },
]

// ── 환자 Mock 데이터 ──────────────────────────
export const mockPatients: Patient[] = [
  {
    id: 'P001', medicalRecordNo: '101', name: '김영수', age: 73, gender: 'M',
    diagnosis: ['폐렴', '고혈압', '당뇨병(병력)'], severity: 'High',
    roomNumber: '101',
    vitalSigns: { bloodPressure: '140/90', heartRate: 88, temperature: 37.2, respiratoryRate: 20, oxygenSaturation: 92, bloodGlucose: 180 },
    recentLabs: [
      { name: 'Glucose', value: 180, unit: 'mg/dL', isAbnormal: true },
      { name: 'WBC', value: 12.5, unit: 'K/μL', isBorderline: true },
      { name: 'CRP', value: 8.4, unit: 'mg/L', isAbnormal: true },
      { name: 'Creatinine', value: 1.2, unit: 'mg/dL', isBorderline: true },
    ],
    medications: [
      { name: 'Ceftriaxone', dosage: '1g', frequency: 'Q2H', route: 'IV' },
      { name: 'Insulin Regular', dosage: '4unit', frequency: 'PRN (BG>180)', route: 'SC' },
      { name: 'Amlodipine', dosage: '5mg', frequency: 'QD', route: 'PO' },
      { name: 'O₂ 산소 공급', dosage: '2L/min', frequency: '지속', route: 'O2' },
    ],
    nursingTaskIds: ['T001','T002','T003','T004','T005','T006'],
    aiSummary: [
      '김영수 환자, 73세, 폐렴 입원 (Day 2) — 전반적 상태 주의 필요',
      '어제 X-ray: 양쪽 하엽 침윤 보임, 산소 포화도 92% 유지 중',
      '항생제 IV (Ceftriaxone 1g) 2시간마다 투여 중 — 다음 투여 10:00',
      '주의: 당뇨 병력, 혈당 180 — 인슐린 조절 필요',
      '오후 2시 유도관 교체 예정 (의사 처방 확인 완료)',
    ],
    admissionDate: '2026-05-24T10:00:00', assignedNurseId: 'N001',
  },
  {
    id: 'P005', medicalRecordNo: '105', name: '오민준', age: 68, gender: 'M',
    diagnosis: ['COPD', '심부전', '고혈압'], severity: 'High',
    roomNumber: '105',
    vitalSigns: { bloodPressure: '160/100', heartRate: 102, temperature: 36.9, respiratoryRate: 26, oxygenSaturation: 89 },
    recentLabs: [
      { name: 'BNP', value: 820, unit: 'pg/mL', isAbnormal: true },
      { name: 'PaO₂', value: 58, unit: 'mmHg', isAbnormal: true },
      { name: 'Troponin', value: 0.08, unit: 'ng/mL', isBorderline: true },
    ],
    medications: [
      { name: 'Furosemide', dosage: '40mg', frequency: 'Q12H', route: 'IV' },
      { name: 'Salbutamol 네뷸라이저', dosage: '2.5mg', frequency: 'Q4H', route: 'NEB' },
      { name: 'O₂ 고유량 마스크', dosage: '10L/min', frequency: '지속', route: 'O2' },
    ],
    nursingTaskIds: ['T007','T008','T009','T010','T011','T012','T013'],
    aiSummary: [
      '오민준 환자, 68세, COPD+심부전 입원 (Day 1) — 긴급 모니터링 필요',
      'SpO₂ 89% — 고유량 산소 마스크 적용 중, 지속 모니터링 필수',
      '심박수 102bpm, 호흡수 26회/분 — 호흡 부전 징후 주의',
      '이뇨제 IV 투여 중 (Furosemide 40mg) — 소변량 시간당 체크',
      '흉부 X-ray 결과 대기 중 — 결과 나오면 담당의 즉시 보고',
    ],
    admissionDate: '2026-05-26T08:00:00', assignedNurseId: 'N001',
  },
  {
    id: 'P008', medicalRecordNo: '108', name: '강태양', age: 81, gender: 'M',
    diagnosis: ['뇌졸중 (허혈성)', '고혈압', '우측 편마비'], severity: 'High',
    roomNumber: '108',
    vitalSigns: { bloodPressure: '175/105', heartRate: 78, temperature: 37.0, respiratoryRate: 16, oxygenSaturation: 95, gcs: 12 },
    recentLabs: [
      { name: 'INR', value: 1.8, unit: '', isBorderline: true },
      { name: 'Cholesterol', value: 245, unit: 'mg/dL', isAbnormal: true },
    ],
    medications: [
      { name: 'Aspirin', dosage: '100mg', frequency: 'QD', route: 'PO' },
      { name: 'Nicardipine', dosage: '지속 주입', frequency: '혈압 조절', route: 'IV' },
    ],
    nursingTaskIds: ['T014','T015','T016','T017','T018','T019','T020','T021'],
    aiSummary: [
      '강태양 환자, 81세, 뇌졸중(우측 편마비) 입원 (Day 4) — 신경학적 변화 주의',
      '혈압 175/105 — 뇌압 상승 위험, 목표 혈압 140/90 이하 유지',
      'GCS 12점 — 의식 수준 저하, 매 2시간 신경학적 사정 필요',
      '연하 곤란 있음 — 경구 투약 시 분쇄 후 투여, 흡인 주의',
      '욕창 예방: 2시간마다 체위 변경 필수 (현재 Braden 14점)',
    ],
    admissionDate: '2026-05-22T14:00:00', assignedNurseId: 'N001',
  },
  {
    id: 'P002', medicalRecordNo: '102', name: '이순신', age: 58, gender: 'M',
    diagnosis: ['당뇨병 (Type 2)', '고지혈증', '당뇨발 (초기)'], severity: 'Medium',
    roomNumber: '102',
    vitalSigns: { bloodPressure: '130/85', heartRate: 76, temperature: 36.7, respiratoryRate: 14, oxygenSaturation: 97, bloodGlucose: 165 },
    recentLabs: [
      { name: 'Glucose', value: 165, unit: 'mg/dL', isBorderline: true },
      { name: 'HbA1c', value: '8.2%', unit: '', isBorderline: true },
      { name: 'LDL', value: 168, unit: 'mg/dL', isAbnormal: true },
    ],
    medications: [
      { name: 'Insulin Glargine', dosage: '20unit', frequency: 'QD 저녁', route: 'SC' },
      { name: 'Metformin', dosage: '500mg', frequency: 'BID', route: 'PO' },
    ],
    nursingTaskIds: ['T022','T023','T024','T025','T026'],
    aiSummary: [
      '이순신 환자, 58세, 당뇨병+고지혈증 입원 (Day 5) — 혈당 조절 중',
      '공복 혈당 165 — 인슐린 용량 조정 중, 식전 혈당 측정 필수',
      '발 상처 드레싱 매일 필요 (당뇨발 초기 병변, 우측 엄지)',
      '퇴원 교육 예정 (혈당 자가 측정, 식이 요법) — 보호자 동반 요청',
    ],
    admissionDate: '2026-05-21T11:00:00', assignedNurseId: 'N001',
  },
  {
    id: 'P007', medicalRecordNo: '107', name: '한소희', age: 44, gender: 'F',
    diagnosis: ['담낭염', '복강경 담낭절제술 (POD 3)'], severity: 'Medium',
    roomNumber: '107',
    vitalSigns: { bloodPressure: '122/78', heartRate: 84, temperature: 38.1, respiratoryRate: 16, oxygenSaturation: 98, painScore: 7 },
    recentLabs: [
      { name: 'WBC', value: 11.2, unit: 'K/μL', isBorderline: true },
      { name: 'CRP', value: 4.8, unit: 'mg/L', isBorderline: true },
    ],
    medications: [
      { name: 'Ketorolac', dosage: '30mg', frequency: 'Q6H PRN', route: 'IV' },
      { name: 'Cefazolin', dosage: '1g', frequency: 'Q8H', route: 'IV' },
    ],
    nursingTaskIds: ['T027','T028','T029','T030','T031'],
    aiSummary: [
      '한소희 환자, 44세, 담낭염 복강경 수술 후 (POD 3) — 회복 중',
      '통증 7/10 호소 — PRN 진통제 투여 기록 확인, 통증 재사정 필요',
      '체온 38.1°C — 수술 후 발열 모니터링 중, 혈액 배양 결과 대기',
    ],
    admissionDate: '2026-05-23T09:00:00', assignedNurseId: 'N001',
  },
  {
    id: 'P010', medicalRecordNo: '110', name: '윤재원', age: 62, gender: 'M',
    diagnosis: ['만성 신부전 (CKD Stage 4)', '신성 빈혈', '고혈압'], severity: 'Medium',
    roomNumber: '110',
    vitalSigns: { bloodPressure: '148/92', heartRate: 70, temperature: 36.6, respiratoryRate: 14, oxygenSaturation: 96 },
    recentLabs: [
      { name: 'Creatinine', value: 2.8, unit: 'mg/dL', isAbnormal: true },
      { name: 'eGFR', value: 22, unit: 'mL/min', isAbnormal: true },
      { name: 'Hemoglobin', value: 8.2, unit: 'g/dL', isAbnormal: true },
    ],
    medications: [
      { name: 'EPO (Epoetin alfa)', dosage: '주 3회', frequency: '빈혈 치료', route: 'SC' },
      { name: 'Amlodipine', dosage: '10mg', frequency: 'QD', route: 'PO' },
    ],
    nursingTaskIds: ['T032','T033','T034','T035','T036','T037'],
    aiSummary: [
      '윤재원 환자, 62세, 만성 신부전+빈혈 입원 (Day 6) — 신기능 모니터링 중',
      'Creatinine 2.8 — 신기능 저하, 수분 섭취 제한 (1500mL/일)',
      '투석 여부 검토 중 — 신장내과 협진 오늘 오후 예정',
    ],
    admissionDate: '2026-05-20T15:00:00', assignedNurseId: 'N001',
  },
  {
    id: 'P003', medicalRecordNo: '103', name: '박문수', age: 45, gender: 'M',
    diagnosis: ['고혈압 (본태성)'], severity: 'Low',
    roomNumber: '103',
    vitalSigns: { bloodPressure: '125/80', heartRate: 72, temperature: 36.8, respiratoryRate: 14, oxygenSaturation: 98 },
    recentLabs: [
      { name: 'Glucose', value: 98, unit: 'mg/dL' },
      { name: 'Cholesterol', value: 185, unit: 'mg/dL' },
    ],
    medications: [
      { name: 'Amlodipine', dosage: '5mg', frequency: 'QD', route: 'PO' },
      { name: 'Losartan', dosage: '50mg', frequency: 'QD', route: 'PO' },
    ],
    nursingTaskIds: ['T038','T039','T040','T041'],
    aiSummary: [
      '박문수 환자, 45세, 고혈압 입원 (Day 3) — 혈압 조절 양호, 안정적',
      '혈압 125/80 — 목표 혈압 달성, 약물 반응 좋음',
      '오늘 모든 간호 업무 완료 — 퇴원 검토 중',
    ],
    admissionDate: '2026-05-23T10:00:00', assignedNurseId: 'N001',
  },
  {
    id: 'P004', medicalRecordNo: '104', name: '최민지', age: 32, gender: 'F',
    diagnosis: ['우측 대퇴골 골절', 'ORIF 수술 (POD 1)'], severity: 'Low',
    roomNumber: '104',
    vitalSigns: { bloodPressure: '118/75', heartRate: 68, temperature: 36.5, respiratoryRate: 14, oxygenSaturation: 99, painScore: 4 },
    recentLabs: [
      { name: 'Hemoglobin', value: 10.8, unit: 'g/dL', isBorderline: true },
    ],
    medications: [
      { name: 'Tramadol', dosage: '50mg', frequency: 'Q6H PRN', route: 'PO' },
      { name: 'Enoxaparin', dosage: '40mg', frequency: 'QD', route: 'SC' },
    ],
    nursingTaskIds: ['T042','T043','T044','T045'],
    aiSummary: [
      '최민지 환자, 32세, 우측 대퇴골 골절 수술 후 (POD 1) — 회복 초기',
      '통증 4/10 — 진통제 효과 있음, 수술 부위 부종 경미',
      '물리치료 시작 예정 (오늘 오후) — 침상 운동 교육 필요',
    ],
    admissionDate: '2026-05-26T07:00:00', assignedNurseId: 'N001',
  },
]

// ── 간호 업무 Mock 데이터 ──────────────────────
export const mockTasks: NursingTask[] = [
  // P001 김영수 (폐렴)
  { taskId:'T001', patientId:'P001', taskName:'활력징후 측정', description:'매 4시간마다', status:'Completed', estimatedMinutes:5, dueTime:'2026-05-26T08:00:00', assignedTo:'N001', category:'Monitoring' },
  { taskId:'T002', patientId:'P001', taskName:'항생제 IV 투여 확인', description:'Ceftriaxone 1g Q2H', status:'Completed', estimatedMinutes:15, dueTime:'2026-05-26T08:00:00', assignedTo:'N001', category:'Medication' },
  { taskId:'T003', patientId:'P001', taskName:'산소 포화도 체크', description:'매 4시간', status:'Pending', estimatedMinutes:10, dueTime:'2026-05-26T10:00:00', assignedTo:'N001', category:'Monitoring' },
  { taskId:'T004', patientId:'P001', taskName:'혈당 측정 및 인슐린 투여', description:'혈당 180 이상 시 4unit SC', status:'Pending', estimatedMinutes:10, dueTime:'2026-05-26T10:00:00', assignedTo:'N001', category:'Medication' },
  { taskId:'T005', patientId:'P001', taskName:'가래 흡입', description:'필요시', status:'Pending', estimatedMinutes:5, dueTime:'2026-05-26T11:00:00', assignedTo:'N001', category:'Hygiene' },
  { taskId:'T006', patientId:'P001', taskName:'I/O 기록', description:'Intake-Output 기록', status:'Pending', estimatedMinutes:3, dueTime:'2026-05-26T12:00:00', assignedTo:'N001', category:'Documentation' },
  // P005 오민준 (COPD)
  { taskId:'T007', patientId:'P005', taskName:'산소 포화도 연속 모니터링', description:'SpO₂ 94% 목표', status:'Completed', estimatedMinutes:10, dueTime:'2026-05-26T07:00:00', assignedTo:'N001', category:'Monitoring' },
  { taskId:'T008', patientId:'P005', taskName:'활력징후 측정', description:'매 2시간', status:'Pending', estimatedMinutes:5, dueTime:'2026-05-26T10:00:00', assignedTo:'N001', category:'Monitoring' },
  { taskId:'T009', patientId:'P005', taskName:'소변량 시간당 측정', description:'이뇨제 효과 모니터링', status:'Pending', estimatedMinutes:5, dueTime:'2026-05-26T10:00:00', assignedTo:'N001', category:'Documentation' },
  { taskId:'T010', patientId:'P005', taskName:'Furosemide IV 투여', description:'40mg Q12H', status:'Pending', estimatedMinutes:15, dueTime:'2026-05-26T12:00:00', assignedTo:'N001', category:'Medication' },
  { taskId:'T011', patientId:'P005', taskName:'네뷸라이저 치료', description:'Salbutamol Q4H', status:'Pending', estimatedMinutes:20, dueTime:'2026-05-26T10:00:00', assignedTo:'N001', category:'Medication' },
  { taskId:'T012', patientId:'P005', taskName:'흉부 X-ray 결과 확인', description:'결과 나오면 담당의 보고', status:'Pending', estimatedMinutes:5, dueTime:'2026-05-26T11:00:00', assignedTo:'N001', category:'Documentation' },
  { taskId:'T013', patientId:'P005', taskName:'체중 측정', description:'부종 모니터링', status:'Pending', estimatedMinutes:5, dueTime:'2026-05-26T08:00:00', assignedTo:'N001', category:'Monitoring' },
  // P008 강태양 (뇌졸중)
  { taskId:'T014', patientId:'P008', taskName:'신경학적 사정', description:'GCS, 동공 반응 매 2시간', status:'Completed', estimatedMinutes:10, dueTime:'2026-05-26T08:00:00', assignedTo:'N001', category:'Monitoring' },
  { taskId:'T015', patientId:'P008', taskName:'혈압 측정 및 Nicardipine 조절', description:'목표 140/90 이하', status:'Completed', estimatedMinutes:10, dueTime:'2026-05-26T08:00:00', assignedTo:'N001', category:'Medication' },
  { taskId:'T016', patientId:'P008', taskName:'체위 변경', description:'2시간마다 욕창 예방', status:'Pending', estimatedMinutes:10, dueTime:'2026-05-26T10:00:00', assignedTo:'N001', category:'Hygiene' },
  { taskId:'T017', patientId:'P008', taskName:'구강 간호', description:'흡인 예방', status:'Pending', estimatedMinutes:10, dueTime:'2026-05-26T10:00:00', assignedTo:'N001', category:'Hygiene' },
  { taskId:'T018', patientId:'P008', taskName:'Aspirin 분쇄 투여', description:'연하 곤란 주의', status:'Pending', estimatedMinutes:10, dueTime:'2026-05-26T09:00:00', assignedTo:'N001', category:'Medication' },
  { taskId:'T019', patientId:'P008', taskName:'Heparin SC 투여', description:'DVT 예방 Q12H', status:'Pending', estimatedMinutes:5, dueTime:'2026-05-26T12:00:00', assignedTo:'N001', category:'Medication' },
  { taskId:'T020', patientId:'P008', taskName:'재활 치료사 협진 확인', description:'오늘 일정 확인', status:'Pending', estimatedMinutes:5, dueTime:'2026-05-26T11:00:00', assignedTo:'N001', category:'Documentation' },
  { taskId:'T021', patientId:'P008', taskName:'I/O 기록 및 피부 사정', description:'욕창 부위 확인', status:'Pending', estimatedMinutes:5, dueTime:'2026-05-26T12:00:00', assignedTo:'N001', category:'Documentation' },
  // P002 이순신 (당뇨)
  { taskId:'T022', patientId:'P002', taskName:'공복 혈당 측정', description:'07:00', status:'Completed', estimatedMinutes:5, dueTime:'2026-05-26T07:00:00', assignedTo:'N001', category:'Monitoring' },
  { taskId:'T023', patientId:'P002', taskName:'활력징후 측정', description:'', status:'Completed', estimatedMinutes:5, dueTime:'2026-05-26T08:00:00', assignedTo:'N001', category:'Monitoring' },
  { taskId:'T024', patientId:'P002', taskName:'발 드레싱', description:'우측 엄지 생리식염수 세척', status:'Completed', estimatedMinutes:15, dueTime:'2026-05-26T09:00:00', assignedTo:'N001', category:'Hygiene' },
  { taskId:'T025', patientId:'P002', taskName:'식전 혈당 측정', description:'점심 전', status:'Pending', estimatedMinutes:5, dueTime:'2026-05-26T12:00:00', assignedTo:'N001', category:'Monitoring' },
  { taskId:'T026', patientId:'P002', taskName:'퇴원 교육', description:'혈당 자가 측정 방법', status:'Pending', estimatedMinutes:30, dueTime:'2026-05-26T14:00:00', assignedTo:'N001', category:'Documentation' },
  // P007 한소희 (수술 후)
  { taskId:'T027', patientId:'P007', taskName:'활력징후 및 통증 사정', description:'NRS 통증 점수', status:'Completed', estimatedMinutes:10, dueTime:'2026-05-26T08:00:00', assignedTo:'N001', category:'Monitoring' },
  { taskId:'T028', patientId:'P007', taskName:'수술 부위 드레싱 확인', description:'삼출물 여부', status:'Completed', estimatedMinutes:10, dueTime:'2026-05-26T09:00:00', assignedTo:'N001', category:'Hygiene' },
  { taskId:'T029', patientId:'P007', taskName:'Ketorolac IV 투여', description:'통증 7/10 PRN 해당', status:'Pending', estimatedMinutes:10, dueTime:'2026-05-26T10:00:00', assignedTo:'N001', category:'Medication' },
  { taskId:'T030', patientId:'P007', taskName:'혈액 배양 결과 확인', description:'담당의 보고', status:'Pending', estimatedMinutes:5, dueTime:'2026-05-26T11:00:00', assignedTo:'N001', category:'Documentation' },
  { taskId:'T031', patientId:'P007', taskName:'식이 진행 상태 확인', description:'오심 여부', status:'Pending', estimatedMinutes:5, dueTime:'2026-05-26T12:00:00', assignedTo:'N001', category:'Monitoring' },
  // P010 윤재원 (신부전)
  { taskId:'T032', patientId:'P010', taskName:'활력징후 측정', description:'', status:'Completed', estimatedMinutes:5, dueTime:'2026-05-26T08:00:00', assignedTo:'N001', category:'Monitoring' },
  { taskId:'T033', patientId:'P010', taskName:'수분 섭취량 확인', description:'1500mL 제한', status:'Completed', estimatedMinutes:5, dueTime:'2026-05-26T09:00:00', assignedTo:'N001', category:'Monitoring' },
  { taskId:'T034', patientId:'P010', taskName:'EPO SC 투여', description:'빈혈 치료', status:'Completed', estimatedMinutes:5, dueTime:'2026-05-26T09:00:00', assignedTo:'N001', category:'Medication' },
  { taskId:'T035', patientId:'P010', taskName:'I/O 기록', description:'소변량 시간당 체크', status:'Pending', estimatedMinutes:5, dueTime:'2026-05-26T12:00:00', assignedTo:'N001', category:'Documentation' },
  { taskId:'T036', patientId:'P010', taskName:'신장내과 협진 준비', description:'오후 2시', status:'Pending', estimatedMinutes:10, dueTime:'2026-05-26T14:00:00', assignedTo:'N001', category:'Documentation' },
  { taskId:'T037', patientId:'P010', taskName:'부종 사정', description:'하지 부종 측정', status:'Pending', estimatedMinutes:5, dueTime:'2026-05-26T11:00:00', assignedTo:'N001', category:'Monitoring' },
  // P003 박문수 (고혈압 — 전부 완료)
  { taskId:'T038', patientId:'P003', taskName:'활력징후 측정', description:'', status:'Completed', estimatedMinutes:5, dueTime:'2026-05-26T08:00:00', assignedTo:'N001', category:'Monitoring' },
  { taskId:'T039', patientId:'P003', taskName:'혈압약 투여', description:'Amlodipine + Losartan', status:'Completed', estimatedMinutes:5, dueTime:'2026-05-26T09:00:00', assignedTo:'N001', category:'Medication' },
  { taskId:'T040', patientId:'P003', taskName:'퇴원 교육', description:'저염식, 운동, 자가 혈압 측정', status:'Completed', estimatedMinutes:20, dueTime:'2026-05-26T10:00:00', assignedTo:'N001', category:'Documentation' },
  { taskId:'T041', patientId:'P003', taskName:'외래 예약 확인', description:'처방전 준비', status:'Completed', estimatedMinutes:10, dueTime:'2026-05-26T11:00:00', assignedTo:'N001', category:'Documentation' },
  // P004 최민지 (골절)
  { taskId:'T042', patientId:'P004', taskName:'활력징후 및 통증 사정', description:'', status:'Completed', estimatedMinutes:10, dueTime:'2026-05-26T08:00:00', assignedTo:'N001', category:'Monitoring' },
  { taskId:'T043', patientId:'P004', taskName:'수술 부위 드레싱 및 부종 확인', description:'', status:'Pending', estimatedMinutes:15, dueTime:'2026-05-26T10:00:00', assignedTo:'N001', category:'Hygiene' },
  { taskId:'T044', patientId:'P004', taskName:'Enoxaparin SC 투여', description:'DVT 예방 + 탄력 스타킹 확인', status:'Pending', estimatedMinutes:10, dueTime:'2026-05-26T10:00:00', assignedTo:'N001', category:'Medication' },
  { taskId:'T045', patientId:'P004', taskName:'물리치료 전 침상 운동 교육', description:'', status:'Pending', estimatedMinutes:15, dueTime:'2026-05-26T14:00:00', assignedTo:'N001', category:'Documentation' },
]

// ── 재고 Mock 데이터 ──────────────────────────
export const mockInventory: InventoryItem[] = [
  { itemId:'INV001', itemName:'21G 주사기', category:'Syringe', quantity:15, reorderPoint:10, unit:'개', status:'sufficient', history:[] },
  { itemId:'INV002', itemName:'23G 주사기', category:'Syringe', quantity:7, reorderPoint:10, unit:'개', status:'warning', history:[] },
  { itemId:'INV003', itemName:'25G 주사기', category:'Syringe', quantity:0, reorderPoint:10, unit:'개', status:'critical', history:[] },
  { itemId:'INV004', itemName:'18G 주사기', category:'Syringe', quantity:22, reorderPoint:8, unit:'개', status:'sufficient', history:[] },
  { itemId:'INV005', itemName:'인슐린 주사기 1mL', category:'Syringe', quantity:5, reorderPoint:10, unit:'개', status:'warning', history:[] },
  { itemId:'INV006', itemName:'거즈 5x5', category:'Gauze', quantity:50, reorderPoint:20, unit:'장', status:'sufficient', history:[] },
  { itemId:'INV007', itemName:'거즈 10x10', category:'Gauze', quantity:8, reorderPoint:15, unit:'장', status:'warning', history:[] },
  { itemId:'INV008', itemName:'생리식염수 500mL', category:'IV', quantity:12, reorderPoint:10, unit:'병', status:'sufficient', history:[] },
  { itemId:'INV009', itemName:'5% 포도당 500mL', category:'IV', quantity:3, reorderPoint:8, unit:'병', status:'critical', history:[] },
  { itemId:'INV010', itemName:'니트릴 장갑 (M)', category:'Glove', quantity:80, reorderPoint:30, unit:'개', status:'sufficient', history:[] },
]
