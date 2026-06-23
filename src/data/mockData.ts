import type { Nurse, Patient, InventoryItem } from '../types'
export { mockTasks } from './mockTasks'
import { hydratePatientsWithTaskIds } from './mockTasks'
import { patientMedications, mockPrescriptions } from './mockMedications'
export { mockPrescriptions }

export const mockNurses: Nurse[] = [
  // Day nurses
  { id: 'n1', name: '이현규',   employeeId: 'EMP001', role: 'Nurse', shiftType: 'Day',     assignedPatients: [], status: 'Active', overtimeHours: 0, workStart: '08:30', workEnd: '17:30' },
  { id: 'n4', name: '오지현',   employeeId: 'EMP004', role: 'Nurse', shiftType: 'Day',     assignedPatients: [], status: 'Active', overtimeHours: 0, workStart: '08:30', workEnd: '17:30' },
  { id: 'n5', name: '김우주',   employeeId: 'EMP005', role: 'Nurse', shiftType: 'Day',     assignedPatients: [], status: 'Active', overtimeHours: 0, workStart: '08:30', workEnd: '17:30' },
  // Evening nurses
  { id: 'n2', name: '이수연',   employeeId: 'EMP002', role: 'Nurse', shiftType: 'Evening', assignedPatients: [], status: 'Active', overtimeHours: 0, workStart: '16:30', workEnd: '01:30' },
  { id: 'n6', name: '김다현',    employeeId: 'EMP007', role: 'Nurse', shiftType: 'Evening', assignedPatients: [], status: 'Active', overtimeHours: 0, workStart: '16:30', workEnd: '01:30' },
  // Night nurses
  { id: 'n3', name: '박준호',   employeeId: 'EMP003', role: 'Nurse', shiftType: 'Night',   assignedPatients: [], status: 'Active', overtimeHours: 0, workStart: '00:30', workEnd: '09:30' },
  { id: 'n7', name: '김라온',   employeeId: 'EMP008', role: 'Nurse', shiftType: 'Night',   assignedPatients: [], status: 'Active', overtimeHours: 0, workStart: '00:30', workEnd: '09:30' },
  // Head nurse
  { id: 'admin1', name: '수간호사 홍길동', employeeId: 'EMP006', role: 'HeadNurse', shiftType: 'Day', assignedPatients: [], status: 'Active', overtimeHours: 0, workStart: '08:00', workEnd: '17:00' },
]

// Create a larger set of patients so algorithm can be exercised
export const mockPatients: Patient[] = [
  { id: 'p1',  medicalRecordNo: 'MRN001', name: '박서준', age: 3,  gender: 'M', diagnosis: ['급성 기관지염'], severity: 'Medium', vitalSigns: { bloodPressure: '100/60', heartRate: 120, temperature: 38.2, respiratoryRate: 28, oxygenSaturation: 96 }, recentLabs: [], medications: [], nursingTaskIds: [], aiSummary: [], admissionDate: new Date().toISOString(), assignedNurseId: '', roomNumber: '101A' },
  { id: 'p2',  medicalRecordNo: 'MRN002', name: '김민서', age: 7,  gender: 'F', diagnosis: ['중이염'], severity: 'Low',    vitalSigns: { bloodPressure: '95/58', heartRate: 110, temperature: 37.8, respiratoryRate: 22, oxygenSaturation: 98 }, recentLabs: [], medications: [], nursingTaskIds: [], aiSummary: [], admissionDate: new Date().toISOString(), assignedNurseId: '', roomNumber: '102B' },
  { id: 'p3',  medicalRecordNo: 'MRN003', name: '이지훈', age: 12, gender: 'M', diagnosis: ['천식'], severity: 'Medium',    vitalSigns: { bloodPressure: '105/65', heartRate: 95, temperature: 36.6, respiratoryRate: 20, oxygenSaturation: 94 }, recentLabs: [], medications: [], nursingTaskIds: [], aiSummary: [], admissionDate: new Date().toISOString(), assignedNurseId: '', roomNumber: '103C' },
  { id: 'p4',  medicalRecordNo: 'MRN004', name: '최유진', age: 25, gender: 'F', diagnosis: ['골절'], severity: 'Low',       vitalSigns: { bloodPressure: '118/76', heartRate: 78, temperature: 36.7, respiratoryRate: 16, oxygenSaturation: 99 }, recentLabs: [], medications: [], nursingTaskIds: [], aiSummary: [], admissionDate: new Date().toISOString(), assignedNurseId: '', roomNumber: '104A' },
  { id: 'p5',  medicalRecordNo: 'MRN005', name: '한예린', age: 34, gender: 'F', diagnosis: ['신장결석'], severity: 'Medium',   vitalSigns: { bloodPressure: '122/80', heartRate: 82, temperature: 36.6, respiratoryRate: 18, oxygenSaturation: 97 }, recentLabs: [], medications: [], nursingTaskIds: [], aiSummary: [], admissionDate: new Date().toISOString(), assignedNurseId: '', roomNumber: '105B' },
  { id: 'p6',  medicalRecordNo: 'MRN006', name: '정현우', age: 45, gender: 'M', diagnosis: ['복부통증'], severity: 'Medium',    vitalSigns: { bloodPressure: '130/85', heartRate: 86, temperature: 37.0, respiratoryRate: 18, oxygenSaturation: 96 }, recentLabs: [], medications: [], nursingTaskIds: [], aiSummary: [], admissionDate: new Date().toISOString(), assignedNurseId: '', roomNumber: '106C' },
  { id: 'p7',  medicalRecordNo: 'MRN007', name: '이미나', age: 56, gender: 'F', diagnosis: ['당뇨'], severity: 'High',         vitalSigns: { bloodPressure: '140/90', heartRate: 92, temperature: 36.9, respiratoryRate: 18, oxygenSaturation: 95 }, recentLabs: [], medications: [], nursingTaskIds: [], aiSummary: [], admissionDate: new Date().toISOString(), assignedNurseId: '', roomNumber: '107A' },
  { id: 'p8',  medicalRecordNo: 'MRN008', name: '오상민', age: 67, gender: 'M', diagnosis: ['폐렴'], severity: 'High',         vitalSigns: { bloodPressure: '150/92', heartRate: 98, temperature: 38.4, respiratoryRate: 24, oxygenSaturation: 90 }, recentLabs: [], medications: [], nursingTaskIds: [], aiSummary: [], admissionDate: new Date().toISOString(), assignedNurseId: '', roomNumber: '108B' },
  { id: 'p9',  medicalRecordNo: 'MRN009', name: '조성민', age: 72, gender: 'M', diagnosis: ['심부전'], severity: 'High',        vitalSigns: { bloodPressure: '145/88', heartRate: 96, temperature: 36.8, respiratoryRate: 20, oxygenSaturation: 92 }, recentLabs: [], medications: [], nursingTaskIds: [], aiSummary: [], admissionDate: new Date().toISOString(), assignedNurseId: '', roomNumber: '109C' },
  { id: 'p10', medicalRecordNo: 'MRN010', name: '송다혜', age: 81, gender: 'F', diagnosis: ['치매'], severity: 'Medium',        vitalSigns: { bloodPressure: '130/80', heartRate: 76, temperature: 36.5, respiratoryRate: 16, oxygenSaturation: 95 }, recentLabs: [], medications: [], nursingTaskIds: [], aiSummary: [], admissionDate: new Date().toISOString(), assignedNurseId: '', roomNumber: '110A' },
  { id: 'p11', medicalRecordNo: 'MRN011', name: '김유리', age: 4,  gender: 'F', diagnosis: ['탈수'], severity: 'Low',           vitalSigns: { bloodPressure: '92/54', heartRate: 115, temperature: 37.5, respiratoryRate: 24, oxygenSaturation: 97 }, recentLabs: [], medications: [], nursingTaskIds: [], aiSummary: [], admissionDate: new Date().toISOString(), assignedNurseId: '', roomNumber: '111B' },
  { id: 'p12', medicalRecordNo: 'MRN012', name: '박수영', age: 9,  gender: 'F', diagnosis: ['소아열'], severity: 'Medium',      vitalSigns: { bloodPressure: '98/60', heartRate: 108, temperature: 38.0, respiratoryRate: 22, oxygenSaturation: 98 }, recentLabs: [], medications: [], nursingTaskIds: [], aiSummary: [], admissionDate: new Date().toISOString(), assignedNurseId: '', roomNumber: '112C' },
  { id: 'p13', medicalRecordNo: 'MRN013', name: '윤지후', age: 15, gender: 'M', diagnosis: ['골절 후 관찰'], severity: 'Low',    vitalSigns: { bloodPressure: '112/70', heartRate: 84, temperature: 36.7, respiratoryRate: 16, oxygenSaturation: 99 }, recentLabs: [], medications: [], nursingTaskIds: [], aiSummary: [], admissionDate: new Date().toISOString(), assignedNurseId: '', roomNumber: '113A' },
  { id: 'p14', medicalRecordNo: 'MRN014', name: '강민호', age: 29, gender: 'M', diagnosis: ['급성 췌장염'], severity: 'Medium',   vitalSigns: { bloodPressure: '120/78', heartRate: 88, temperature: 37.2, respiratoryRate: 18, oxygenSaturation: 96 }, recentLabs: [], medications: [], nursingTaskIds: [], aiSummary: [], admissionDate: new Date().toISOString(), assignedNurseId: '', roomNumber: '114B' },
  { id: 'p15', medicalRecordNo: 'MRN015', name: '서승민', age: 38, gender: 'M', diagnosis: ['수술 후 회복'], severity: 'Low',    vitalSigns: { bloodPressure: '118/76', heartRate: 80, temperature: 36.6, respiratoryRate: 16, oxygenSaturation: 98 }, recentLabs: [], medications: [], nursingTaskIds: [], aiSummary: [], admissionDate: new Date().toISOString(), assignedNurseId: '', roomNumber: '115C' },
  { id: 'p16', medicalRecordNo: 'MRN016', name: '임채원', age: 50, gender: 'F', diagnosis: ['고혈압'], severity: 'Medium',        vitalSigns: { bloodPressure: '150/95', heartRate: 90, temperature: 36.7, respiratoryRate: 18, oxygenSaturation: 95 }, recentLabs: [], medications: [], nursingTaskIds: [], aiSummary: [], admissionDate: new Date().toISOString(), assignedNurseId: '', roomNumber: '116A' },
  { id: 'p17', medicalRecordNo: 'MRN017', name: '백지영', age: 63, gender: 'F', diagnosis: ['당뇨 합병증'], severity: 'High',     vitalSigns: { bloodPressure: '142/88', heartRate: 94, temperature: 36.9, respiratoryRate: 18, oxygenSaturation: 94 }, recentLabs: [], medications: [], nursingTaskIds: [], aiSummary: [], admissionDate: new Date().toISOString(), assignedNurseId: '', roomNumber: '117B' },
  { id: 'p18', medicalRecordNo: 'MRN018', name: '홍성표', age: 77, gender: 'M', diagnosis: ['COPD'], severity: 'High',           vitalSigns: { bloodPressure: '138/84', heartRate: 88, temperature: 36.8, respiratoryRate: 22, oxygenSaturation: 89 }, recentLabs: [], medications: [], nursingTaskIds: [], aiSummary: [], admissionDate: new Date().toISOString(), assignedNurseId: '', roomNumber: '118C' },
  { id: 'p19', medicalRecordNo: 'MRN019', name: '유하늘', age: 2,  gender: 'F', diagnosis: ['영아 발열'], severity: 'Medium',       vitalSigns: { bloodPressure: '88/50', heartRate: 130, temperature: 38.5, respiratoryRate: 30, oxygenSaturation: 97 }, recentLabs: [], medications: [], nursingTaskIds: [], aiSummary: [], admissionDate: new Date().toISOString(), assignedNurseId: '', roomNumber: '119A' },
  { id: 'p20', medicalRecordNo: 'MRN020', name: '문혜진', age: 19, gender: 'F', diagnosis: ['식중독'], severity: 'Low',         vitalSigns: { bloodPressure: '110/68', heartRate: 85, temperature: 37.4, respiratoryRate: 16, oxygenSaturation: 98 }, recentLabs: [], medications: [], nursingTaskIds: [], aiSummary: [], admissionDate: new Date().toISOString(), assignedNurseId: '', roomNumber: '120B' },
  { id: 'p21', medicalRecordNo: 'MRN021', name: '신동엽', age: 41, gender: 'M', diagnosis: ['복부수술 후'], severity: 'Medium',      vitalSigns: { bloodPressure: '125/80', heartRate: 82, temperature: 36.7, respiratoryRate: 16, oxygenSaturation: 97 }, recentLabs: [], medications: [], nursingTaskIds: [], aiSummary: [], admissionDate: new Date().toISOString(), assignedNurseId: '', roomNumber: '121C' },
  { id: 'p22', medicalRecordNo: 'MRN022', name: '노지훈', age: 58, gender: 'M', diagnosis: ['관상동맥질환'], severity: 'High',      vitalSigns: { bloodPressure: '148/90', heartRate: 96, temperature: 36.8, respiratoryRate: 18, oxygenSaturation: 93 }, recentLabs: [], medications: [], nursingTaskIds: [], aiSummary: [], admissionDate: new Date().toISOString(), assignedNurseId: '', roomNumber: '122A' },
  { id: 'p23', medicalRecordNo: 'MRN023', name: '권소영', age: 33, gender: 'F', diagnosis: ['혈액검사 이상'], severity: 'Low',       vitalSigns: { bloodPressure: '115/72', heartRate: 78, temperature: 36.6, respiratoryRate: 16, oxygenSaturation: 99 }, recentLabs: [], medications: [], nursingTaskIds: [], aiSummary: [], admissionDate: new Date().toISOString(), assignedNurseId: '', roomNumber: '123B' },
  { id: 'p24', medicalRecordNo: 'MRN024', name: '이현주', age: 69, gender: 'F', diagnosis: ['퇴행성 관절염'], severity: 'Low',      vitalSigns: { bloodPressure: '132/82', heartRate: 78, temperature: 36.6, respiratoryRate: 16, oxygenSaturation: 96 }, recentLabs: [], medications: [], nursingTaskIds: [], aiSummary: [], admissionDate: new Date().toISOString(), assignedNurseId: '', roomNumber: '124C' },
]

// nursingTaskIds를 mockTasks 기반으로 자동 채움
;(function() { const hyd = hydratePatientsWithTaskIds(mockPatients); hyd.forEach((p, i) => { mockPatients[i].nursingTaskIds = p.nursingTaskIds }) })()

// 진단별 처방 약물 주입
mockPatients.forEach(p => { if (patientMedications[p.id]) p.medications = patientMedications[p.id] })

export const mockInventory: InventoryItem[] = [
  { itemId: 'i1', itemName: '주사기 10ml', category: 'Syringe', quantity: 120, reorderPoint: 30, unit: '개', status: 'sufficient', history: [] },
]

export const mockAttendances: Array<{ id: string; nurseId: string; action: 'checkout' | 'checkin'; timestamp: string; shiftType?: string }> = []

export default {}
