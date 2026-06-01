import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store'
import { setPatients } from './store/slices/patientsSlice'
import { setTasks } from './store/slices/tasksSlice'
import { setInventory } from './store/slices/inventorySlice'
import { setNurses } from './store/slices/nursesSlice'
import './index.css'
import App from './App.tsx'

async function enableMocking() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser')
    return worker.start({ onUnhandledRequest: 'bypass' })
  }
}

// 앱 시작 시 MSW API 호출로 Redux Store 초기화
async function initializeStore() {
  try {
    const [patientsRes, tasksRes, inventoryRes, nursesRes] = await Promise.all([
      fetch('/api/patients'),
      fetch('/api/tasks'),
      fetch('/api/inventory'),
      fetch('/api/nurses'),
    ])
    const [patients, tasks, inventory, nurses] = await Promise.all([
      patientsRes.json(),
      tasksRes.json(),
      inventoryRes.json(),
      nursesRes.json(),
    ])
    store.dispatch(setPatients(patients))
    store.dispatch(setTasks(tasks))
    store.dispatch(setInventory(inventory))
    store.dispatch(setNurses(nurses))
  } catch (err) {
    console.error('초기 데이터 로드 실패:', err)
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
