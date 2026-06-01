import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
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
        background: '#FFFFFF',
        borderRadius: '10px',
        boxShadow: '0 2px 12px rgba(44,110,138,.09)',
        padding: '16px 18px',
        borderLeft: `4px solid ${borderColors[patient.severity]}`,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
      }}
      onClick={() => navigate(`/patient/${patient.id}`)}
    >
      {/* 상단: 병실번호 + 중증도 배지 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div style={{ fontSize: '11px', color: '#6B8090', fontWeight: 500 }}>
          병실 {patient.roomNumber} · {patient.id}
        </div>
        <SeverityBadge severity={patient.severity} />
      </div>

      {/* 환자명 */}
      <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '2px', color: '#1A2B38' }}>
        {patient.name}
      </div>

      {/* 나이/성별/입원일차 */}
      <div style={{ fontSize: '12px', color: '#6B8090', marginBottom: '10px' }}>
        {patient.age}세 · {patient.gender === 'M' ? '남' : '여'} · 입원 {days}일차
      </div>

      {/* 진단 태그 */}
      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
        {patient.diagnosis.map((d, i) => (
          <span
            key={i}
            style={{
              padding: '2px 8px',
              background: '#F0F4F7',
              borderRadius: '5px',
              fontSize: '11px',
              color: '#1A2B38',
              border: '1px solid #DDE3E8',
            }}
          >
            {d}
          </span>
        ))}
      </div>

      {/* 활력징후 칩 */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
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

      {/* Todo 미니 ProgressBar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <div
          style={{
            flex: 1,
            height: '5px',
            background: '#DDE3E8',
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
            color: allDone ? '#2E7D5E' : '#6B8090',
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
              background: '#E8F5EE',
              color: '#2E7D5E',
              border: '1.5px solid #b8ddc9',
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
                border: '1.5px solid #DDE3E8',
                background: '#F0F4F7',
                color: '#1A2B38',
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
                el.style.borderColor = '#DDE3E8'
                el.style.color = '#1A2B38'
                el.style.background = '#F0F4F7'
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
                background: '#2C6E8A',
                color: '#FFFFFF',
                border: 'none',
              }}
              onClick={e => { e.stopPropagation(); navigate(`/patient/${patient.id}`) }}
              onMouseEnter={e => { e.currentTarget.style.background = '#1E5470' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#2C6E8A' }}
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
