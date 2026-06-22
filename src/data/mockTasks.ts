import type { NursingTask } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// 24명 환자 전원에 대한 간호 업무 (진단/중증도/나이 기반 실제적 배치)
// Day 교대 기준 dueTime. 간호사 배정은 autoAssign이 처리하므로 assignedTo는 placeholder.
// ─────────────────────────────────────────────────────────────────────────────

export const mockTasks: NursingTask[] = [

  // ── p1: 박서준 (3세, 급성 기관지염, Medium) ─────────────────────────────────
  { taskId: 'p1-t1', patientId: 'p1', taskName: '활력징후 측정', description: '체온·맥박·호흡수·SpO₂ 4시간마다 측정', status: 'Completed', estimatedMinutes: 10, dueTime: '09:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p1-t2', patientId: 'p1', taskName: '기관지 확장제 흡입', description: '네뷸라이저 살부타몰 2.5mg 투여', status: 'Completed', estimatedMinutes: 15, dueTime: '09:30', assignedTo: '', category: 'Medication' },
  { taskId: 'p1-t3', patientId: 'p1', taskName: '수분 섭취 권장', description: '1~2시간마다 구강 수분 섭취 격려', status: 'Pending', estimatedMinutes: 5, dueTime: '11:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p1-t4', patientId: 'p1', taskName: '체온 재측정', description: '해열제 투여 1시간 후 체온 재확인', status: 'Pending', estimatedMinutes: 5, dueTime: '13:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p1-t5', patientId: 'p1', taskName: '보호자 교육', description: '가정 내 기관지염 관리법 설명', status: 'Pending', estimatedMinutes: 10, dueTime: '15:00', assignedTo: '', category: 'Documentation' },

  // ── p2: 김민서 (7세, 중이염, Low) ───────────────────────────────────────────
  { taskId: 'p2-t1', patientId: 'p2', taskName: '활력징후 측정', description: '체온·맥박·호흡수 측정', status: 'Completed', estimatedMinutes: 8, dueTime: '08:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p2-t2', patientId: 'p2', taskName: '항생제 투약', description: '아목시실린 경구 투약 (오전)', status: 'Completed', estimatedMinutes: 5, dueTime: '09:00', assignedTo: '', category: 'Medication' },
  { taskId: 'p2-t3', patientId: 'p2', taskName: '이통 사정', description: '통증 척도(0-10) 기록, 필요 시 진통제 투여', status: 'Pending', estimatedMinutes: 10, dueTime: '14:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p2-t4', patientId: 'p2', taskName: '항생제 투약', description: '아목시실린 경구 투약 (저녁)', status: 'Pending', estimatedMinutes: 5, dueTime: '21:00', assignedTo: '', category: 'Medication' },

  // ── p3: 이지훈 (12세, 천식, Medium) ─────────────────────────────────────────
  { taskId: 'p3-t1', patientId: 'p3', taskName: 'SpO₂ 모니터링', description: '산소포화도 2시간마다 측정, 94% 이하 즉시 보고', status: 'Completed', estimatedMinutes: 5, dueTime: '08:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p3-t2', patientId: 'p3', taskName: '기관지 확장제 흡입', description: '살부타몰 MDI 2puff × 4시간마다', status: 'Completed', estimatedMinutes: 10, dueTime: '09:00', assignedTo: '', category: 'Medication' },
  { taskId: 'p3-t3', patientId: 'p3', taskName: '천식 유발 요인 사정', description: '환경적 유발인자 확인 및 제거', status: 'Completed', estimatedMinutes: 10, dueTime: '10:00', assignedTo: '', category: 'Documentation' },
  { taskId: 'p3-t4', patientId: 'p3', taskName: '기관지 확장제 흡입', description: '오후 투여', status: 'Pending', estimatedMinutes: 10, dueTime: '13:00', assignedTo: '', category: 'Medication' },
  { taskId: 'p3-t5', patientId: 'p3', taskName: '최대호기유속 측정', description: 'Peak flow meter 측정·기록', status: 'Pending', estimatedMinutes: 5, dueTime: '15:00', assignedTo: '', category: 'Monitoring' },

  // ── p4: 최유진 (25세, 골절, Low) ────────────────────────────────────────────
  { taskId: 'p4-t1', patientId: 'p4', taskName: '활력징후 측정', description: '혈압·맥박·체온 측정', status: 'Completed', estimatedMinutes: 8, dueTime: '08:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p4-t2', patientId: 'p4', taskName: '진통제 투약', description: '이부프로펜 400mg 경구 투약', status: 'Completed', estimatedMinutes: 5, dueTime: '09:00', assignedTo: '', category: 'Medication' },
  { taskId: 'p4-t3', patientId: 'p4', taskName: '부목/석고 상태 확인', description: '부종·피부색·감각·맥박 말단 순환 확인', status: 'Pending', estimatedMinutes: 10, dueTime: '11:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p4-t4', patientId: 'p4', taskName: '재활 운동 지도', description: '허용 범위 내 관절 운동 교육', status: 'Pending', estimatedMinutes: 15, dueTime: '14:00', assignedTo: '', category: 'Documentation' },

  // ── p5: 한예린 (34세, 신장결석, Medium) ─────────────────────────────────────
  { taskId: 'p5-t1', patientId: 'p5', taskName: '활력징후 측정', description: '혈압·맥박·체온·호흡수 측정', status: 'Completed', estimatedMinutes: 8, dueTime: '08:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p5-t2', patientId: 'p5', taskName: '진통제 IV 투약', description: '케토롤락 30mg IV 투여', status: 'Completed', estimatedMinutes: 10, dueTime: '09:00', assignedTo: '', category: 'Medication' },
  { taskId: 'p5-t3', patientId: 'p5', taskName: '소변 여과 검사', description: '결석 배출 확인 위한 소변 여과', status: 'Pending', estimatedMinutes: 10, dueTime: '11:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p5-t4', patientId: 'p5', taskName: '수분 섭취 독려', description: '2L/일 이상 수분 섭취 권장', status: 'Pending', estimatedMinutes: 5, dueTime: '13:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p5-t5', patientId: 'p5', taskName: '신장 기능 검사 결과 확인', description: '혈중 Cr, BUN 수치 확인 및 기록', status: 'Pending', estimatedMinutes: 10, dueTime: '15:00', assignedTo: '', category: 'Documentation' },

  // ── p6: 정현우 (45세, 복부통증, Medium) ─────────────────────────────────────
  { taskId: 'p6-t1', patientId: 'p6', taskName: '활력징후 측정', description: '혈압·맥박·체온·호흡수 측정', status: 'Completed', estimatedMinutes: 8, dueTime: '08:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p6-t2', patientId: 'p6', taskName: '복부 상태 사정', description: '복부 청진·촉진·압통 여부 확인', status: 'Completed', estimatedMinutes: 10, dueTime: '09:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p6-t3', patientId: 'p6', taskName: '진통제 투약', description: '부스코판 10mg IM 투여', status: 'Pending', estimatedMinutes: 8, dueTime: '12:00', assignedTo: '', category: 'Medication' },
  { taskId: 'p6-t4', patientId: 'p6', taskName: '금식 여부 확인', description: '수술/시술 전 금식 상태 재확인', status: 'Pending', estimatedMinutes: 5, dueTime: '14:00', assignedTo: '', category: 'Documentation' },
  { taskId: 'p6-t5', patientId: 'p6', taskName: '복부 초음파 결과 확인', description: '영상의학과 보고서 확인 및 의사 보고', status: 'Pending', estimatedMinutes: 10, dueTime: '16:00', assignedTo: '', category: 'Documentation' },

  // ── p7: 이미나 (56세, 당뇨, High) ───────────────────────────────────────────
  { taskId: 'p7-t1', patientId: 'p7', taskName: '혈당 측정', description: '공복·식전·식후 2시간 혈당 측정', status: 'Completed', estimatedMinutes: 5, dueTime: '07:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p7-t2', patientId: 'p7', taskName: '인슐린 투약', description: '휴물린R 10unit SC 투여 (아침 식전)', status: 'Completed', estimatedMinutes: 8, dueTime: '08:00', assignedTo: '', category: 'Medication' },
  { taskId: 'p7-t3', patientId: 'p7', taskName: '활력징후 측정', description: '혈압·맥박·체온·호흡수·SpO₂ 측정', status: 'Completed', estimatedMinutes: 10, dueTime: '09:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p7-t4', patientId: 'p7', taskName: '식후 혈당 측정', description: '점심 식후 2시간 혈당 측정', status: 'Pending', estimatedMinutes: 5, dueTime: '13:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p7-t5', patientId: 'p7', taskName: '인슐린 투약', description: '휴물린R 10unit SC 투여 (저녁 식전)', status: 'Pending', estimatedMinutes: 8, dueTime: '18:00', assignedTo: '', category: 'Medication' },
  { taskId: 'p7-t6', patientId: 'p7', taskName: '발 상태 확인', description: '당뇨발 궤양·감염 여부 매일 확인', status: 'Pending', estimatedMinutes: 10, dueTime: '14:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p7-t7', patientId: 'p7', taskName: '당뇨 자가관리 교육', description: '식이요법·혈당 자가측정 방법 교육', status: 'Pending', estimatedMinutes: 20, dueTime: '15:00', assignedTo: '', category: 'Documentation' },

  // ── p8: 오상민 (67세, 폐렴, High) ───────────────────────────────────────────
  { taskId: 'p8-t1', patientId: 'p8', taskName: 'SpO₂·호흡수 모니터링', description: '1시간마다 측정, SpO₂ 92% 이하 즉시 보고', status: 'Completed', estimatedMinutes: 8, dueTime: '08:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p8-t2', patientId: 'p8', taskName: '산소 투여', description: 'NC 3L/min → SpO₂ 94% 이상 유지', status: 'Completed', estimatedMinutes: 10, dueTime: '08:30', assignedTo: '', category: 'Medication' },
  { taskId: 'p8-t3', patientId: 'p8', taskName: '항생제 IV 투약', description: '세프트리악손 2g IV 투여', status: 'Completed', estimatedMinutes: 15, dueTime: '09:00', assignedTo: '', category: 'Medication' },
  { taskId: 'p8-t4', patientId: 'p8', taskName: '체위 변경', description: '2시간마다 체위 변경 (욕창 예방)', status: 'Pending', estimatedMinutes: 10, dueTime: '11:00', assignedTo: '', category: 'Hygiene' },
  { taskId: 'p8-t5', patientId: 'p8', taskName: '흉부물리치료', description: '타진·진동 요법으로 객담 배출 유도', status: 'Pending', estimatedMinutes: 15, dueTime: '13:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p8-t6', patientId: 'p8', taskName: '항생제 IV 2차 투약', description: '세프트리악손 2g IV 오후 투여', status: 'Pending', estimatedMinutes: 15, dueTime: '21:00', assignedTo: '', category: 'Medication' },
  { taskId: 'p8-t7', patientId: 'p8', taskName: '수액 IV 투여', description: '0.9% NS 1000mL @ 80mL/hr 관리', status: 'Pending', estimatedMinutes: 10, dueTime: '10:00', assignedTo: '', category: 'Medication' },

  // ── p9: 조성민 (72세, 심부전, High) ─────────────────────────────────────────
  { taskId: 'p9-t1', patientId: 'p9', taskName: '활력징후 측정', description: '혈압·맥박·호흡수·SpO₂ 2시간마다', status: 'Completed', estimatedMinutes: 10, dueTime: '08:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p9-t2', patientId: 'p9', taskName: '이뇨제 IV 투약', description: '푸로세미드 40mg IV 투여', status: 'Completed', estimatedMinutes: 10, dueTime: '09:00', assignedTo: '', category: 'Medication' },
  { taskId: 'p9-t3', patientId: 'p9', taskName: '체중 측정·기록', description: '매일 오전 기상 직후 공복 체중 측정', status: 'Completed', estimatedMinutes: 5, dueTime: '07:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p9-t4', patientId: 'p9', taskName: '섭취·배설량 측정', description: 'I&O 4시간마다 측정·기록', status: 'Pending', estimatedMinutes: 10, dueTime: '12:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p9-t5', patientId: 'p9', taskName: '부종 사정', description: '양 하지 부종 등급(0~4+) 기록', status: 'Pending', estimatedMinutes: 10, dueTime: '14:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p9-t6', patientId: 'p9', taskName: '심장 재활 교육', description: '저염식·수분 제한·활동 제한 교육', status: 'Pending', estimatedMinutes: 20, dueTime: '15:00', assignedTo: '', category: 'Documentation' },

  // ── p10: 송다혜 (81세, 치매, Medium) ────────────────────────────────────────
  { taskId: 'p10-t1', patientId: 'p10', taskName: '활력징후 측정', description: '혈압·맥박·체온 측정', status: 'Completed', estimatedMinutes: 8, dueTime: '08:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p10-t2', patientId: 'p10', taskName: '치매 약 투약', description: '도네페질 10mg 경구 투약 (아침)', status: 'Completed', estimatedMinutes: 5, dueTime: '09:00', assignedTo: '', category: 'Medication' },
  { taskId: 'p10-t3', patientId: 'p10', taskName: '낙상 위험 사정', description: '낙상 위험 척도 매일 재평가, 침대 난간 확인', status: 'Pending', estimatedMinutes: 10, dueTime: '10:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p10-t4', patientId: 'p10', taskName: '구강 위생', description: '구강 청결, 의치 상태 확인', status: 'Pending', estimatedMinutes: 10, dueTime: '12:00', assignedTo: '', category: 'Hygiene' },
  { taskId: 'p10-t5', patientId: 'p10', taskName: '인지 자극 활동', description: '신문 읽기·그림 그리기 등 인지 자극', status: 'Pending', estimatedMinutes: 15, dueTime: '14:00', assignedTo: '', category: 'Documentation' },
  { taskId: 'p10-t6', patientId: 'p10', taskName: '치매 약 투약 (저녁)', description: '메만틴 10mg 경구 투약', status: 'Pending', estimatedMinutes: 5, dueTime: '18:00', assignedTo: '', category: 'Medication' },

  // ── p11: 김유리 (4세, 탈수, Low) ────────────────────────────────────────────
  { taskId: 'p11-t1', patientId: 'p11', taskName: '활력징후 측정', description: '체온·맥박·호흡수·BP 측정', status: 'Completed', estimatedMinutes: 8, dueTime: '08:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p11-t2', patientId: 'p11', taskName: '수액 IV 투여', description: '소아용 Hartmann 250mL @ 20mL/hr', status: 'Completed', estimatedMinutes: 10, dueTime: '09:00', assignedTo: '', category: 'Medication' },
  { taskId: 'p11-t3', patientId: 'p11', taskName: '섭취·배설량 측정', description: '2시간마다 I&O 측정 (기저귀 포함)', status: 'Pending', estimatedMinutes: 5, dueTime: '11:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p11-t4', patientId: 'p11', taskName: '탈수 징후 모니터링', description: '피부 탄력도·점막·눈물 확인', status: 'Pending', estimatedMinutes: 8, dueTime: '13:00', assignedTo: '', category: 'Monitoring' },

  // ── p12: 박수영 (9세, 소아열, Medium) ───────────────────────────────────────
  { taskId: 'p12-t1', patientId: 'p12', taskName: '체온 측정', description: '1시간마다 체온 측정', status: 'Completed', estimatedMinutes: 5, dueTime: '08:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p12-t2', patientId: 'p12', taskName: '해열제 투약', description: '아세트아미노펜 300mg 경구 (38.5℃ 이상)', status: 'Completed', estimatedMinutes: 5, dueTime: '09:00', assignedTo: '', category: 'Medication' },
  { taskId: 'p12-t3', patientId: 'p12', taskName: '미온수 마사지', description: '체온 38.5℃ 이상 시 미온수 피부 마사지', status: 'Pending', estimatedMinutes: 10, dueTime: '11:00', assignedTo: '', category: 'Hygiene' },
  { taskId: 'p12-t4', patientId: 'p12', taskName: '열원인 검사 결과 확인', description: '혈액 배양·소변 배양 결과 확인', status: 'Pending', estimatedMinutes: 10, dueTime: '15:00', assignedTo: '', category: 'Documentation' },

  // ── p13: 윤지후 (15세, 골절 후 관찰, Low) ───────────────────────────────────
  { taskId: 'p13-t1', patientId: 'p13', taskName: '활력징후 측정', description: '혈압·맥박·체온 측정', status: 'Completed', estimatedMinutes: 8, dueTime: '08:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p13-t2', patientId: 'p13', taskName: '신경혈관 상태 확인', description: '5P 사정 (Pain/Pallor/Pulse/Paresthesia/Paralysis)', status: 'Completed', estimatedMinutes: 10, dueTime: '09:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p13-t3', patientId: 'p13', taskName: '진통제 투약', description: '트라마돌 50mg 경구 투약', status: 'Pending', estimatedMinutes: 5, dueTime: '13:00', assignedTo: '', category: 'Medication' },
  { taskId: 'p13-t4', patientId: 'p13', taskName: '재활 운동 보조', description: '물리치료사 협조 하 운동 보조', status: 'Pending', estimatedMinutes: 20, dueTime: '14:00', assignedTo: '', category: 'Documentation' },

  // ── p14: 강민호 (29세, 급성 췌장염, Medium) ─────────────────────────────────
  { taskId: 'p14-t1', patientId: 'p14', taskName: '활력징후 측정', description: '혈압·맥박·체온·호흡수 2시간마다', status: 'Completed', estimatedMinutes: 8, dueTime: '08:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p14-t2', patientId: 'p14', taskName: '수액 IV 투여', description: 'LR solution 125mL/hr IV 투여', status: 'Completed', estimatedMinutes: 10, dueTime: '09:00', assignedTo: '', category: 'Medication' },
  { taskId: 'p14-t3', patientId: 'p14', taskName: '통증 사정', description: 'NRS 통증 척도 2시간마다 기록', status: 'Completed', estimatedMinutes: 5, dueTime: '09:30', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p14-t4', patientId: 'p14', taskName: '금식 유지', description: 'NPO 상태 확인, 구강 섭취 차단 확인', status: 'Pending', estimatedMinutes: 5, dueTime: '12:00', assignedTo: '', category: 'Documentation' },
  { taskId: 'p14-t5', patientId: 'p14', taskName: '진통제 IV 투약', description: '모르핀 2mg IV prn (통증 7점 이상)', status: 'Pending', estimatedMinutes: 10, dueTime: '14:00', assignedTo: '', category: 'Medication' },

  // ── p15: 서승민 (38세, 수술 후 회복, Low) ───────────────────────────────────
  { taskId: 'p15-t1', patientId: 'p15', taskName: '활력징후 측정', description: '혈압·맥박·체온·호흡수·SpO₂ 측정', status: 'Completed', estimatedMinutes: 10, dueTime: '08:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p15-t2', patientId: 'p15', taskName: '수술 부위 드레싱 교환', description: '무균술로 드레싱 교환, 삼출물 특성 기록', status: 'Completed', estimatedMinutes: 15, dueTime: '09:00', assignedTo: '', category: 'Hygiene' },
  { taskId: 'p15-t3', patientId: 'p15', taskName: '항생제 경구 투약', description: '세파드록실 500mg 경구 (수술 후 예방)', status: 'Pending', estimatedMinutes: 5, dueTime: '13:00', assignedTo: '', category: 'Medication' },
  { taskId: 'p15-t4', patientId: 'p15', taskName: '조기 이상 보조', description: '침상 가장자리 앉기 → 병동 보행 보조', status: 'Pending', estimatedMinutes: 15, dueTime: '15:00', assignedTo: '', category: 'Documentation' },

  // ── p16: 임채원 (50세, 고혈압, Medium) ──────────────────────────────────────
  { taskId: 'p16-t1', patientId: 'p16', taskName: '혈압 측정', description: '좌우 혈압 측정 및 기록 (4시간마다)', status: 'Completed', estimatedMinutes: 8, dueTime: '08:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p16-t2', patientId: 'p16', taskName: '항고혈압제 투약', description: '암로디핀 5mg 경구 투약 (아침)', status: 'Completed', estimatedMinutes: 5, dueTime: '09:00', assignedTo: '', category: 'Medication' },
  { taskId: 'p16-t3', patientId: 'p16', taskName: '생활습관 교육', description: '저염식·금연·적당한 운동 교육', status: 'Pending', estimatedMinutes: 20, dueTime: '14:00', assignedTo: '', category: 'Documentation' },
  { taskId: 'p16-t4', patientId: 'p16', taskName: '혈압 재측정', description: '저녁 혈압 측정·기록', status: 'Pending', estimatedMinutes: 5, dueTime: '18:00', assignedTo: '', category: 'Monitoring' },

  // ── p17: 백지영 (63세, 당뇨 합병증, High) ───────────────────────────────────
  { taskId: 'p17-t1', patientId: 'p17', taskName: '혈당 측정', description: '공복·식전 혈당 측정 및 기록', status: 'Completed', estimatedMinutes: 5, dueTime: '07:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p17-t2', patientId: 'p17', taskName: '인슐린 투약', description: '인슐린 글라진 20unit SC (아침)', status: 'Completed', estimatedMinutes: 8, dueTime: '08:00', assignedTo: '', category: 'Medication' },
  { taskId: 'p17-t3', patientId: 'p17', taskName: '활력징후 측정', description: '혈압·맥박·체온·SpO₂ 측정', status: 'Completed', estimatedMinutes: 10, dueTime: '09:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p17-t4', patientId: 'p17', taskName: '신장 기능 모니터링', description: '소변량·부종·혈중 Cr 추이 확인', status: 'Pending', estimatedMinutes: 10, dueTime: '12:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p17-t5', patientId: 'p17', taskName: '식후 혈당 측정', description: '저녁 식후 2시간 혈당 측정', status: 'Pending', estimatedMinutes: 5, dueTime: '19:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p17-t6', patientId: 'p17', taskName: '당뇨 합병증 교육', description: '망막병증·신경병증·신증 예방 교육', status: 'Pending', estimatedMinutes: 20, dueTime: '15:00', assignedTo: '', category: 'Documentation' },

  // ── p18: 홍성표 (77세, COPD, High) ──────────────────────────────────────────
  { taskId: 'p18-t1', patientId: 'p18', taskName: 'SpO₂·호흡수 모니터링', description: '1시간마다 측정, SpO₂ 88% 이하 즉시 보고', status: 'Completed', estimatedMinutes: 8, dueTime: '08:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p18-t2', patientId: 'p18', taskName: '산소 투여', description: 'Venturi mask 28%, SpO₂ 88~92% 유지 (과산소 금지)', status: 'Completed', estimatedMinutes: 10, dueTime: '08:30', assignedTo: '', category: 'Medication' },
  { taskId: 'p18-t3', patientId: 'p18', taskName: '기관지 확장제 흡입', description: '이프라트로피움+살부타몰 네뷸라이저 Q6H', status: 'Completed', estimatedMinutes: 15, dueTime: '09:00', assignedTo: '', category: 'Medication' },
  { taskId: 'p18-t4', patientId: 'p18', taskName: '체위 변경', description: '욕창 예방 2시간 체위 변경', status: 'Pending', estimatedMinutes: 10, dueTime: '11:00', assignedTo: '', category: 'Hygiene' },
  { taskId: 'p18-t5', patientId: 'p18', taskName: '기관지 확장제 흡입 2차', description: '오후 투여 (Q6H 유지)', status: 'Pending', estimatedMinutes: 15, dueTime: '15:00', assignedTo: '', category: 'Medication' },
  { taskId: 'p18-t6', patientId: 'p18', taskName: 'COPD 악화 교육', description: '금연·폐 재활·호흡 훈련 교육', status: 'Pending', estimatedMinutes: 15, dueTime: '14:00', assignedTo: '', category: 'Documentation' },

  // ── p19: 유하늘 (2세, 영아 발열, Medium) ────────────────────────────────────
  { taskId: 'p19-t1', patientId: 'p19', taskName: '체온 측정', description: '30분마다 체온 측정 (직장·겨드랑이)', status: 'Completed', estimatedMinutes: 5, dueTime: '08:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p19-t2', patientId: 'p19', taskName: '해열제 투약', description: '아세트아미노펜 시럽 투약 (체중 기반)', status: 'Completed', estimatedMinutes: 5, dueTime: '09:00', assignedTo: '', category: 'Medication' },
  { taskId: 'p19-t3', patientId: 'p19', taskName: '경련 관찰', description: '고열 경련 발생 여부 지속 모니터링', status: 'Pending', estimatedMinutes: 5, dueTime: '11:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p19-t4', patientId: 'p19', taskName: '수분 섭취', description: '모유·분유 수유량 기록', status: 'Pending', estimatedMinutes: 5, dueTime: '12:00', assignedTo: '', category: 'Monitoring' },

  // ── p20: 문혜진 (19세, 식중독, Low) ─────────────────────────────────────────
  { taskId: 'p20-t1', patientId: 'p20', taskName: '활력징후 측정', description: '혈압·맥박·체온 측정', status: 'Completed', estimatedMinutes: 8, dueTime: '08:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p20-t2', patientId: 'p20', taskName: '수액 IV 투여', description: '0.9% NS 1000mL @ 100mL/hr IV', status: 'Completed', estimatedMinutes: 10, dueTime: '09:00', assignedTo: '', category: 'Medication' },
  { taskId: 'p20-t3', patientId: 'p20', taskName: '구토·설사 횟수 기록', description: '증상 빈도·양상 기록, 탈수 징후 확인', status: 'Pending', estimatedMinutes: 5, dueTime: '12:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p20-t4', patientId: 'p20', taskName: '식이 진행', description: '금식 → 미음 → 일반식 단계적 진행 확인', status: 'Pending', estimatedMinutes: 5, dueTime: '15:00', assignedTo: '', category: 'Documentation' },

  // ── p21: 신동엽 (41세, 복부수술 후, Medium) ─────────────────────────────────
  { taskId: 'p21-t1', patientId: 'p21', taskName: '활력징후 측정', description: '혈압·맥박·체온·호흡수 4시간마다', status: 'Completed', estimatedMinutes: 10, dueTime: '08:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p21-t2', patientId: 'p21', taskName: '수술 창상 관리', description: '창상 발적·부종·삼출물 확인, 드레싱 교환', status: 'Completed', estimatedMinutes: 15, dueTime: '09:00', assignedTo: '', category: 'Hygiene' },
  { taskId: 'p21-t3', patientId: 'p21', taskName: '진통제 IV 투약', description: '케토롤락 30mg IV Q8H', status: 'Completed', estimatedMinutes: 8, dueTime: '09:30', assignedTo: '', category: 'Medication' },
  { taskId: 'p21-t4', patientId: 'p21', taskName: '장음 청진', description: '배꼽 주변 장음 청진, 복부 팽만 확인', status: 'Pending', estimatedMinutes: 8, dueTime: '13:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p21-t5', patientId: 'p21', taskName: '진통제 2차 투약', description: '케토롤락 30mg IV 오후 투여', status: 'Pending', estimatedMinutes: 8, dueTime: '17:30', assignedTo: '', category: 'Medication' },

  // ── p22: 노지훈 (58세, 관상동맥질환, High) ──────────────────────────────────
  { taskId: 'p22-t1', patientId: 'p22', taskName: 'ECG 모니터링', description: '지속적 심전도 모니터링, 부정맥 즉시 보고', status: 'Completed', estimatedMinutes: 10, dueTime: '08:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p22-t2', patientId: 'p22', taskName: '활력징후 측정', description: '혈압·맥박·SpO₂ 1시간마다', status: 'Completed', estimatedMinutes: 8, dueTime: '09:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p22-t3', patientId: 'p22', taskName: '항혈소판제 투약', description: '아스피린 100mg + 클로피도그렐 75mg 경구', status: 'Completed', estimatedMinutes: 5, dueTime: '09:00', assignedTo: '', category: 'Medication' },
  { taskId: 'p22-t4', patientId: 'p22', taskName: '니트로글리세린 prn', description: '흉통 발생 시 NTG 설하 투여 및 즉시 보고', status: 'Pending', estimatedMinutes: 5, dueTime: '12:00', assignedTo: '', category: 'Medication' },
  { taskId: 'p22-t5', patientId: 'p22', taskName: '심장 재활 교육', description: '식이·운동·스트레스 관리 교육', status: 'Pending', estimatedMinutes: 20, dueTime: '15:00', assignedTo: '', category: 'Documentation' },
  { taskId: 'p22-t6', patientId: 'p22', taskName: '트로포닌 결과 확인', description: '심근 효소 추적 검사 결과 의사 보고', status: 'Pending', estimatedMinutes: 10, dueTime: '14:00', assignedTo: '', category: 'Documentation' },

  // ── p23: 권소영 (33세, 혈액검사 이상, Low) ──────────────────────────────────
  { taskId: 'p23-t1', patientId: 'p23', taskName: '활력징후 측정', description: '혈압·맥박·체온 측정', status: 'Completed', estimatedMinutes: 8, dueTime: '08:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p23-t2', patientId: 'p23', taskName: '채혈 준비', description: 'CBC·혈액화학 반복 채혈 준비 및 시행', status: 'Completed', estimatedMinutes: 10, dueTime: '09:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p23-t3', patientId: 'p23', taskName: '혈액검사 결과 확인', description: '추가 검사 결과 확인 및 의사 보고', status: 'Pending', estimatedMinutes: 10, dueTime: '14:00', assignedTo: '', category: 'Documentation' },
  { taskId: 'p23-t4', patientId: 'p23', taskName: '철분제 경구 투약', description: '황산제1철 300mg 경구 투약 (식사 후)', status: 'Pending', estimatedMinutes: 5, dueTime: '13:00', assignedTo: '', category: 'Medication' },

  // ── p24: 이현주 (69세, 퇴행성 관절염, Low) ──────────────────────────────────
  { taskId: 'p24-t1', patientId: 'p24', taskName: '활력징후 측정', description: '혈압·맥박·체온 측정', status: 'Completed', estimatedMinutes: 8, dueTime: '08:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p24-t2', patientId: 'p24', taskName: '진통소염제 투약', description: '셀레콕시브 200mg 경구 투약 (아침 식후)', status: 'Completed', estimatedMinutes: 5, dueTime: '09:00', assignedTo: '', category: 'Medication' },
  { taskId: 'p24-t3', patientId: 'p24', taskName: '관절 상태 사정', description: '관절 가동 범위·부종·열감 확인', status: 'Pending', estimatedMinutes: 10, dueTime: '11:00', assignedTo: '', category: 'Monitoring' },
  { taskId: 'p24-t4', patientId: 'p24', taskName: '온열 치료 보조', description: '무릎 온열 패드 적용 20분', status: 'Pending', estimatedMinutes: 25, dueTime: '13:00', assignedTo: '', category: 'Hygiene' },
  { taskId: 'p24-t5', patientId: 'p24', taskName: '진통소염제 투약 (저녁)', description: '셀레콕시브 200mg 경구 투약 (저녁 식후)', status: 'Pending', estimatedMinutes: 5, dueTime: '18:00', assignedTo: '', category: 'Medication' },

]

// patients의 nursingTaskIds를 mockTasks 기반으로 채우는 헬퍼
export function hydratePatientsWithTaskIds<T extends { id: string; nursingTaskIds: string[] }>(patients: T[]): T[] {
  return patients.map(p => ({
    ...p,
    nursingTaskIds: mockTasks.filter(t => t.patientId === p.id).map(t => t.taskId),
  }))
}
