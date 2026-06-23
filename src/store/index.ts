import { configureStore } from '@reduxjs/toolkit'
import type { Middleware } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import patientsReducer from './slices/patientsSlice'
import tasksReducer from './slices/tasksSlice'
import { setTasks } from './slices/tasksSlice'
import inventoryReducer, { autoConsumeForMedication } from './slices/inventorySlice'
import nursesReducer from './slices/nursesSlice'
import alertsReducer from './slices/alertsSlice'
import notificationsReducer from './slices/notificationsSlice'
import { setNotifications } from './slices/notificationsSlice'
import nursingNotesReducer from './slices/nursingNotesSlice'
import { setNotes } from './slices/nursingNotesSlice'
import shiftReportReducer from './slices/shiftReportSlice'
import { setReports } from './slices/shiftReportSlice'
import attendanceReducer from './slices/attendanceSlice'
import { setRecords } from './slices/attendanceSlice'
import scheduleReducer from './slices/scheduleSlice'
import assignmentsReducer from './slices/assignmentsSlice'
import coverageReducer from './slices/coverageSlice'
import prescriptionsReducer from './slices/prescriptionsSlice'
import type { NursingTask, Nurse, Patient } from '../types'

// ── 투약 완료 자동 재고 차감 미들웨어 ──────────────────────────────────────
const medicationAutoConsumeMiddleware: Middleware = storeAPI => next => action => {
  const result = next(action)

  if (
    action &&
    typeof action === 'object' &&
    'type' in action &&
    (action as { type: string }).type === 'tasks/toggleTask'
  ) {
    const taskId = (action as unknown as { payload: string }).payload
    const afterState = storeAPI.getState() as {
      tasks: { allTasks: NursingTask[] }
      patients: { allPatients: Patient[] }
      auth: { currentUser: Nurse | null }
    }
    const task = afterState.tasks.allTasks.find(t => t.taskId === taskId)

    // Pending → Completed 전환이고 Medication 카테고리인 경우만 차감
    if (task && task.status === 'Completed' && task.category === 'Medication') {
      const patient = afterState.patients.allPatients.find(p => p.id === task.patientId)
      const nurseId = afterState.auth.currentUser?.id ?? 'unknown'

      if (patient) {
        // 해당 태스크 이름에 매칭되는 약물 찾기
        const matchedMed = patient.medications.find(m =>
          task.taskName.includes(m.name) ||
          (m.name && task.description?.includes(m.name))
        ) ?? patient.medications[0]

        if (matchedMed) {
          storeAPI.dispatch(autoConsumeForMedication({
            taskId: task.taskId,
            patientId: patient.id,
            patientName: patient.name,
            medicationName: matchedMed.name,
            route: matchedMed.route as import('./slices/inventorySlice').MedicationRoute,
            nurseId,
          }))
        }
      }
    }
  }

  return result
}

const PERSIST_KEY = 'nb:persist:v1'

function loadPersistedState() {
  try {
    const raw = localStorage.getItem(PERSIST_KEY)
    if (!raw) return undefined
    return JSON.parse(raw)
  } catch (e) {
    console.error('Failed to load persisted state', e)
    return undefined
  }
}

export const store = configureStore({
  reducer: {
    auth: authReducer,
    patients: patientsReducer,
    tasks: tasksReducer,
    inventory: inventoryReducer,
    nurses: nursesReducer,
    alerts: alertsReducer,
    notifications: notificationsReducer,
    nursingNotes: nursingNotesReducer,
    shiftReports: shiftReportReducer,
    attendance: attendanceReducer,
    schedule: scheduleReducer,
    assignments: assignmentsReducer,
    coverage: coverageReducer,
    prescriptions: prescriptionsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(medicationAutoConsumeMiddleware),
})

// persist selected slices to localStorage
function savePersistedState() {
  try {
    const state = store.getState() as any
    const toPersist = {
      attendance: state.attendance,
      shiftReports: state.shiftReports,
      tasks: state.tasks,
      nursingNotes: state.nursingNotes,
      notifications: state.notifications,
      schedule: state.schedule,
    }
    localStorage.setItem(PERSIST_KEY, JSON.stringify(toPersist))
  } catch (e) {
    console.error('Failed to save persisted state', e)
  }
}

store.subscribe(() => {
  savePersistedState()
})

// hydrate store from persisted state (after store creation)
try {
  const p = loadPersistedState()
  if (p) {
    if (p.attendance && Array.isArray(p.attendance.records)) store.dispatch(setRecords(p.attendance.records))
    if (p.shiftReports && Array.isArray(p.shiftReports.reports)) store.dispatch(setReports(p.shiftReports.reports))
    if (p.tasks && Array.isArray(p.tasks.allTasks)) store.dispatch(setTasks(p.tasks.allTasks))
    if (p.nursingNotes && Array.isArray(p.nursingNotes.notes)) store.dispatch(setNotes(p.nursingNotes.notes))
    if (p.notifications && Array.isArray(p.notifications.items)) store.dispatch(setNotifications(p.notifications.items))
  }

  // localStorage에 저장된 보고서가 없을 때만 mock 초기 보고서 주입 (데모용)
  const existingReports = (store.getState() as any).shiftReports.reports as import('../types').ShiftReport[]
  if (existingReports.length === 0) {
    const todayDate = new Date().toISOString().slice(0, 10)
    const mockInitReports: import('../types').ShiftReport[] = [
      {
        reportId: 'SR-init-day-n1',
        shiftDate: new Date(`${todayDate}T17:30:00`).toISOString(),
        shiftType: 'Day',
        nurseId: 'n1',
        nurseName: '이현규',
        completedTaskIds: ['t1', 't2', 't3'],
        handoffSummary: '이미나 — 인슐린 투약 미완료, 다음 근무자 확인 요망',
        notes: `${todayDate} 17:30`,
        writerSignature: '이현규',
        patientSnapshots: [
          {
            patientId: 'p7',
            patientName: '이미나',
            roomNumber: '107A',
            severity: 'High',
            diagnosis: ['당뇨'],
            completedTaskCount: 2,
            pendingTaskCount: 1,
            pendingTaskNames: ['인슐린 투약 (저녁)'],
            nursingNotesSummary: ['혈당 320 mg/dL 측정. 주치의 보고 완료. 인슐린 투약 저녁 근무자 인계.', '환자 발 저림 호소, 신경과 협진 예정.'],
            vitalSigns: { bloodPressure: '148/92', heartRate: 94, temperature: 36.9, oxygenSaturation: 95 },
          },
          {
            patientId: 'p8',
            patientName: '오상민',
            roomNumber: '108B',
            severity: 'High',
            diagnosis: ['폐렴'],
            completedTaskCount: 3,
            pendingTaskCount: 0,
            pendingTaskNames: [],
            nursingNotesSummary: ['항생제 투여 완료. SpO₂ 90→93% 개선. 산소 2L 유지 중.'],
            vitalSigns: { bloodPressure: '148/90', heartRate: 97, temperature: 38.2, oxygenSaturation: 93 },
          },
        ],
      },
      {
        reportId: 'SR-init-day-n4',
        shiftDate: new Date(`${todayDate}T17:28:00`).toISOString(),
        shiftType: 'Day',
        nurseId: 'n4',
        nurseName: '오지현',
        completedTaskIds: ['t4', 't5'],
        handoffSummary: '모든 업무 완료',
        notes: `${todayDate} 17:28`,
        writerSignature: '오지현',
        patientSnapshots: [
          {
            patientId: 'p9',
            patientName: '조성민',
            roomNumber: '109C',
            severity: 'High',
            diagnosis: ['심부전'],
            completedTaskCount: 3,
            pendingTaskCount: 0,
            pendingTaskNames: [],
            nursingNotesSummary: ['이뇨제 반응 양호. 부종 경감 확인. 야간 체중 측정 요망.'],
            vitalSigns: { bloodPressure: '142/86', heartRate: 94, temperature: 36.7, oxygenSaturation: 93 },
          },
        ],
      },
    ]
    store.dispatch(setReports(mockInitReports))
  }
} catch (e) {
  console.error('hydration failed', e)
}

// verbatimModuleSyntax 환경에서 타입 명시적 export
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
