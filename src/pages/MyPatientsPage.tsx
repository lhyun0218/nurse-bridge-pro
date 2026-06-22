import React from 'react'
import { useAppSelector } from '../hooks/useAppSelector'
import { useMyPatients } from '../hooks/useMyPatients'
import PatientGrid from '../components/patient/PatientGrid'

const MyPatientsPage: React.FC = () => {
  const { myPatients, getPatientTasks } = useMyPatients()
  const allTasks = useAppSelector(s => s.tasks.allTasks)
  const allPatients = useAppSelector(s => s.patients.allPatients)
  // patients가 아직 로드되지 않은 경우만 로딩 표시
  const loading  = allPatients.length === 0

  // 요약 통계
  const highCount   = myPatients.filter(p => p.severity === 'High').length
  const medCount    = myPatients.filter(p => p.severity === 'Medium').length
  const lowCount    = myPatients.filter(p => p.severity === 'Low').length

  const myTasksAll   = allTasks.filter(t => myPatients.some(p => p.id === t.patientId))
  const doneCount    = myTasksAll.filter(t => t.status === 'Completed').length
  const totalTasks   = myTasksAll.length
  const overallRate  = totalTasks === 0 ? 0 : Math.round((doneCount / totalTasks) * 100)

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: 'calc(100vh - 58px)', background: 'var(--color-bg)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px', height: '40px',
            border: '3px solid #DDE3E8', borderTop: '3px solid #2C6E8A',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite',
            margin: '0 auto 12px',
          }} />
          <p style={{ color: '#6B8090', fontSize: '14px' }}>환자 목록 로딩 중...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ padding: '22px 24px 40px' }}>
      {/* 페이지 헤더 */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{
          fontSize: '20px', fontWeight: 700,
          color: 'var(--color-text)', marginBottom: '4px',
        }}>
          내 담당 환자
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
          현재 {myPatients.length}명의 환자를 담당하고 있습니다
        </p>
      </div>

      {/* 요약 카드 행 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px',
        marginBottom: '24px',
      }}>
        {/* 전체 */}
        <div style={summaryCardStyle('#EBF4F8', '#2C6E8A')}>
          <span style={{ fontSize: '22px', fontWeight: 800, color: '#2C6E8A' }}>{myPatients.length}</span>
          <span style={{ fontSize: '12px', color: '#2C6E8A', marginTop: '2px' }}>전체 담당</span>
        </div>
        {/* High */}
        <div style={summaryCardStyle('#FDECEA', '#C0392B')}>
          <span style={{ fontSize: '22px', fontWeight: 800, color: '#C0392B' }}>{highCount}</span>
          <span style={{ fontSize: '12px', color: '#C0392B', marginTop: '2px' }}>🔴 High</span>
        </div>
        {/* Medium */}
        <div style={summaryCardStyle('#FEF3E2', '#D4860A')}>
          <span style={{ fontSize: '22px', fontWeight: 800, color: '#D4860A' }}>{medCount}</span>
          <span style={{ fontSize: '12px', color: '#D4860A', marginTop: '2px' }}>🟡 Medium</span>
        </div>
        {/* Low */}
        <div style={summaryCardStyle('#E8F5EE', '#2E7D5E')}>
          <span style={{ fontSize: '22px', fontWeight: 800, color: '#2E7D5E' }}>{lowCount}</span>
          <span style={{ fontSize: '12px', color: '#2E7D5E', marginTop: '2px' }}>🟢 Low</span>
        </div>
        {/* Todo 완료율 */}
        <div style={summaryCardStyle('#F0F4F7', '#6B8090')}>
          <span style={{ fontSize: '22px', fontWeight: 800, color: '#1A2B38' }}>{overallRate}%</span>
          <span style={{ fontSize: '12px', color: '#6B8090', marginTop: '2px' }}>
            Todo 완료 ({doneCount}/{totalTasks})
          </span>
        </div>
      </div>

      {/* 환자 그리드 */}
      <PatientGrid
        patients={myPatients}
        getPatientTasks={getPatientTasks}
      />
    </div>
  )
}

function summaryCardStyle(bg: string, border: string): React.CSSProperties {
  return {
    background: bg,
    border: `1.5px solid ${border}22`,
    borderRadius: '12px',
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
  }
}

export default MyPatientsPage
