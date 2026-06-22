import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAppSelector } from './hooks/useAppSelector'
import { useTheme } from './hooks/useTheme'
import { AppLayout } from './components/layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import MyPatientsPage from './pages/MyPatientsPage'
import TodoPage from './pages/TodoPage'
import PatientDetailPage from './pages/PatientDetailPage'
import InventoryPage from './pages/InventoryPage'
import HeadNursePage from './pages/HeadNursePage'
import SchedulePage from './pages/SchedulePage'
import PatientFormPage from './pages/PatientFormPage'
import ScheduleGeneratorPage from './pages/ScheduleGeneratorPage'
import ColleaguesPage from './pages/ColleaguesPage'
import MedicationSchedulePage from './pages/MedicationSchedulePage'
import HandoverPage from './pages/HandoverPage'
import AttendancePage from './pages/AttendancePage'
import HeadNurseAttendancePage from './pages/HeadNurseAttendancePage'

// 페이지 제목 매핑
const PAGE_TITLES: Record<string, string> = {
  '/dashboard':               '대시보드',
  '/patients':                '내 담당 환자',
  '/todos':                   '오늘의 Todo',
  '/head-nurse':              '병동 관제',
  '/inventory':               '물품 재고',
  '/schedule':                '근무 일정',
  '/patient':                 '환자 상세',
  '/head-nurse/patients/new': '신규 환자 등록',
}

function ProtectedRoute({ children, pageTitle }: { children: React.ReactNode; pageTitle: string }) {
  const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <AppLayout pageTitle={pageTitle}>{children}</AppLayout>
}

function HeadNurseRoute({ children, pageTitle }: { children: React.ReactNode; pageTitle?: string }) {
  const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated)
  const userRole        = useAppSelector(s => s.auth.userRole)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (userRole !== 'HeadNurse') return <Navigate to="/dashboard" replace />
  return <AppLayout pageTitle={pageTitle ?? PAGE_TITLES['/head-nurse']}>{children}</AppLayout>
}

export default function App() {
  useTheme()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* 공통 라우트 */}
        <Route path="/dashboard" element={
          <ProtectedRoute pageTitle={PAGE_TITLES['/dashboard']}>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/patients" element={<ProtectedRoute pageTitle={PAGE_TITLES['/patients']}><MyPatientsPage /></ProtectedRoute>} />
        <Route path="/todos"    element={<ProtectedRoute pageTitle={PAGE_TITLES['/todos']}><TodoPage /></ProtectedRoute>} />

        <Route path="/patient/:id" element={<ProtectedRoute pageTitle={PAGE_TITLES['/patient']}><PatientDetailPage /></ProtectedRoute>} />
        <Route path="/inventory"   element={<ProtectedRoute pageTitle={PAGE_TITLES['/inventory']}><InventoryPage /></ProtectedRoute>} />
        <Route path="/schedule"    element={<ProtectedRoute pageTitle={PAGE_TITLES['/schedule']}><SchedulePage /></ProtectedRoute>} />
        <Route path="/colleagues"  element={<ProtectedRoute pageTitle="동료 현황"><ColleaguesPage /></ProtectedRoute>} />
        <Route path="/medication"  element={<ProtectedRoute pageTitle="투약 스케줄"><MedicationSchedulePage /></ProtectedRoute>} />
        <Route path="/handover"    element={<ProtectedRoute pageTitle="인수인계"><HandoverPage /></ProtectedRoute>} />
        <Route path="/attendance"  element={<ProtectedRoute pageTitle="출석"><AttendancePage /></ProtectedRoute>} />

        {/* 수간호사 전용 라우트 */}
        <Route path="/head-nurse"                    element={<HeadNurseRoute><HeadNursePage /></HeadNurseRoute>} />
        <Route path="/head-nurse/attendance"         element={<HeadNurseRoute pageTitle="출석 관리"><HeadNurseAttendancePage /></HeadNurseRoute>} />
        <Route path="/head-nurse/patients/new"       element={<HeadNurseRoute pageTitle={PAGE_TITLES['/head-nurse/patients/new']}><PatientFormPage /></HeadNurseRoute>} />
        <Route path="/head-nurse/patients/:id/edit"  element={<HeadNurseRoute pageTitle="환자 정보 수정"><PatientFormPage /></HeadNurseRoute>} />
        <Route path="/head-nurse/schedule/generate"  element={<HeadNurseRoute pageTitle="근무표 자동 생성"><ScheduleGeneratorPage /></HeadNurseRoute>} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
