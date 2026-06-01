import React, { useState, useEffect } from 'react'
import type { Patient, NursingTask, Severity } from '../../types'
import PatientCard from './PatientCard'

interface PatientGridProps {
  patients: Patient[]
  getPatientTasks: (patientId: string) => NursingTask[]
}

type FilterType = 'All' | Severity

const filterButtons: { label: string; value: FilterType }[] = [
  { label: '전체',       value: 'All' },
  { label: '🔴 High',   value: 'High' },
  { label: '🟡 Medium', value: 'Medium' },
  { label: '🟢 Low',    value: 'Low' },
]

function getColumns(width: number): number {
  if (width >= 1024) return 4
  if (width >= 769)  return 2
  return 1
}

const PatientGrid: React.FC<PatientGridProps> = ({ patients, getPatientTasks }) => {
  const [filter, setFilter] = useState<FilterType>('All')
  const [columns, setColumns] = useState(() => getColumns(window.innerWidth))

  useEffect(() => {
    const handleResize = () => setColumns(getColumns(window.innerWidth))
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const filtered = filter === 'All'
    ? patients
    : patients.filter(p => p.severity === filter)

  return (
    <div>
      {/* 섹션 헤더 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px',
        }}
      >
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#1A2B38' }}>
          담당 환자 ({patients.length}명)
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {filterButtons.map(btn => (
            <button
              key={btn.value}
              onClick={() => setFilter(btn.value)}
              style={{
                padding: '5px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 500,
                border: filter === btn.value ? '1.5px solid #2C6E8A' : '1.5px solid #DDE3E8',
                background: filter === btn.value ? '#EBF4F8' : '#FFFFFF',
                color: filter === btn.value ? '#2C6E8A' : '#6B8090',
                cursor: 'pointer',
                transition: 'all .15s',
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* 그리드 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: '14px',
          marginBottom: '30px',
          alignItems: 'start',
        }}
      >
        {filtered.map(patient => (
          <PatientCard
            key={patient.id}
            patient={patient}
            tasks={getPatientTasks(patient.id)}
          />
        ))}
        {filtered.length === 0 && (
          <div
            style={{
              gridColumn: `1 / -1`,
              textAlign: 'center',
              padding: '40px',
              color: '#6B8090',
              fontSize: '14px',
            }}
          >
            해당 중증도의 환자가 없습니다.
          </div>
        )}
      </div>
    </div>
  )
}

export default PatientGrid
