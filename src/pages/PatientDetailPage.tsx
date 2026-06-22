import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppSelector } from '../hooks/useAppSelector'
import { useToast } from '../hooks/useToast'
import { useVitalMonitor } from '../hooks/useVitalMonitor'
import { useMedicationTimer } from '../hooks/useMedicationTimer'
import { SeverityBadge } from '../components/common'
import { Toast } from '../components/common'
import AISummaryCard from '../components/patient/AISummaryCard'
import VitalSignsGrid from '../components/patient/VitalSignsGrid'
import LabResultsGrid from '../components/patient/LabResultsGrid'
import MedicationList from '../components/patient/MedicationList'
import TodoList from '../components/patient/TodoList'
import NursingNotes from '../components/patient/NursingNotes'
import ShiftReportModal from '../components/report/ShiftReportModal'
import ManualVitalEntry from '../components/patient/ManualVitalEntry'

const card: React.CSSProperties = {
  background: 'var(--color-surface)',
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
  const [reportOpen, setReportOpen] = React.useState(false)

  const patient     = useAppSelector(s => s.patients.allPatients.find(p => p.id === id))
  const tasks       = useAppSelector(s => s.tasks.allTasks.filter(t => t.patientId === id))
  const currentUser = useAppSelector(s => s.auth.currentUser)
  const allPatients = useAppSelector(s => s.patients.allPatients)

  // 실시간 활력징후 모니터링 (중증 환자만 자동 수집)
  const shouldRealtime = patient ? patient.severity === 'High' : false
  useVitalMonitor(shouldRealtime && id ? [id] : [])
  // 투약 타이머 알림 (환자 상세 페이지에서도 활성)
  useMedicationTimer(id ? [id] : [])

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
    setReportOpen(true)
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
            {patient.vitalSigns?.lastUpdated && (
              <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--color-muted)' }}>
                · 최근 {new Date(patient.vitalSigns.lastUpdated).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {allDone && (
            <span style={{ padding: '4px 12px', background: '#E8F5EE', color: '#2E7D5E', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
              ✓ 모든 업무 완료
            </span>
          )}
        </div>
      </div>

      {/* AI 요약 */}
      <AISummaryCard summary={patient.aiSummary} />

      {/* 환자 정보 + 활력징후 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
        {/* 환자 기본 정보 */}
        <div style={card}>
          <div style={cardTitle}>👤 환자 기본 정보</div>

          {/* 이름 + 코드 상태 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text)' }}>{patient.name}</div>
            <SeverityBadge severity={patient.severity} size="md" />
            {patient.codeStatus === 'DNR' && (
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '5px', background: '#FDECEA', color: '#C0392B', border: '1px solid #C0392B' }}>DNR</span>
            )}
            {patient.codeStatus === 'DNI' && (
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '5px', background: '#FEF3E2', color: '#D4860A', border: '1px solid #D4860A' }}>DNI</span>
            )}
          </div>

          {/* 인적 정보 그리드 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', marginBottom: '12px' }}>
            {[
              { label: '나이', value: `${patient.age}세` },
              { label: '성별', value: patient.gender === 'M' ? '남성 (Male)' : '여성 (Female)' },
              { label: '혈액형', value: patient.bloodType ? `${patient.bloodType}형` : '미확인', highlight: true },
              { label: '등록번호', value: patient.medicalRecordNo },
              { label: '병실', value: `${patient.roomNumber}호` },
              { label: '입원일수', value: `${days}일차 (${new Date(patient.admissionDate).toLocaleDateString('ko-KR')})` },
              ...(patient.height ? [{ label: '신장', value: `${patient.height} cm` }] : []),
              ...(patient.weight ? [{ label: '체중', value: `${patient.weight} kg` }] : []),
              ...(patient.height && patient.weight ? [{
                label: 'BMI',
                value: `${(patient.weight / ((patient.height / 100) ** 2)).toFixed(1)}`,
              }] : []),
            ].map(item => (
              <div key={item.label}>
                <div style={{ fontSize: '10px', color: 'var(--color-muted)', marginBottom: '1px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{item.label}</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: (item as any).highlight ? '#3F51B5' : 'var(--color-text)' }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* 진단 */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: '10px', color: 'var(--color-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>진단명</div>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              {patient.diagnosis.map((d, i) => (
                <span key={i} style={{ padding: '3px 9px', background: 'var(--color-bg)', borderRadius: '6px', fontSize: '12px', border: '1px solid var(--color-border)', fontWeight: 500 }}>{d}</span>
              ))}
            </div>
          </div>

          {/* 알레르기 */}
          {patient.allergies && patient.allergies.length > 0 && (
            <div style={{ marginBottom: '10px', padding: '10px 12px', background: '#FDECEA', borderRadius: '8px', border: '1px solid #F5B7B1' }}>
              <div style={{ fontSize: '11px', color: '#C0392B', fontWeight: 700, marginBottom: '4px' }}>⚠️ 알레르기</div>
              {patient.allergies.map((a, i) => (
                <div key={i} style={{ fontSize: '12px', color: '#922B21', fontWeight: 500 }}>{a}</div>
              ))}
            </div>
          )}

          {/* 담당의 */}
          {patient.attendingPhysician && (
            <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
              <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>담당의:</span> {patient.attendingPhysician}
            </div>
          )}
        </div>

        {/* 우측: 활력징후 + 케어 정보 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={card}>
            <div style={cardTitle}>💓 활력징후</div>
              <VitalSignsGrid vitalSigns={patient.vitalSigns} isRealtime={patient.severity === 'High'} />
              {/* 비실시간 환자에 대해 수동 입력을 허용 */}
              {patient.severity !== 'High' && (
                <ManualVitalEntry patient={patient} />
              )}
          </div>

          {/* 케어 정보 */}
          <div style={card}>
            <div style={cardTitle}>🏥 케어 정보</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { label: '이동 능력', value: patient.mobility === 'Ambulatory' ? '독립 보행' : patient.mobility === 'Assisted' ? '부축 필요' : '침상 안정', icon: '🚶' },
                { label: '낙상 위험', value: patient.fallRisk ?? '미평가', icon: '⚠️', color: patient.fallRisk === 'High' ? '#C0392B' : patient.fallRisk === 'Medium' ? '#D4860A' : '#2E7D5E' },
                { label: '욕창 위험', value: patient.pressureUlcerRisk ?? '미평가', icon: '🩹', color: patient.pressureUlcerRisk === 'High' ? '#C0392B' : patient.pressureUlcerRisk === 'Medium' ? '#D4860A' : '#2E7D5E' },
                { label: '식이', value: patient.diet ?? '일반식', icon: '🍽️' },
                ...(patient.ivAccess ? [{ label: '정맥로', value: patient.ivAccess, icon: '💉' }] : []),
                ...(patient.oxygenTherapy ? [{ label: '산소 투여', value: patient.oxygenTherapy, icon: '🫁' }] : []),
                ...(patient.foley !== undefined ? [{ label: 'Foley 카테터', value: patient.foley ? '삽입 중' : '없음', icon: '🔵', color: patient.foley ? '#D4860A' : undefined }] : []),
              ].map(item => (
                <div key={item.label} style={{ padding: '8px 10px', borderRadius: '7px', background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-muted)', fontWeight: 600, marginBottom: '2px' }}>{item.icon} {item.label}</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: (item as any).color ?? 'var(--color-text)' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 보호자 + 특이사항 */}
      {(patient.guardian || (patient.specialNotes && patient.specialNotes.length > 0)) && (
        <div style={{ display: 'grid', gridTemplateColumns: patient.guardian && patient.specialNotes?.length ? '1fr 2fr' : '1fr', gap: '14px', marginBottom: '14px' }}>
          {patient.guardian && (
            <div style={card}>
              <div style={cardTitle}>👨‍👩‍👧 보호자 정보</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { label: '이름', value: patient.guardian.name },
                  { label: '관계', value: patient.guardian.relation },
                  { label: '연락처', value: patient.guardian.contact },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: 600, minWidth: '44px' }}>{item.label}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {patient.specialNotes && patient.specialNotes.length > 0 && (
            <div style={{ ...card, borderLeft: '4px solid #D4860A' }}>
              <div style={cardTitle}>📌 특이사항 / 주의사항</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {patient.specialNotes.map((note, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '13px', color: 'var(--color-text)', lineHeight: 1.5 }}>
                    <span style={{ color: '#D4860A', fontWeight: 700, flexShrink: 0 }}>!</span>
                    <span>{note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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

      {/* 간호 노트 */}
      <div style={{ marginBottom: '16px' }}>
        <NursingNotes patientId={patient.id} />
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

      {/* 인수인계 보고서 모달 */}
      {currentUser && patient && (
        <ShiftReportModal
          isOpen={reportOpen}
          onClose={() => setReportOpen(false)}
          nurse={currentUser}
          patients={allPatients}
          tasks={tasks}
          singlePatientId={patient.id}
        />
      )}
    </div>
  )
}

export default PatientDetailPage
