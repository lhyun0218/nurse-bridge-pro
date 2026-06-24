import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import patientsReducer from './slices/patientsSlice'
import tasksReducer from './slices/tasksSlice'
import { setTasks } from './slices/tasksSlice'
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

const PERSIST_KEY = 'nb:persist:v1'
export { PERSIST_KEY }

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
    getDefaultMiddleware(),
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

  // 보고서는 실제 저장 시에만 추가됩니다. 하드코딩된 초기 데이터 없음.
} catch (e) {
  console.error('hydration failed', e)
}

// verbatimModuleSyntax 환경에서 타입 명시적 export
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
