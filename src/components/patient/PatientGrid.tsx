import React, { useState, useEffect, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Patient, NursingTask, Severity } from '../../types'
import PatientCard from './PatientCard'

interface PatientGridProps {
  patients: Patient[]
  getPatientTasks: (patientId: string) => NursingTask[]
}

type FilterType = 'All' | Severity

const severityButtons: { label: string; value: FilterType }[] = [
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

/** 모든 환자의 진단명 목록에서 중복 없이 추출 */
function extractDiagnoses(patients: Patient[]): string[] {
  const set = new Set<string>()
  patients.forEach(p => p.diagnosis.forEach(d => set.add(d)))
  return Array.from(set).sort()
}

const PatientGrid: React.FC<PatientGridProps> = ({ patients, getPatientTasks }) => {
  const [severityFilter, setSeverityFilter] = useState<FilterType>('All')
  const [diagnosisFilter, setDiagnosisFilter] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [columns, setColumns] = useState(() => getColumns(window.innerWidth))

  useEffect(() => {
    const handleResize = () => setColumns(getColumns(window.innerWidth))
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 진단명 드롭다운 옵션 (환자 목록에서 동적 추출)
  const diagnosisOptions = useMemo(() => extractDiagnoses(patients), [patients])

  // 복합 필터 적용: 검색어 + 중증도 + 진단명
  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return patients.filter(p => {
      // 중증도 필터
      if (severityFilter !== 'All' && p.severity !== severityFilter) return false
      // 진단명 필터
      if (diagnosisFilter !== 'All' && !p.diagnosis.includes(diagnosisFilter)) return false
      // 검색어 필터 (이름, 병실번호, 진단명)
      if (query) {
        const nameMatch      = p.name.toLowerCase().includes(query)
        const roomMatch      = p.roomNumber.toLowerCase().includes(query)
        const diagnosisMatch = p.diagnosis.some(d => d.toLowerCase().includes(query))
        if (!nameMatch && !roomMatch && !diagnosisMatch) return false
      }
      return true
    })
  }, [patients, severityFilter, diagnosisFilter, searchQuery])

  const hasActiveFilter = severityFilter !== 'All' || diagnosisFilter !== 'All' || searchQuery.trim() !== ''

  const handleClearFilters = () => {
    setSeverityFilter('All')
    setDiagnosisFilter('All')
    setSearchQuery('')
  }

  return (
    <div>
      {/* 섹션 헤더 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>
          담당 환자 ({patients.length}명)
          {hasActiveFilter && (
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#2C6E8A', marginLeft: '6px' }}>
              → {filtered.length}명 표시 중
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {severityButtons.map(btn => (
            <button
              key={btn.value}
              onClick={() => setSeverityFilter(btn.value)}
              style={{
                padding: '5px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 500,
                border: severityFilter === btn.value ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                background: severityFilter === btn.value ? 'rgba(44,110,138,0.12)' : 'var(--color-surface)',
                color: severityFilter === btn.value ? 'var(--color-primary)' : 'var(--color-muted)',
                cursor: 'pointer',
                transition: 'all .15s',
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* 검색 + 진단명 필터 행 */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '16px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {/* 실시간 검색창 */}
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: '180px' }}>
          <span
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '14px',
              color: 'var(--color-muted)',
              pointerEvents: 'none',
            }}
          >
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="이름, 병실번호, 진단명 검색..."
            style={{
              width: '100%',
              padding: '8px 32px 8px 32px',
              borderRadius: '8px',
              border: searchQuery ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)',
              background: 'var(--color-surface)',
              fontSize: '13px',
              color: 'var(--color-text)',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color .15s',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-primary)' }}
            onBlur={e => { if (!searchQuery) e.currentTarget.style.borderColor = 'var(--color-border)' }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                color: 'var(--color-muted)',
                padding: '2px',
                lineHeight: 1,
              }}
              title="검색어 지우기"
            >
              ✕
            </button>
          )}
        </div>

        {/* 진단명 드롭다운 */}
        <select
          value={diagnosisFilter}
          onChange={e => setDiagnosisFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: diagnosisFilter !== 'All' ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)',
            background: diagnosisFilter !== 'All' ? 'rgba(44,110,138,0.12)' : 'var(--color-surface)',
            fontSize: '13px',
            color: diagnosisFilter !== 'All' ? 'var(--color-primary)' : 'var(--color-muted)',
            cursor: 'pointer',
            outline: 'none',
            minWidth: '140px',
            flex: '0 0 auto',
          }}
        >
          <option value="All">진단명 전체</option>
          {diagnosisOptions.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        {/* 필터 초기화 버튼 */}
        {hasActiveFilter && (
          <button
            onClick={handleClearFilters}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1.5px solid var(--color-border)',
              background: 'var(--color-bg)',
              fontSize: '12px',
              color: 'var(--color-muted)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flex: '0 0 auto',
              transition: 'all .15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#C0392B'
              e.currentTarget.style.color = '#C0392B'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--color-border)'
              e.currentTarget.style.color = 'var(--color-muted)'
            }}
          >
            ✕ 필터 초기화
          </button>
        )}
      </div>

      {/* 그리드 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: '14px',
          marginBottom: '30px',
        }}
      >
        <AnimatePresence mode="popLayout">
          {filtered.map(patient => (
            <motion.div
              key={patient.id}
              layout
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{ height: '100%' }}
            >
              <PatientCard
                patient={patient}
                tasks={getPatientTasks(patient.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* 빈 상태 UI */}
        {filtered.length === 0 && (
          <motion.div
            key="empty-state"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              gridColumn: `1 / -1`,
              textAlign: 'center',
              padding: '52px 24px',
              background: 'var(--color-surface)',
              borderRadius: '12px',
              border: '1.5px dashed var(--color-border)',
            }}
          >
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔍</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '6px' }}>
              검색 결과가 없습니다
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-muted)', marginBottom: '16px' }}>
              {searchQuery
                ? `"${searchQuery}"에 해당하는 환자를 찾을 수 없습니다.`
                : '선택한 필터 조건에 맞는 환자가 없습니다.'}
            </div>
            <button
              onClick={handleClearFilters}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                border: '1.5px solid #2C6E8A',
                background: '#EBF4F8',
                color: '#2C6E8A',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              필터 초기화
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default PatientGrid
