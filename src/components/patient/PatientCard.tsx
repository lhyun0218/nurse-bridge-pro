import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAppSelector } from '../../hooks/useAppSelector'
import type { Patient, NursingTask } from '../../types'
import { SeverityBadge, VitalChip } from '../common'

interface PatientCardProps {
  patient: Patient
  tasks: NursingTask[]
}

const borderColors: Record<string, string> = {
  High:   '#C0392B',
  Medium: '#D4860A',
  Low:    '#2E7D5E',
}

function getAdmissionDays(admissionDate: string): number {
  const admission = new Date(admissionDate)
  const now = new Date()
  const diff = Math.floor((now.getTime() - admission.getTime()) / (1000 * 60 * 60 * 24))
  return diff + 1
}

function isVitalAbnormal(patient: Patient): {
  bp: { abnormal: boolean; borderline: boolean }
  hr: { abnormal: boolean; borderline: boolean }
  spo2: { abnormal: boolean; borderline: boolean }
  bt: { abnormal: boolean; borderline: boolean }
  bg: { abnormal: boolean; borderline: boolean }
  pain: { abnormal: boolean; borderline: boolean }
  gcs: { abnormal: boolean; borderline: boolean }
  rr: { abnormal: boolean; borderline: boolean }
} {
  const v = patient.vitalSigns
  const systolic = parseInt(v.bloodPressure.split('/')[0], 10)

  return {
    bp: {
      abnormal: systolic > 160,
      borderline: systolic > 140 && systolic <= 160,
    },
    hr: {
      abnormal: v.heartRate > 100 || v.heartRate < 60,
      borderline: (v.heartRate > 90 && v.heartRate <= 100),
    },
    spo2: {
      abnormal: v.oxygenSaturation < 94,
      borderline: v.oxygenSaturation >= 94 && v.oxygenSaturation < 96,
    },
    bt: {
      abnormal: v.temperature > 38.5 || v.temperature < 36.0,
      borderline: v.temperature > 38.0 && v.temperature <= 38.5,
    },
    bg: {
      abnormal: (v.bloodGlucose ?? 0) > 180,
      borderline: (v.bloodGlucose ?? 0) > 140 && (v.bloodGlucose ?? 0) <= 180,
    },
    pain: {
      abnormal: (v.painScore ?? 0) > 7,
      borderline: (v.painScore ?? 0) > 5 && (v.painScore ?? 0) <= 7,
    },
    gcs: {
      abnormal: (v.gcs ?? 15) < 10,
      borderline: (v.gcs ?? 15) >= 10 && (v.gcs ?? 15) < 13,
    },
    rr: {
      abnormal: v.respiratoryRate > 24 || v.respiratoryRate < 10,
      borderline: v.respiratoryRate > 20 && v.respiratoryRate <= 24,
    },
  }
}

const PatientCard: React.FC<PatientCardProps> = ({ patient, tasks }) => {
  const todayKey = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })()
  const assignments = useAppSelector(s => s.assignments.byDate[todayKey] ?? {})
  const nurses = useAppSelector(s => s.nurses.allNurses)
  const navigate = useNavigate()
  const completed = tasks.filter(t => t.status === 'Completed').length
  const total = tasks.length
  const rate = total === 0 ? 0 : Math.round((completed / total) * 100)
  const allDone = total > 0 && completed === total
  const days = getAdmissionDays(patient.admissionDate)
  const vitalFlags = isVitalAbnormal(patient)
  const v = patient.vitalSigns

  const barColor = allDone ? '#2E7D5E' : rate >= 80 ? '#2E7D5E' : rate >= 50 ? '#2C6E8A' : '#D4860A'

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 6px 22px rgba(44,110,138,.14)' }}
      style={{
        background: 'var(--color-surface)',
        borderRadius: '10px',
        boxShadow: '0 2px 12px rgba(44,110,138,.09)',
        padding: '16px 18px',
        borderLeft: `4px solid ${borderColors[patient.severity]}`,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'background-color 0.3s ease',
      }}
      onClick={() => navigate(`/patient/${patient.id}`)}
    >
      {/* 상단: 병실번호 + 중증도 배지 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: 500 }}>
          병실 {patient.roomNumber} · {patient.id}
        </div>
        <SeverityBadge severity={patient.severity} />
      </div>

      {/* 환자명 */}
      <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '2px', color: 'var(--color-text)' }}>
        {patient.name}
      </div>

      {/* 담당 간호사 (Day / Evening / Night) */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
        {['Day', 'Evening', 'Night'].map(shift => {
          const aid = assignments?.[patient.id]?.[shift as 'Day'|'Evening'|'Night']
          const nurse = aid ? nurses.find(n => n.id === aid) : undefined
          return (
            <div key={shift} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-muted)' }}>{shift[0]}</div>
              <div style={{ fontSize: '12px', color: nurse ? 'var(--color-text)' : 'var(--color-muted)', padding: '4px 8px', borderRadius: '999px', border: '1px solid var(--color-border)', background: nurse ? '#F7FBFC' : 'transparent' }}>
                {nurse ? nurse.name : '미배정'}
              </div>
            </div>
          )
        })}
      </div>

      {/* 나이/성별/혈액형/입원일차 */}
      <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginBottom: '6px', display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
        <span>{patient.age}세</span>
        <span style={{ color: 'var(--color-border)' }}>·</span>
        <span>{patient.gender === 'M' ? '남' : '여'}</span>
        {patient.bloodType && (
          <>
            <span style={{ color: 'var(--color-border)' }}>·</span>
            <span style={{ fontWeight: 700, color: '#3F51B5' }}>{patient.bloodType}형</span>
          </>
        )}
        <span style={{ color: 'var(--color-border)' }}>·</span>
        <span>입원 {days}일차</span>
        {patient.codeStatus === 'DNR' && (
          <span style={{ marginLeft: '4px', fontSize: '10px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', background: '#3D1A18', color: '#ff6b6b', border: '1px solid #C0392B' }}>DNR</span>
        )}
      </div>

      {/* 알레르기 경고 */}
      {patient.allergies && patient.allergies.length > 0 && (
        <div style={{ fontSize: '11px', color: '#C0392B', fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>⚠️</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            알레르기: {patient.allergies[0]}{patient.allergies.length > 1 ? ` 외 ${patient.allergies.length - 1}건` : ''}
          </span>
        </div>
      )}

      {/* 진단 태그 */}
      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px', minHeight: '48px', alignContent: 'flex-start', overflow: 'hidden' }}>
        {patient.diagnosis.map((d, i) => (
          <span
            key={i}
            style={{
              padding: '2px 8px',
              background: 'var(--color-bg)',
              borderRadius: '5px',
              fontSize: '11px',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
            }}
          >
            {d}
          </span>
        ))}
      </div>

      {/* 활력징후 칩 — 고정 높이로 레이아웃 shift 방지 */}
      <div
        style={{
          height: '64px',
          display: 'flex',
          gap: '5px',
          flexWrap: 'wrap',
          alignContent: 'flex-start',
          marginBottom: '4px',
          overflow: 'hidden',
        }}
      >
        <VitalChip
          label="BP"
          value={v.bloodPressure}
          isAbnormal={vitalFlags.bp.abnormal}
          isBorderline={vitalFlags.bp.borderline}
        />
        <VitalChip
          label="HR"
          value={v.heartRate}
          isAbnormal={vitalFlags.hr.abnormal}
          isBorderline={vitalFlags.hr.borderline}
        />
        <VitalChip
          label="SpO₂"
          value={`${v.oxygenSaturation}%`}
          isAbnormal={vitalFlags.spo2.abnormal}
          isBorderline={vitalFlags.spo2.borderline}
        />
        {v.temperature !== undefined && (
          <VitalChip
            label="BT"
            value={`${v.temperature}°`}
            isAbnormal={vitalFlags.bt.abnormal}
            isBorderline={vitalFlags.bt.borderline}
          />
        )}
        {v.bloodGlucose !== undefined && (
          <VitalChip
            label="BG"
            value={v.bloodGlucose}
            isAbnormal={vitalFlags.bg.abnormal}
            isBorderline={vitalFlags.bg.borderline}
          />
        )}
        {v.painScore !== undefined && (
          <VitalChip
            label="Pain"
            value={`${v.painScore}/10`}
            isAbnormal={vitalFlags.pain.abnormal}
            isBorderline={vitalFlags.pain.borderline}
          />
        )}
        {v.gcs !== undefined && (
          <VitalChip
            label="GCS"
            value={v.gcs}
            isAbnormal={vitalFlags.gcs.abnormal}
            isBorderline={vitalFlags.gcs.borderline}
          />
        )}
        {v.respiratoryRate > 20 && (
          <VitalChip
            label="RR"
            value={v.respiratoryRate}
            isAbnormal={vitalFlags.rr.abnormal}
            isBorderline={vitalFlags.rr.borderline}
          />
        )}
      </div>

      {/* 활력징후 측정 시각 — High는 라이브(자동), 나머지는 수동 측정 시각 표시 */}
      <div style={{ marginBottom: '12px', fontSize: '10px', color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
        {patient.severity === 'High' ? (
          <span style={{ color: '#C0392B', fontWeight: 600 }}>🔴 라이브 모니터링 중</span>
        ) : v.lastUpdated ? (
          <span>📋 수동 측정 · {new Date(v.lastUpdated).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 기록</span>
        ) : (
          <span>📋 수동 측정 필요</span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <div
          style={{
            flex: 1,
            height: '5px',
            background: 'var(--color-border)',
            borderRadius: '3px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${rate}%`,
              height: '100%',
              background: barColor,
              borderRadius: '3px',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        <div
          style={{
            fontSize: '11px',
            color: allDone ? '#2E7D5E' : 'var(--color-muted)',
            whiteSpace: 'nowrap',
          }}
        >
          {allDone ? `${total}/${total} ✓` : `${completed}/${total} 완료`}
        </div>
      </div>

      {/* 카드 하단 버튼 */}
      <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
        {allDone ? (
          <button
            style={{
              flex: 1,
              padding: '8px 6px',
              borderRadius: '7px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'center',
              background: 'var(--color-ok-bg)',
              color: 'var(--color-ok)',
              border: '1.5px solid var(--color-ok)',
            }}
            onClick={e => { e.stopPropagation(); navigate(`/patient/${patient.id}`) }}
          >
            완료 ✓
          </button>
        ) : (
          <>
            <button
              style={{
                flex: 1,
                padding: '8px 6px',
                borderRadius: '7px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center',
                border: '1.5px solid var(--color-border)',
                background: 'var(--color-bg)',
                color: 'var(--color-text)',
              }}
              onClick={e => { e.stopPropagation(); navigate(`/patient/${patient.id}`) }}
              onMouseEnter={e => {
                const el = e.currentTarget
                el.style.borderColor = '#2C6E8A'
                el.style.color = '#2C6E8A'
                el.style.background = '#EBF4F8'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.borderColor = 'var(--color-border)'
                el.style.color = 'var(--color-text)'
                el.style.background = 'var(--color-bg)'
              }}
            >
              상세 보기
            </button>
            <button
              style={{
                flex: 1,
                padding: '8px 6px',
                borderRadius: '7px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center',
                background: 'var(--color-primary)',
                color: '#FFFFFF',
                border: 'none',
              }}
              onClick={e => { e.stopPropagation(); navigate(`/patient/${patient.id}`) }}
              onMouseEnter={e => { e.currentTarget.style.background = '#1E5470' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-primary)' }}
            >
              Todo 확인
            </button>
          </>
        )}
      </div>
    </motion.div>
  )
}

export default PatientCard
