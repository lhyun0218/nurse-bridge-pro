import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAppDispatch } from '../hooks/useAppDispatch'
import { useAppSelector } from '../hooks/useAppSelector'
import { addPatient, updatePatient } from '../store/slices/patientsSlice'
import { setAssignments } from '../store/slices/assignmentsSlice'
import { useToast } from '../hooks/useToast'
import { Button, Toast } from '../components/common'
import { autoAssignPatients } from '../utils/autoAssignPatients'
import { toLocalDateKey } from '../utils/dateUtils'
import type { Patient, Severity } from '../types'

// ── 진단명별 Todo 템플릿 미리보기 ─────────────────
const DIAGNOSIS_TEMPLATES: Record<string, string[]> = {
  '폐렴':        ['활력징후 측정 (Q4H)', '항생제 IV 투여 확인', '산소 포화도 체크', '가래 흡입 (PRN)', 'I/O 기록'],
  '당뇨병':      ['공복 혈당 측정', '인슐린 투여 확인', '발 드레싱', '식전 혈당 측정', '퇴원 교육'],
  '고혈압':      ['활력징후 측정', '혈압약 투여', '퇴원 교육', '외래 예약 확인'],
  'COPD':        ['산소 포화도 연속 모니터링', '네뷸라이저 치료 (Q4H)', '활력징후 측정 (Q2H)', '소변량 측정', '체중 측정'],
  '뇌졸중':      ['신경학적 사정 (Q2H)', '혈압 측정 및 약물 조절', '체위 변경 (Q2H)', '구강 간호', '욕창 예방'],
  '심부전':      ['활력징후 측정', '이뇨제 IV 투여', '소변량 시간당 측정', '체중 측정', 'I/O 기록'],
  '골절':        ['활력징후 및 통증 사정', '수술 부위 드레싱 확인', 'DVT 예방 주사', '물리치료 전 교육'],
  '담낭염':      ['활력징후 및 통증 사정', '수술 부위 드레싱 확인', '항생제 IV 투여', '식이 진행 확인'],
  '신부전':      ['활력징후 측정', '수분 섭취량 확인', 'EPO SC 투여', 'I/O 기록', '부종 사정'],
  '천식':        ['산소 포화도 및 호흡 사정', '네뷸라이저 치료', '스테로이드 IV 투여', 'Peak Flow 측정'],
  '빈혈':        ['철분 IV 주입 모니터링', '활력징후 측정', '낙상 예방 교육', '영양 상담 연계'],
  '크론병':      ['활력징후 측정', '스테로이드 IV 투여', '배변 횟수 기록', '영양 상담 연계'],
  '충수염':      ['활력징후 및 통증 사정', '항생제 IV 투여', '수술 부위 드레싱 확인', '보호자 퇴원 교육'],
  '신우신염':    ['활력징후 측정', '항생제 IV 투여', '소변 배양 결과 확인', '수분 섭취 권장'],
  '열성 경련':   ['체온 측정 (Q30min)', '경련 재발 모니터링', '해열제 투여', '보호자 교육'],
}

// ── 빈 폼 초기값 ──────────────────────────────
const emptyForm = {
  name: '',
  age: '',
  gender: 'M' as 'M' | 'F',
  roomNumber: '',
  diagnosis: '',
  severity: 'Medium' as Severity,
  assignedNurseId: '',
}

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}

// ── 스타일 헬퍼 ───────────────────────────────
const card: React.CSSProperties = {
  background: 'var(--color-surface)',
  borderRadius: 'var(--radius-card)',
  boxShadow: 'var(--shadow-card)',
  padding: '24px',
}

const label: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--color-muted)',
  marginBottom: '6px',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1.5px solid var(--color-border)',
  borderRadius: '8px',
  fontSize: '14px',
  color: 'var(--color-text)',
  background: 'var(--color-bg)',
  outline: 'none',
  transition: 'border-color 0.15s',
  fontFamily: 'inherit',
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
}

const SEVERITY_COLORS: Record<Severity, string> = {
  High:   '#C0392B',
  Medium: '#D4860A',
  Low:    '#2E7D5E',
}

// ── 컴포넌트 ──────────────────────────────────
const PatientFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { toasts, removeToast, success, error: showError } = useToast()

  const allPatients = useAppSelector(s => s.patients.allPatients)
  const allNurses   = useAppSelector(s => s.nurses.allNurses)
  const activeNurses = allNurses.filter(n => n.role === 'Nurse')

  const [form, setForm] = useState(emptyForm)
  const [diagnosisInput, setDiagnosisInput] = useState('')
  const [diagnosisList, setDiagnosisList] = useState<string[]>([])
  const [todoPreview, setTodoPreview] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; roomNumber?: string; diagnosis?: string }>({})

  const allNursesForAssign = useAppSelector(s => s.nurses.allNurses)
  const scheduleSaved      = useAppSelector(s => s.schedule.saved)

  // 수정 모드: 기존 환자 데이터 로드
  useEffect(() => {
    if (isEdit && id) {
      const patient = allPatients.find(p => p.id === id)
      if (patient) {
        setForm({
          name:           patient.name,
          age:            String(patient.age),
          gender:         patient.gender,
          roomNumber:     patient.roomNumber,
          diagnosis:      '',
          severity:       patient.severity,
          assignedNurseId: patient.assignedNurseId,
        })
        setDiagnosisList(patient.diagnosis)
        // 첫 번째 진단명으로 Todo 미리보기
        if (patient.diagnosis.length > 0) {
          updateTodoPreview(patient.diagnosis[0])
        }
      }
    }
  }, [isEdit, id, allPatients])

  // 진단명 변경 시 Todo 템플릿 미리보기 업데이트
  const updateTodoPreview = (diagName: string) => {
    const key = Object.keys(DIAGNOSIS_TEMPLATES).find(k =>
      diagName.includes(k) || k.includes(diagName)
    )
    setTodoPreview(key ? DIAGNOSIS_TEMPLATES[key] : [])
  }

  const handleDiagnosisInputChange = (val: string) => {
    setDiagnosisInput(val)
    updateTodoPreview(val)
  }

  const addDiagnosis = () => {
    const trimmed = diagnosisInput.trim()
    if (trimmed && !diagnosisList.includes(trimmed)) {
      const next = [...diagnosisList, trimmed]
      setDiagnosisList(next)
      updateTodoPreview(trimmed)
    }
    setDiagnosisInput('')
  }

  const removeDiagnosis = (d: string) => {
    const next = diagnosisList.filter(x => x !== d)
    setDiagnosisList(next)
    if (next.length > 0) updateTodoPreview(next[0])
    else setTodoPreview([])
  }

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const validate = (): boolean => {
    const errors: { name?: string; roomNumber?: string; diagnosis?: string } = {}
    if (!form.name.trim())          errors.name = '환자 이름을 입력하세요.'
    if (!form.roomNumber.trim())    errors.roomNumber = '병실 번호를 입력하세요.'
    if (diagnosisList.length === 0) errors.diagnosis = '진단명을 하나 이상 입력하세요.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    // 나이 / 담당간호사 추가 검증 (인라인 처리 대상 아니지만 toast로 알림)
    if (!form.age || isNaN(Number(form.age)) || Number(form.age) <= 0) {
      showError('올바른 나이를 입력하세요.')
      return
    }
    if (!form.assignedNurseId) {
      showError('담당 간호사를 선택하세요.')
      return
    }

    setSubmitting(true)

    const patientId = isEdit && id ? id : `P${Date.now().toString().slice(-6)}`
    const medicalRecordNo = isEdit
      ? (allPatients.find(p => p.id === id)?.medicalRecordNo ?? patientId)
      : patientId

    const patient: Patient = {
      id: patientId,
      medicalRecordNo,
      name:           form.name.trim(),
      age:            Number(form.age),
      gender:         form.gender,
      roomNumber:     form.roomNumber.trim(),
      diagnosis:      diagnosisList,
      severity:       form.severity,
      assignedNurseId: form.assignedNurseId,
      vitalSigns: isEdit
        ? (allPatients.find(p => p.id === id)?.vitalSigns ?? {
            bloodPressure: '120/80', heartRate: 72, temperature: 36.5,
            respiratoryRate: 16, oxygenSaturation: 98,
          })
        : {
            bloodPressure: '120/80', heartRate: 72, temperature: 36.5,
            respiratoryRate: 16, oxygenSaturation: 98,
          },
      recentLabs:    isEdit ? (allPatients.find(p => p.id === id)?.recentLabs ?? []) : [],
      medications:   isEdit ? (allPatients.find(p => p.id === id)?.medications ?? []) : [],
      nursingTaskIds: isEdit ? (allPatients.find(p => p.id === id)?.nursingTaskIds ?? []) : [],
      aiSummary:     isEdit ? (allPatients.find(p => p.id === id)?.aiSummary ?? []) : [],
      admissionDate: isEdit
        ? (allPatients.find(p => p.id === id)?.admissionDate ?? new Date().toISOString())
        : new Date().toISOString(),
    }

    if (isEdit) {
      dispatch(updatePatient(patient))
      success(`✅ ${patient.name} 환자 정보가 수정되었습니다.`)
    } else {
      dispatch(addPatient(patient))

      // 오늘 날짜 배정 생성 — 신규 환자를 포함한 전체 환자 목록 대상
      const todayKey = toLocalDateKey()
      const now = new Date()
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const scheduleRows = scheduleSaved[monthKey] ?? []
      const dateIndex = now.getDate() - 1

      const updatedPatients = [...allPatients, patient]
      const newAssignments = autoAssignPatients(
        allNursesForAssign,
        updatedPatients,
        { scheduleRows, dateIndex },
      )
      dispatch(setAssignments({ date: todayKey, assignments: newAssignments }))

      success(`✅ ${patient.name} 환자가 등록되었습니다.`)
    }

    setTimeout(() => {
      setSubmitting(false)
      navigate('/head-nurse')
    }, 1200)
  }

  const selectedNurse = activeNurses.find(n => n.id === form.assignedNurseId)

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.3 }}
      style={{ padding: '22px 24px 60px', maxWidth: '760px', margin: '0 auto' }}
    >
      {/* ── 헤더 ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => navigate('/head-nurse')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-muted)', fontSize: '20px', lineHeight: 1,
            padding: '4px',
          }}
          aria-label="뒤로 가기"
        >
          ←
        </button>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
            {isEdit ? '환자 정보 수정' : '신규 환자 등록'}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: '2px 0 0' }}>
            수간호사 전용 — 환자 정보를 {isEdit ? '수정' : '등록'}합니다
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* ── 기본 정보 ── */}
        <div style={{ ...card, marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '18px' }}>
            기본 정보
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* 이름 */}
            <div>
              <label style={label}>환자 이름 <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <input
                style={inputStyle}
                type="text"
                placeholder="홍길동"
                value={form.name}
                onChange={e => handleChange('name', e.target.value)}
                required
              />
              {fieldErrors.name && (
                <div style={{ fontSize: '12px', color: 'var(--color-danger)', marginTop: '4px' }}>{fieldErrors.name}</div>
              )}
            </div>

            {/* 나이 */}
            <div>
              <label style={label}>나이 <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <input
                style={inputStyle}
                type="number"
                placeholder="65"
                min={0}
                max={130}
                value={form.age}
                onChange={e => handleChange('age', e.target.value)}
                required
              />
            </div>

            {/* 성별 */}
            <div>
              <label style={label}>성별 <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <select
                style={selectStyle}
                value={form.gender}
                onChange={e => handleChange('gender', e.target.value)}
              >
                <option value="M">남성 (M)</option>
                <option value="F">여성 (F)</option>
              </select>
            </div>

            {/* 병실 번호 */}
            <div>
              <label style={label}>병실 번호 <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <input
                style={inputStyle}
                type="text"
                placeholder="101"
                value={form.roomNumber}
                onChange={e => handleChange('roomNumber', e.target.value)}
                required
              />
              {fieldErrors.roomNumber && (
                <div style={{ fontSize: '12px', color: 'var(--color-danger)', marginTop: '4px' }}>{fieldErrors.roomNumber}</div>
              )}
            </div>
          </div>
        </div>

        {/* ── 진단 및 중증도 ── */}
        <div style={{ ...card, marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '18px' }}>
            진단 및 중증도
          </h2>

          {/* 진단명 입력 */}
          <div style={{ marginBottom: '16px' }}>
            <label style={label}>진단명 <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                style={{ ...inputStyle, flex: 1 }}
                type="text"
                placeholder="예: 폐렴, 당뇨병, COPD"
                value={diagnosisInput}
                onChange={e => handleDiagnosisInputChange(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDiagnosis() } }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addDiagnosis}
                style={{ whiteSpace: 'nowrap', minHeight: '42px' }}
              >
                + 추가
              </Button>
            </div>

            {/* 진단명 태그 목록 */}
            {diagnosisList.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                {diagnosisList.map(d => (
                  <span
                    key={d}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '4px 10px',
                      background: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '20px',
                      fontSize: '13px',
                      color: 'var(--color-text)',
                    }}
                  >
                    {d}
                    <button
                      type="button"
                      onClick={() => removeDiagnosis(d)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--color-muted)', fontSize: '14px', lineHeight: 1,
                        padding: '0 2px',
                      }}
                      aria-label={`${d} 제거`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            {fieldErrors.diagnosis && (
              <div style={{ fontSize: '12px', color: 'var(--color-danger)', marginTop: '6px' }}>{fieldErrors.diagnosis}</div>
            )}
          </div>

          {/* Todo 템플릿 미리보기 */}
          {todoPreview.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.2 }}
              style={{
                background: 'var(--color-ok-bg)',
                border: '1px solid #b8ddc9',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '16px',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-ok)', marginBottom: '8px' }}>
                📋 자동 생성될 간호 업무 미리보기
              </div>
              <ul style={{ margin: 0, paddingLeft: '16px' }}>
                {todoPreview.map((t, i) => (
                  <li key={i} style={{ fontSize: '13px', color: 'var(--color-text)', marginBottom: '3px' }}>
                    {t}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* 중증도 */}
          <div>
            <label style={label}>중증도 <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {(['High', 'Medium', 'Low'] as Severity[]).map(sev => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => handleChange('severity', sev)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: `2px solid ${form.severity === sev ? SEVERITY_COLORS[sev] : 'var(--color-border)'}`,
                    background: form.severity === sev
                      ? `${SEVERITY_COLORS[sev]}18`
                      : 'var(--color-bg)',
                    color: form.severity === sev ? SEVERITY_COLORS[sev] : 'var(--color-muted)',
                    fontWeight: form.severity === sev ? 700 : 500,
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {sev === 'High' ? '🔴 High' : sev === 'Medium' ? '🟡 Medium' : '🟢 Low'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── 담당 간호사 배정 ── */}
        <div style={{ ...card, marginBottom: '24px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '18px' }}>
            담당 간호사 배정
          </h2>

          <div>
            <label style={label}>담당 간호사 <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <select
              style={selectStyle}
              value={form.assignedNurseId}
              onChange={e => handleChange('assignedNurseId', e.target.value)}
              required
            >
              <option value="">-- 간호사 선택 --</option>
              {activeNurses.map(n => (
                <option key={n.id} value={n.id}>
                  {n.name} ({n.employeeId})
                  {n.overtimeHours >= 3 ? ' ⚠️ 오버타임' : ''}
                </option>
              ))}
            </select>

            {/* 선택된 간호사 오버타임 경고 */}
            {selectedNurse && selectedNurse.overtimeHours >= 3 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  background: 'var(--color-warn-bg)',
                  border: '1px solid #f0c060',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: 'var(--color-warn)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                ⚠️ {selectedNurse.name} 간호사는 현재 오버타임 {selectedNurse.overtimeHours}시간입니다. 배정에 주의하세요.
              </motion.div>
            )}

            {/* 선택된 간호사 현황 */}
            {selectedNurse && (
              <div style={{
                marginTop: '10px',
                padding: '10px 14px',
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                fontSize: '13px',
                color: 'var(--color-muted)',
                display: 'flex',
                gap: '16px',
              }}>
                <span>담당 환자: <strong style={{ color: 'var(--color-text)' }}>{selectedNurse.assignedPatients.length}명</strong></span>
                <span>오버타임: <strong style={{ color: selectedNurse.overtimeHours >= 3 ? 'var(--color-danger)' : 'var(--color-ok)' }}>{selectedNurse.overtimeHours}h</strong></span>
                <span>근무조: <strong style={{ color: 'var(--color-text)' }}>{selectedNurse.shiftType}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* ── 제출 버튼 ── */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => navigate('/head-nurse')}
          >
            취소
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={submitting}
          >
            {isEdit ? '수정 완료' : '환자 등록'}
          </Button>
        </div>
      </form>

      <Toast toasts={toasts} onRemove={removeToast} />
    </motion.div>
  )
}

export default PatientFormPage
