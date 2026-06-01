import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppSelector } from '../hooks/useAppSelector'
import { useToast } from '../hooks/useToast'
import { SeverityBadge } from '../components/common'
import { Toast } from '../components/common'
import AISummaryCard from '../components/patient/AISummaryCard'
import VitalSignsGrid from '../components/patient/VitalSignsGrid'
import LabResultsGrid from '../components/patient/LabResultsGrid'
import MedicationList from '../components/patient/MedicationList'
import TodoList from '../components/patient/TodoList'

const card: React.CSSProperties = {
  background: '#FFFFFF',
  borderRadius: '10px',
  boxShadow: '0 2px 12px rgba(44,110,138,.09)',
  padding: '20px',
  marginBottom: '14px',
}

const cardTitle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: '#6B8090',
  textTransform: 'uppercase',
  letterSpacing: '0.6px',
  marginBottom: '14px',
}

function getAdmissionDays(admissionDate: string): number {
  const diff = Math.floor((Date.now() - new Date(admissionDate).getTime()) / 86400000)
  return diff + 1
}

const PatientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toasts, removeToast, success } = useToast()

  const patient = useAppSelector(s => s.patients.allPatients.find(p => p.id === id))
  const tasks   = useAppSelector(s => s.tasks.allTasks.filter(t => t.patientId === id))

  if (!patient) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 58px)', gap: '16px' }}>
        <div style={{ fontSize: '48px' }}>🔍</div>
        <div style={{ fontSize: '16px', color: '#6B8090' }}>환자를 찾을 수 없습니다.</div>
        <button
          onClick={() => navigate('/dashboard')}
          style={{ padding: '10px 20px', background: '#2C6E8A', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}
        >
          ← 대시보드로
        </button>
      </div>
    )
  }

  const completed = tasks.filter(t => t.status === 'Completed').length
  const allDone   = tasks.length > 0 && completed === tasks.length
  const days      = getAdmissionDays(patient.admissionDate)

  const handleSave = () => {
    success('💾 인수인계 기록이 저장되었습니다.')
  }

  return (
    <div style={{ padding: '22px 24px 60px' }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 10px', border: 'none', background: 'none',
              color: '#2C6E8A', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
              borderRadius: '7px',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#EBF4F8')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            ← 목록
          </button>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#1A2B38' }}>
            {patient.name} · 병실 {patient.roomNumber}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SeverityBadge severity={patient.severity} size="md" />
          {allDone && (
            <span style={{ padding: '4px 12px', background: '#E8F5EE', color: '#2E7D5E', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
              ✓ 완료
            </span>
          )}
        </div>
      </div>

      {/* AI 요약 */}
      <AISummaryCard summary={patient.aiSummary} />

      {/* 환자 정보 + 활력징후 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
        <div style={card}>
          <div style={cardTitle}>👤 환자 정보</div>
          <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '3px' }}>{patient.name}</div>
          <div style={{ fontSize: '13px', color: '#6B8090', marginBottom: '10px' }}>
            {patient.age}세 · {patient.gender === 'M' ? '남' : '여'} · 입원 {days}일차
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {patient.diagnosis.map((d, i) => (
              <span key={i} style={{ padding: '3px 9px', background: '#F0F4F7', borderRadius: '6px', fontSize: '12px', border: '1px solid #DDE3E8' }}>
                {d}
              </span>
            ))}
          </div>
        </div>
        <div style={card}>
          <div style={cardTitle}>💓 활력징후</div>
          <VitalSignsGrid vitalSigns={patient.vitalSigns} />
        </div>
      </div>

      {/* 검사 결과 + 약물 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
        <div style={card}>
          <div style={cardTitle}>🧪 최근 검사 결과</div>
          <LabResultsGrid labs={patient.recentLabs} />
        </div>
        <div style={card}>
          <div style={cardTitle}>💊 현재 처방 약물</div>
          <MedicationList medications={patient.medications} />
        </div>
      </div>

      {/* Todo */}
      <div style={{ ...card, marginBottom: '16px' }}>
        <div style={cardTitle}>📋 오늘의 간호 업무</div>
        <TodoList tasks={tasks} />
      </div>

      {/* 액션 바 */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            padding: '11px 22px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
            border: '1.5px solid #DDE3E8', background: '#FFFFFF', color: '#1A2B38', cursor: 'pointer',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#2C6E8A'; e.currentTarget.style.color = '#2C6E8A' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#DDE3E8'; e.currentTarget.style.color = '#1A2B38' }}
        >
          ← 목록으로
        </button>
        <button
          onClick={handleSave}
          style={{
            flex: 1, padding: '11px 22px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
            border: 'none', background: '#2C6E8A', color: '#fff', cursor: 'pointer',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#1E5470')}
          onMouseLeave={e => (e.currentTarget.style.background = '#2C6E8A')}
        >
          💾 저장 및 인수인계 기록
        </button>
      </div>

      {/* Toast */}
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  )
}

export default PatientDetailPage
