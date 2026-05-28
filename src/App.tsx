import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from './store'

// Pages (placeholder — 이후 구현)
const LoginPage    = () => <div className="flex items-center justify-center min-h-screen bg-[#F0F4F7]"><p className="text-[#2C6E8A] font-bold text-xl">🏥 Nurse-Bridge PRO — 로그인 페이지 (구현 예정)</p></div>
const DashboardPage = () => <div className="flex items-center justify-center min-h-screen bg-[#F0F4F7]"><p className="text-[#2C6E8A] font-bold text-xl">📋 메인 대시보드 (구현 예정)</p></div>
const HeadNursePage = () => <div className="flex items-center justify-center min-h-screen bg-[#F0F4F7]"><p className="text-[#2C6E8A] font-bold text-xl">👔 수간호사 관제 (구현 예정)</p></div>

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/head-nurse" element={<ProtectedRoute><HeadNursePage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
