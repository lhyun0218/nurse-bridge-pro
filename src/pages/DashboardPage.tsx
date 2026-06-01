import React, { useEffect, useState } from 'react'
import { useAppDispatch } from '../hooks/useAppDispatch'
import { useAppSelector } from '../hooks/useAppSelector'
import { useMyPatients } from '../hooks/useMyPatients'
import { setPatients } from '../store/slices/patientsSlice'
import { setTasks } from '../store/slices/tasksSlice'
import StatCards from '../components/dashboard/StatCards'
import AlertBanner from '../components/dashboard/AlertBanner'
import QuickMenu from '../components/dashboard/QuickMenu'
import PatientGrid from '../components/patient/PatientGrid'

const DashboardPage: React.FC = () => {
  const dispatch = useAppDispatch()
  const allTasks = useAppSelector(s => s.tasks.allTasks)
  const { myPatients, getPatientTasks, getCompletionRate } = useMyPatients()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsRes, tasksRes] = await Promise.all([
          fetch('/api/patients'),
          fetch('/api/tasks'),
        ])
        const patientsData = await patientsRes.json()
        const tasksData    = await tasksRes.json()
        dispatch(setPatients(patientsData))
        dispatch(setTasks(tasksData))
      } catch (err) {
        console.error('데이터 로드 실패:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [dispatch])

  // 모든 담당 환자 Todo 완료 여부
  const allTasksDone = myPatients.length > 0 && myPatients.every(p => getCompletionRate(p.id) === 100)

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 58px)',
          background: '#F0F4F7',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid #DDE3E8',
              borderTop: '3px solid #2C6E8A',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 12px',
            }}
          />
          <p style={{ color: '#6B8090', fontSize: '14px' }}>데이터 로딩 중...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div>
      {/* 알림 배너 */}
      <AlertBanner patients={myPatients} />

      {/* 메인 콘텐츠 */}
      <main style={{ padding: '22px 24px 40px' }}>
        {/* 통계 카드 */}
        <StatCards patients={myPatients} allTasks={allTasks} />

        {/* 퀵 메뉴 */}
        <QuickMenu allTasksDone={allTasksDone} />

        {/* 환자 그리드 */}
        <PatientGrid
          patients={myPatients}
          getPatientTasks={getPatientTasks}
        />
      </main>
    </div>
  )
}

export default DashboardPage
