import type { Medication, Prescription } from '../types'

// ── 진단별 처방 약물 데이터 (의사 처방 기반) ──────────────────────────────────
export const patientMedications: Record<string, Medication[]> = {
  // p1 박서준 3세 — 급성 기관지염
  p1: [
    { name: '암브록솔 시럽 (Ambroxol)', dosage: '7.5mg', frequency: 'TID', route: 'PO' },
    { name: '아세트아미노펜 시럽 (Acetaminophen)', dosage: '100mg', frequency: 'Q6H', route: 'PO' },
    { name: '살부타몰 네뷸라이저 (Salbutamol)', dosage: '0.5mg', frequency: 'Q4H', route: 'NEB' },
  ],
  // p2 김민서 7세 — 중이염
  p2: [
    { name: '아목시실린 (Amoxicillin)', dosage: '250mg', frequency: 'TID', route: 'PO' },
    { name: '이부프로펜 시럽 (Ibuprofen)', dosage: '150mg', frequency: 'Q6H', route: 'PO' },
  ],
  // p3 이지훈 12세 — 천식
  p3: [
    { name: '살부타몰 MDI (Salbutamol)', dosage: '100mcg', frequency: 'Q4H', route: 'NEB' },
    { name: '플루티카손 흡입기 (Fluticasone)', dosage: '100mcg', frequency: 'BID', route: 'NEB' },
    { name: '메틸프레드니솔론 (Methylprednisolone)', dosage: '20mg', frequency: 'QD', route: 'IV' },
  ],
  // p4 최유진 25세 — 골절
  p4: [
    { name: '케토롤락 (Ketorolac)', dosage: '30mg', frequency: 'Q6H', route: 'IV' },
    { name: '세파졸린 (Cefazolin)', dosage: '1g', frequency: 'Q8H', route: 'IV' },
    { name: '트라마돌 (Tramadol)', dosage: '50mg', frequency: 'Q6H', route: 'PO' },
  ],
  // p5 한예린 34세 — 신장결석
  p5: [
    { name: '케토롤락 (Ketorolac)', dosage: '30mg', frequency: 'Q6H', route: 'IV' },
    { name: '탐술로신 (Tamsulosin)', dosage: '0.4mg', frequency: 'QD', route: 'PO' },
    { name: '0.9% 생리식염수 (Normal Saline)', dosage: '1000ml', frequency: 'Q8H', route: 'IV' },
  ],
  // p6 정현우 45세 — 복부통증
  p6: [
    { name: '부스코판 (Buscopan)', dosage: '20mg', frequency: 'Q6H', route: 'IV' },
    { name: '판토프라졸 (Pantoprazole)', dosage: '40mg', frequency: 'QD', route: 'IV' },
    { name: '메토클로프라미드 (Metoclopramide)', dosage: '10mg', frequency: 'TID', route: 'IV' },
  ],
  // p7 이미나 56세 — 당뇨 (High)
  p7: [
    { name: '인슐린 글라진 (Insulin Glargine)', dosage: '20U', frequency: 'QD', route: 'SC' },
    { name: '인슐린 아스파트 (Insulin Aspart)', dosage: '6U', frequency: 'TID', route: 'SC' },
    { name: '메트포르민 (Metformin)', dosage: '500mg', frequency: 'BID', route: 'PO' },
    { name: '아스피린 (Aspirin)', dosage: '100mg', frequency: 'QD', route: 'PO' },
  ],
  // p8 오상민 67세 — 폐렴 (High)
  p8: [
    { name: '세프트리악손 (Ceftriaxone)', dosage: '2g', frequency: 'Q12H', route: 'IV' },
    { name: '아지트로마이신 (Azithromycin)', dosage: '500mg', frequency: 'QD', route: 'IV' },
    { name: '산소 투여 (O2 Therapy)', dosage: '2L/min', frequency: 'Other', route: 'O2' },
    { name: '아세트아미노펜 (Acetaminophen)', dosage: '650mg', frequency: 'Q6H', route: 'PO' },
  ],
  // p9 조성민 72세 — 심부전 (High)
  p9: [
    { name: '푸로세미드 (Furosemide)', dosage: '40mg', frequency: 'BID', route: 'IV' },
    { name: '스피로노락톤 (Spironolactone)', dosage: '25mg', frequency: 'QD', route: 'PO' },
    { name: '카르베딜롤 (Carvedilol)', dosage: '6.25mg', frequency: 'BID', route: 'PO' },
    { name: '에날라프릴 (Enalapril)', dosage: '5mg', frequency: 'BID', route: 'PO' },
  ],
  // p10 송다혜 81세 — 치매
  p10: [
    { name: '도네페질 (Donepezil)', dosage: '10mg', frequency: 'QD', route: 'PO' },
    { name: '멤안틴 (Memantine)', dosage: '10mg', frequency: 'BID', route: 'PO' },
    { name: '쿠에티아핀 (Quetiapine)', dosage: '25mg', frequency: 'QD', route: 'PO' },
  ],
  // p11 김유리 4세 — 탈수
  p11: [
    { name: '링거젖산 (Lactated Ringer)', dosage: '500ml', frequency: 'Q8H', route: 'IV' },
    { name: '전해질 보충 (Electrolyte)', dosage: '1포', frequency: 'BID', route: 'PO' },
  ],
  // p12 박수영 9세 — 소아열
  p12: [
    { name: '아세트아미노펜 시럽 (Acetaminophen)', dosage: '240mg', frequency: 'Q6H', route: 'PO' },
    { name: '이부프로펜 시럽 (Ibuprofen)', dosage: '200mg', frequency: 'Q8H', route: 'PO' },
  ],
  // p13 윤지후 15세 — 골절 후 관찰
  p13: [
    { name: '이부프로펜 (Ibuprofen)', dosage: '400mg', frequency: 'TID', route: 'PO' },
    { name: '세파졸린 (Cefazolin)', dosage: '1g', frequency: 'Q8H', route: 'IV' },
  ],
  // p14 강민호 29세 — 급성 췌장염
  p14: [
    { name: '0.9% 생리식염수 (Normal Saline)', dosage: '1000ml', frequency: 'Q8H', route: 'IV' },
    { name: '케토롤락 (Ketorolac)', dosage: '30mg', frequency: 'Q6H', route: 'IV' },
    { name: '판토프라졸 (Pantoprazole)', dosage: '40mg', frequency: 'BID', route: 'IV' },
    { name: '메로페넴 (Meropenem)', dosage: '1g', frequency: 'Q8H', route: 'IV' },
  ],
  // p15 서승민 38세 — 수술 후 회복
  p15: [
    { name: '세파졸린 (Cefazolin)', dosage: '1g', frequency: 'Q8H', route: 'IV' },
    { name: '케토롤락 (Ketorolac)', dosage: '15mg', frequency: 'Q6H', route: 'IV' },
    { name: '헤파린 (Heparin)', dosage: '5000U', frequency: 'Q12H', route: 'SC' },
    { name: '오메프라졸 (Omeprazole)', dosage: '20mg', frequency: 'QD', route: 'PO' },
  ],
  // p16 임채원 50세 — 고혈압
  p16: [
    { name: '암로디핀 (Amlodipine)', dosage: '5mg', frequency: 'QD', route: 'PO' },
    { name: '로사르탄 (Losartan)', dosage: '50mg', frequency: 'QD', route: 'PO' },
    { name: '하이드로클로로티아지드 (HCTZ)', dosage: '12.5mg', frequency: 'QD', route: 'PO' },
  ],
  // p17 백지영 63세 — 당뇨 합병증 (High)
  p17: [
    { name: '인슐린 글라진 (Insulin Glargine)', dosage: '24U', frequency: 'QD', route: 'SC' },
    { name: '인슐린 아스파트 (Insulin Aspart)', dosage: '8U', frequency: 'TID', route: 'SC' },
    { name: '리나글립틴 (Linagliptin)', dosage: '5mg', frequency: 'QD', route: 'PO' },
    { name: '세프트리악손 (Ceftriaxone)', dosage: '1g', frequency: 'QD', route: 'IV' },
    { name: '산소 투여 (O2 Therapy)', dosage: '3L/min', frequency: 'Other', route: 'O2' },
  ],
  // p18 홍성표 77세 — COPD (High)
  p18: [
    { name: '살부타몰 네뷸라이저 (Salbutamol)', dosage: '2.5mg', frequency: 'Q4H', route: 'NEB' },
    { name: '이프라트로피움 네뷸라이저 (Ipratropium)', dosage: '0.5mg', frequency: 'Q6H', route: 'NEB' },
    { name: '산소 투여 (O2 Therapy)', dosage: '1L/min', frequency: 'Other', route: 'O2' },
    { name: '메틸프레드니솔론 (Methylprednisolone)', dosage: '40mg', frequency: 'QD', route: 'IV' },
    { name: '독시사이클린 (Doxycycline)', dosage: '100mg', frequency: 'BID', route: 'PO' },
  ],
  // p19 유하늘 2세 — 영아 발열
  p19: [
    { name: '아세트아미노펜 시럽 (Acetaminophen)', dosage: '60mg', frequency: 'Q6H', route: 'PO' },
    { name: '링거젖산 (Lactated Ringer)', dosage: '250ml', frequency: 'Q12H', route: 'IV' },
  ],
  // p20 문혜진 19세 — 식중독
  p20: [
    { name: '0.9% 생리식염수 (Normal Saline)', dosage: '500ml', frequency: 'Q8H', route: 'IV' },
    { name: '메토클로프라미드 (Metoclopramide)', dosage: '10mg', frequency: 'TID', route: 'IV' },
    { name: '시프로플록사신 (Ciprofloxacin)', dosage: '500mg', frequency: 'BID', route: 'PO' },
  ],
  // p21 신동엽 41세 — 복부수술 후
  p21: [
    { name: '세파졸린 (Cefazolin)', dosage: '1g', frequency: 'Q8H', route: 'IV' },
    { name: '케토롤락 (Ketorolac)', dosage: '30mg', frequency: 'Q6H', route: 'IV' },
    { name: '헤파린 (Heparin)', dosage: '5000U', frequency: 'Q12H', route: 'SC' },
    { name: '판토프라졸 (Pantoprazole)', dosage: '40mg', frequency: 'QD', route: 'IV' },
  ],
  // p22 노지훈 58세 — 관상동맥질환 (High)
  p22: [
    { name: '아스피린 (Aspirin)', dosage: '100mg', frequency: 'QD', route: 'PO' },
    { name: '클로피도그렐 (Clopidogrel)', dosage: '75mg', frequency: 'QD', route: 'PO' },
    { name: '아토르바스타틴 (Atorvastatin)', dosage: '40mg', frequency: 'QD', route: 'PO' },
    { name: '비소프롤롤 (Bisoprolol)', dosage: '5mg', frequency: 'QD', route: 'PO' },
    { name: '니트로글리세린 패치 (NTG Patch)', dosage: '5mg/24h', frequency: 'QD', route: 'Other' },
    { name: '헤파린 IV (Heparin)', dosage: '1000U/h', frequency: 'Other', route: 'IV' },
  ],
  // p23 권소영 33세 — 혈액검사 이상
  p23: [
    { name: '엽산 (Folic Acid)', dosage: '5mg', frequency: 'QD', route: 'PO' },
    { name: '철분제 (Ferrous Sulfate)', dosage: '300mg', frequency: 'BID', route: 'PO' },
  ],
  // p24 이현주 69세 — 퇴행성 관절염
  p24: [
    { name: '셀레콕시브 (Celecoxib)', dosage: '200mg', frequency: 'QD', route: 'PO' },
    { name: '트라마돌 (Tramadol)', dosage: '50mg', frequency: 'BID', route: 'PO' },
    { name: '칼슘 + 비타민D (Ca+VitD)', dosage: '500mg+400IU', frequency: 'BID', route: 'PO' },
  ],
}

// ── 의사 처방 목록 (Doctor's Order) ──────────────────────────────────────────
const today = new Date().toISOString().slice(0, 10)
const ts = (hOffset = 0) => Date.now() - hOffset * 3600 * 1000

export const mockPrescriptions: Prescription[] = [
  // High severity 환자들 — 여러 처방
  { id: 'rx-p7-1', patientId: 'p7', patientName: '이미나', roomNumber: '107A', doctorName: '김철수 과장', orderedAt: ts(3), medication: { name: '인슐린 글라진 (Insulin Glargine)', dosage: '20U', frequency: 'QD', route: 'SC' }, indication: '제2형 당뇨 혈당 조절', duration: '입원 중 지속', startDate: today, status: 'active', verified: true },
  { id: 'rx-p7-2', patientId: 'p7', patientName: '이미나', roomNumber: '107A', doctorName: '김철수 과장', orderedAt: ts(3), medication: { name: '인슐린 아스파트 (Insulin Aspart)', dosage: '6U', frequency: 'TID', route: 'SC' }, indication: '식전 혈당 조절', duration: '입원 중 지속', startDate: today, status: 'active', verified: true },
  { id: 'rx-p7-3', patientId: 'p7', patientName: '이미나', roomNumber: '107A', doctorName: '김철수 과장', orderedAt: ts(3), medication: { name: '메트포르민 (Metformin)', dosage: '500mg', frequency: 'BID', route: 'PO' }, indication: '혈당 강하', duration: '7일', startDate: today, status: 'active', verified: false },

  { id: 'rx-p8-1', patientId: 'p8', patientName: '오상민', roomNumber: '108B', doctorName: '박민준 교수', orderedAt: ts(5), medication: { name: '세프트리악손 (Ceftriaxone)', dosage: '2g', frequency: 'Q12H', route: 'IV' }, indication: '중증 폐렴 항균 치료', duration: '10일', startDate: today, status: 'active', verified: true },
  { id: 'rx-p8-2', patientId: 'p8', patientName: '오상민', roomNumber: '108B', doctorName: '박민준 교수', orderedAt: ts(5), medication: { name: '아지트로마이신 (Azithromycin)', dosage: '500mg', frequency: 'QD', route: 'IV' }, indication: '비정형 폐렴 커버', duration: '5일', startDate: today, status: 'active', verified: true },
  { id: 'rx-p8-3', patientId: 'p8', patientName: '오상민', roomNumber: '108B', doctorName: '박민준 교수', orderedAt: ts(5), medication: { name: '산소 투여 (O2 Therapy)', dosage: '2L/min', frequency: 'Other', route: 'O2' }, indication: 'SpO2 유지 (목표 >94%)', duration: '임상 경과 따라', startDate: today, status: 'active', verified: true },

  { id: 'rx-p9-1', patientId: 'p9', patientName: '조성민', roomNumber: '109C', doctorName: '이재훈 교수', orderedAt: ts(8), medication: { name: '푸로세미드 (Furosemide)', dosage: '40mg', frequency: 'BID', route: 'IV' }, indication: '심부전 체액 과부하 이뇨', duration: '임상 경과 따라', startDate: today, status: 'active', verified: true },
  { id: 'rx-p9-2', patientId: 'p9', patientName: '조성민', roomNumber: '109C', doctorName: '이재훈 교수', orderedAt: ts(8), medication: { name: '카르베딜롤 (Carvedilol)', dosage: '6.25mg', frequency: 'BID', route: 'PO' }, indication: '심박수 조절, 심기능 보호', duration: '지속', startDate: today, status: 'active', verified: false },

  { id: 'rx-p22-1', patientId: 'p22', patientName: '노지훈', roomNumber: '122A', doctorName: '최성호 과장', orderedAt: ts(1), medication: { name: '헤파린 IV (Heparin)', dosage: '1000U/h', frequency: 'Other', route: 'IV' }, indication: '관상동맥 혈전 예방', duration: '48시간', startDate: today, status: 'active', verified: false },
  { id: 'rx-p22-2', patientId: 'p22', patientName: '노지훈', roomNumber: '122A', doctorName: '최성호 과장', orderedAt: ts(1), medication: { name: '클로피도그렐 (Clopidogrel)', dosage: '75mg', frequency: 'QD', route: 'PO' }, indication: '항혈소판 요법', duration: '12개월', startDate: today, status: 'active', verified: true },

  // Medium severity
  { id: 'rx-p3-1', patientId: 'p3', patientName: '이지훈', roomNumber: '103C', doctorName: '홍길순 전문의', orderedAt: ts(6), medication: { name: '살부타몰 MDI (Salbutamol)', dosage: '100mcg', frequency: 'Q4H', route: 'NEB' }, indication: '천식 급성 발작 기관지 확장', duration: '5일', startDate: today, status: 'active', verified: true },
  { id: 'rx-p3-2', patientId: 'p3', patientName: '이지훈', roomNumber: '103C', doctorName: '홍길순 전문의', orderedAt: ts(6), medication: { name: '메틸프레드니솔론 (Methylprednisolone)', dosage: '20mg', frequency: 'QD', route: 'IV' }, indication: '기도 염증 억제', duration: '3일', startDate: today, status: 'active', verified: false },

  { id: 'rx-p18-1', patientId: 'p18', patientName: '홍성표', roomNumber: '118C', doctorName: '박민준 교수', orderedAt: ts(4), medication: { name: '살부타몰 네뷸라이저 (Salbutamol)', dosage: '2.5mg', frequency: 'Q4H', route: 'NEB' }, indication: 'COPD 급성 악화 기관지 확장', duration: '입원 중 지속', startDate: today, status: 'active', verified: true },
  { id: 'rx-p18-2', patientId: 'p18', patientName: '홍성표', roomNumber: '118C', doctorName: '박민준 교수', orderedAt: ts(4), medication: { name: '산소 투여 (O2 Therapy)', dosage: '1L/min', frequency: 'Other', route: 'O2' }, indication: 'SpO2 유지 (목표 88~92%)', duration: '임상 경과 따라', startDate: today, status: 'active', verified: true },

  { id: 'rx-p14-1', patientId: 'p14', patientName: '강민호', roomNumber: '114B', doctorName: '김철수 과장', orderedAt: ts(2), medication: { name: '메로페넴 (Meropenem)', dosage: '1g', frequency: 'Q8H', route: 'IV' }, indication: '급성 췌장염 감염성 괴사 예방', duration: '7일', startDate: today, status: 'active', verified: false },

  // 최근 신규 처방 (미확인 강조용)
  { id: 'rx-p17-1', patientId: 'p17', patientName: '백지영', roomNumber: '117B', doctorName: '이재훈 교수', orderedAt: ts(0.5), medication: { name: '세프트리악손 (Ceftriaxone)', dosage: '1g', frequency: 'QD', route: 'IV' }, indication: '당뇨 발 감염 치료', duration: '14일', startDate: today, status: 'active', verified: false },
  { id: 'rx-p17-2', patientId: 'p17', patientName: '백지영', roomNumber: '117B', doctorName: '이재훈 교수', orderedAt: ts(0.5), medication: { name: '인슐린 글라진 (Insulin Glargine)', dosage: '24U', frequency: 'QD', route: 'SC' }, indication: '혈당 조절 강화', duration: '입원 중 지속', startDate: today, status: 'active', verified: false },
]
