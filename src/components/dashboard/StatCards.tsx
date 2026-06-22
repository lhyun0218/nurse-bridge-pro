import React from 'react'
import type { Patient, NursingTask } from '../../types'

interface StatCardsProps {
  patients: Patient[]
  allTasks: NursingTask[]
}

const StatCards: React.FC<StatCardsProps> = ({ patients, allTasks }) => {
  const highCount   = patients.filter(p => p.severity === 'High').length
  const mediumCount = patients.filter(p => p.severity === 'Medium').length
  const lowCount    = patients.filter(p => p.severity === 'Low').length

  const myTaskIds = patients.flatMap(p => p.nursingTaskIds)
  const myTasks   = allTasks.filter(t => myTaskIds.includes(t.taskId))
  const completed = myTasks.filter(t => t.status === 'Completed').length
  const total     = myTasks.length
  const rate      = total === 0 ? 0 : Math.round((completed / total) * 100)

  const cardBase: React.CSSProperties = {
    background: 'var(--color-surface)',
    borderRadius: '10px',
    boxShadow: '0 2px 12px rgba(44,110,138,.09)',
    padding: '16px 18px',
    borderTop: '3px solid var(--color-border)',
    transition: 'background-color 0.3s ease',
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        marginBottom: '22px',
      }}
      className="stat-row"
    >
      {/* High */}
      <div style={{ ...cardBase, borderTopColor: '#C0392B' }}>
        <div style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: 500, marginBottom: '6px' }}>
          위험 환자 (High)
        </div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#C0392B' }}>
          {highCount}명
        </div>
        <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginTop: '3px' }}>
          즉시 확인 필요
        </div>
      </div>

      {/* Medium */}
      <div style={{ ...cardBase, borderTopColor: '#D4860A' }}>
        <div style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: 500, marginBottom: '6px' }}>
          주의 환자 (Medium)
        </div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#D4860A' }}>
          {mediumCount}명
        </div>
        <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginTop: '3px' }}>
          모니터링 중
        </div>
      </div>

      {/* Low */}
      <div style={{ ...cardBase, borderTopColor: '#2E7D5E' }}>
        <div style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: 500, marginBottom: '6px' }}>
          안정 환자 (Low)
        </div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#2E7D5E' }}>
          {lowCount}명
        </div>
        <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginTop: '3px' }}>
          정상 범위
        </div>
      </div>

      {/* Todo 완료율 */}
      <div style={{ ...cardBase, borderTopColor: '#2C6E8A' }}>
        <div style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: 500, marginBottom: '6px' }}>
          오늘 Todo 완료율
        </div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-primary)' }}>
          {rate}%
        </div>
        <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginTop: '3px' }}>
          {completed} / {total} 완료
        </div>
      </div>
    </div>
  )
}

export default StatCards
