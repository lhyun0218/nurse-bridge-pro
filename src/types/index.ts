// ── 역할 ──────────────────────────────────────
export type UserRole = 'Nurse' | 'HeadNurse' | 'Admin'
export type ShiftType = 'Day' | 'Evening' | 'Night'
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
}

// ── 환자 ──────────────────────────────────────
export interface VitalSigns {
  bloodPressure: string
  heartRate: number
  temperature: number
  respiratoryRate: number
  oxygenSaturation: number
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

export interface Patient {
  id: string
  medicalRecordNo: string
  name: string
  age: number
  gender: 'M' | 'F'
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
export interface ShiftReport {
  reportId: string
  shiftDate: string
  shiftType: ShiftType
  nurseId: string
  completedTaskIds: string[]
  handoffSummary: string
  notes: string
}

// ── Auth 상태 ─────────────────────────────────
export interface AuthState {
  isAuthenticated: boolean
  currentUser: Nurse | null
  userRole: UserRole | null
}
