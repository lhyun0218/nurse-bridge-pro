import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAppSelector } from './hooks/useAppSelector'
import { AppLayout } from './components/layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import PatientDetailPage from './pages/PatientDetailPage'
import InventoryPage from './pages/InventoryPage'
import HeadNursePage from './pages/HeadNursePage'

// Placeholder 페이지들 (이후 구현)
const SchedulePage = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 58px)', background: '#F0F4F7' }}>
    <p style={{ color: '#2C6E8A', fontWeight: 700, fontSize: '18px' }}>🗓️ 근무 일정 (구현 예정)</p>
  </div>
)

// 페이지 제목 매핑
const PAGE_TITLES: Record<string, string> = {
  '/dashboard':  '대시보드',
  '/head-nurse': '병동 관제',
  '/inventory':  '물품 재고',
  '/schedule':   '근무 일정',
  '/patient':    '환자 상세',
}

function ProtectedRoute({ children, pageTitle }: { children: React.ReactNode; pageTitle: string }) {
  const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <AppLayout pageTitle={pageTitle}>{children}</AppLayout>
}

function HeadNurseRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated)
  const userRole        = useAppSelector(s => s.auth.userRole)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (userRole !== 'HeadNurse') return <Navigate to="/dashboard" replace />
  return <AppLayout pageTitle={PAGE_TITLES['/head-nurse']}>{children}</AppLayout>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<ProtectedRoute pageTitle={PAGE_TITLES['/dashboard']}><DashboardPage /></ProtectedRoute>} />
        <Route path="/patient/:id" element={<ProtectedRoute pageTitle={PAGE_TITLES['/patient']}><PatientDetailPage /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute pageTitle={PAGE_TITLES['/inventory']}><InventoryPage /></ProtectedRoute>} />
        <Route path="/schedule" element={<ProtectedRoute pageTitle={PAGE_TITLES['/schedule']}><SchedulePage /></ProtectedRoute>} />
        <Route path="/head-nurse" element={<HeadNurseRoute><HeadNursePage /></HeadNurseRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
