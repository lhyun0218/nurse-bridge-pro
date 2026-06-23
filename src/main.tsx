import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store'
import { setPatients } from './store/slices/patientsSlice'
import { setTasks } from './store/slices/tasksSlice'
import { setNurses } from './store/slices/nursesSlice'
import { setAssignments } from './store/slices/assignmentsSlice'
import { setPrescriptions } from './store/slices/prescriptionsSlice'
import generateAssignmentsForMonth from './store/thunks/assignmentsThunks'
import './index.css'
import App from './App.tsx'

async function enableMocking() {
  // DEV + PROD 모두 MSW 사용 (실제 백엔드 없는 SPA 배포 환경)
  try { localStorage.removeItem('mock:attendances:v1') } catch (e) {}
  const { worker } = await import('./mocks/browser')

  // worker.start()는 SW가 activated되고 MOCK_ACTIVATE 메시지가 왕복할 때까지 기다림
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: {
      url: '/mockServiceWorker.js',
    },
  })
}

// 앱 시작 시 MSW API 호출로 Redux Store 초기화
async function initializeStore() {
  try {
    const [patientsRes, tasksRes, nursesRes] = await Promise.all([
      fetch('/api/patients'),
      fetch('/api/tasks'),
      fetch('/api/nurses'),
    ])
    const [patients, tasks, nurses] = await Promise.all([
      patientsRes.json(),
      tasksRes.json(),
      nursesRes.json(),
    ])
    store.dispatch(setPatients(patients))
    store.dispatch(setTasks(tasks))
    store.dispatch(setNurses(nurses))
    // 처방 데이터 로드
    try {
      const rxRes = await fetch('/api/prescriptions')
      if (rxRes.ok) store.dispatch(setPrescriptions(await rxRes.json()))
    } catch (e) { console.warn('prescriptions load failed', e) }
    try {
      const aRes = await fetch('/api/assignments')
      if (aRes.ok) {
        const a = await aRes.json()
        // store under today's date key
        const d = new Date()
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        store.dispatch(setAssignments({ date: key, assignments: a }))
      }
    } catch (e) {
      console.warn('assignments load failed', e)
    }
  } catch (err) {
    console.error('초기 데이터 로드 실패:', err)
  }
    // if there's a saved schedule for this month, pre-generate assignments for the month
    try {
      const now = new Date()
      const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const savedSchedules = (store.getState() as any).schedule.saved
      if (savedSchedules && savedSchedules[key]) {
        store.dispatch(generateAssignmentsForMonth(now.getFullYear(), now.getMonth() + 1, 1) as any)
      }
    } catch (e) {
      console.warn('monthly assignment generation failed', e)
    }
}

enableMocking()
  .then(() => initializeStore())
  .then(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <Provider store={store}>
          <App />
        </Provider>
      </StrictMode>,
    )
  })
