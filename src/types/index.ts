// ── 역할 ──────────────────────────────────────
export type UserRole = 'Nurse' | 'HeadNurse' | 'Admin'
export type ShiftType = 'Day' | 'Evening' | 'Night'
export type ShiftCode = 'D' | 'E' | 'N' | 'OFF'

export interface NurseScheduleRow {
  nurseId: string
  nurseName: string
  shifts: ShiftCode[]
  stats: {
    dayCount: number
    eveningCount: number
    nightCount: number
    offCount: number
    weekendWork: number
    overtimeRisk: boolean
  }
}

export type Severity = 'High' | 'Medium' | 'Low'
export type TaskStatus = 'Pending' | 'Completed'
export type TaskCategory = 'Monitoring' | 'Medication' | 'Hygiene' | 'Documentation'
export type InventoryStatus = 'sufficient' | 'warning' | 'critical'

// ── 간호사 ────────────────────────────────────
export interface Nurse {
  id: string
  name: string
  employeeId: string
  role: UserRole
  shiftType: ShiftType
  assignedPatients: string[]
  status: 'Active' | 'OnBreak' | 'ShiftEnd'
  overtimeHours: number
  workStart: string
  workEnd: string
  gender?: 'M' | 'F'
  yearsOfExperience?: number
  note?: string
}

// ── 환자 ──────────────────────────────────────
export interface VitalSigns {
  bloodPressure: string
  heartRate: number
  temperature: number
  respiratoryRate: number
  oxygenSaturation: number
  /** 마지막 업데이트 타임스탬프 (Unix ms) */
  lastUpdated?: number
  bloodGlucose?: number
  painScore?: number
  gcs?: number
}

export interface LabResult {
  name: string
  value: number | string
  unit: string
  isAbnormal?: boolean
  isBorderline?: boolean
}

export interface Medication {
  name: string
  dosage: string
  frequency: string
  route: 'IV' | 'PO' | 'SC' | 'IM' | 'O2' | 'NEB' | 'Other'
}

// ── 의사 처방 ─────────────────────────────────
export type PrescriptionStatus = 'active' | 'discontinued' | 'completed' | 'pending'

export interface Prescription {
  id: string
  patientId: string
  patientName: string
  roomNumber: string
  doctorName: string        // 처방 의사
  orderedAt: number         // 처방 시각 (Unix ms)
  medication: Medication
  indication: string        // 처방 사유 (예: "폐렴 치료")
  duration?: string         // 투약 기간 (예: "7일", "PRN")
  startDate: string         // 투약 시작일 (YYYY-MM-DD)
  endDate?: string          // 투약 종료일
  status: PrescriptionStatus
  nurseNote?: string        // 간호사 메모
  verified: boolean         // 간호사 확인 여부
}

export interface Patient {
  id: string
  medicalRecordNo: string
  name: string
  age: number
  gender: 'M' | 'F'
  bloodType?: 'A' | 'B' | 'AB' | 'O' | 'Unknown'
  diagnosis: string[]
  severity: Severity
  vitalSigns: VitalSigns
  recentLabs: LabResult[]
  medications: Medication[]
  nursingTaskIds: string[]
  aiSummary: string[]
  admissionDate: string
  assignedNurseId: string
  roomNumber: string
  // 추가 임상 정보
  allergies?: string[]
  height?: number            // cm
  weight?: number            // kg
  isolation?: string         // 격리 유형 (예: '접촉격리', '호흡격리')
  fallRisk?: 'Low' | 'Medium' | 'High'
  pressureUlcerRisk?: 'Low' | 'Medium' | 'High'
  diet?: string              // 식이 처방 (예: '당뇨식', '연식')
  mobility?: 'Ambulatory' | 'Assisted' | 'Bedridden'
  ivAccess?: string          // 정맥로 (예: '우측 전완 22G PIV')
  oxygenTherapy?: string     // 산소 투여 (예: 'NC 2L/min')
  foley?: boolean            // 유도관 여부
  ngt?: boolean              // L-tube 여부
  codeStatus?: 'Full' | 'DNR' | 'DNI'
  guardian?: {
    name: string
    relation: string
    contact: string
  }
  attendingPhysician?: string
  specialNotes?: string[]
}

// ── 간호 업무 ─────────────────────────────────
export interface NursingTask {
  taskId: string
  patientId: string
  taskName: string
  description: string
  status: TaskStatus
  estimatedMinutes: number
  dueTime: string
  assignedTo: string
  category: TaskCategory
  notes?: string
}

// ── 재고 ──────────────────────────────────────
export interface InventoryHistory {
  action: 'consume' | 'restock' | 'request'
  amount: number
  timestamp: string
  nurseId?: string
}

export interface InventoryItem {
  itemId: string
  itemName: string
  category: 'Syringe' | 'Gauze' | 'IV' | 'Linen' | 'Glove' | 'Other'
  quantity: number
  reorderPoint: number
  unit: string
  status: InventoryStatus
  history: InventoryHistory[]
}

// ── 근무 보고 ─────────────────────────────────
export interface ShiftReportPatientSnapshot {
  patientId: string
  patientName: string
  roomNumber: string
  severity: Severity
  diagnosis: string[]
  completedTaskCount: number
  pendingTaskCount: number
  pendingTaskNames: string[]
  nursingNotesSummary: string[]   // 최근 간호 노트 내용 (최대 3개)
  vitalSigns?: {
    bloodPressure?: string
    heartRate?: number
    temperature?: number
    oxygenSaturation?: number
  }
}

export interface ShiftReport {
  reportId: string
  shiftDate: string
  shiftType: ShiftType
  nurseId: string
  nurseName?: string          // 보고서 작성 간호사 이름 (조회 편의)
  completedTaskIds: string[]
  handoffSummary: string
  notes: string
  writerSignature?: string
  receiverSignature?: string
  patientSnapshots?: ShiftReportPatientSnapshot[]  // 담당 환자 상태 스냅샷
}

// ── 간호 노트 ─────────────────────────────────
export type NoteCategory = 'general' | 'observation' | 'medication' | 'procedure' | 'education'

export interface NursingNote {
  id: string
  patientId: string
  nurseId: string
  nurseName: string
  category: NoteCategory
  content: string
  timestamp: number   // Unix ms
  isPinned?: boolean
}

// ── Auth 상태 ─────────────────────────────────
export interface AuthState {
  isAuthenticated: boolean
  currentUser: Nurse | null
  userRole: UserRole | null
}
