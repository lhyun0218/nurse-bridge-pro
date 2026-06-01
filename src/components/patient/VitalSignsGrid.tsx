import React from 'react'
import type { VitalSigns } from '../../types'

interface VitalItem {
  label: string
  value: string | number
  unit: string
  isAbnormal?: boolean
  isBorderline?: boolean
}

interface VitalSignsGridProps {
  vitalSigns: VitalSigns
}

function getValueColor(isAbnormal?: boolean, isBorderline?: boolean): string {
  if (isAbnormal) return '#C0392B'
  if (isBorderline) return '#D4860A'
  return '#1A2B38'
}

const VitalSignsGrid: React.FC<VitalSignsGridProps> = ({ vitalSigns: v }) => {
  const systolic = parseInt(v.bloodPressure.split('/')[0], 10)

  const items: VitalItem[] = [
    {
      label: '혈압', value: v.bloodPressure, unit: 'mmHg',
      isAbnormal: systolic > 160,
      isBorderline: systolic > 140 && systolic <= 160,
    },
    {
      label: '맥박', value: v.heartRate, unit: 'bpm',
      isAbnormal: v.heartRate > 100 || v.heartRate < 60,
      isBorderline: v.heartRate > 90 && v.heartRate <= 100,
    },
    {
      label: 'SpO₂', value: `${v.oxygenSaturation}%`, unit: '산소포화도',
      isAbnormal: v.oxygenSaturation < 94,
      isBorderline: v.oxygenSaturation >= 94 && v.oxygenSaturation < 96,
    },
    {
      label: '체온', value: `${v.temperature}°`, unit: '℃',
      isAbnormal: v.temperature > 38.5 || v.temperature < 36.0,
      isBorderline: v.temperature > 38.0 && v.temperature <= 38.5,
    },
    {
      label: '호흡수', value: v.respiratoryRate, unit: '회/분',
      isAbnormal: v.respiratoryRate > 24 || v.respiratoryRate < 10,
      isBorderline: v.respiratoryRate > 20 && v.respiratoryRate <= 24,
    },
    ...(v.bloodGlucose !== undefined ? [{
      label: '혈당', value: v.bloodGlucose, unit: 'mg/dL',
      isAbnormal: v.bloodGlucose > 180,
      isBorderline: v.bloodGlucose > 140 && v.bloodGlucose <= 180,
    }] : []),
    ...(v.painScore !== undefined ? [{
      label: '통증', value: `${v.painScore}/10`, unit: 'NRS',
      isAbnormal: v.painScore > 7,
      isBorderline: v.painScore > 5 && v.painScore <= 7,
    }] : []),
    ...(v.gcs !== undefined ? [{
      label: 'GCS', value: v.gcs, unit: '점',
      isAbnormal: v.gcs < 10,
      isBorderline: v.gcs >= 10 && v.gcs < 13,
    }] : []),
  ]

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
      }}
    >
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            background: '#F0F4F7',
            borderRadius: '8px',
            padding: '10px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '10px', color: '#6B8090', marginBottom: '3px' }}>{item.label}</div>
          <div style={{ fontSize: '17px', fontWeight: 700, color: getValueColor(item.isAbnormal, item.isBorderline) }}>
            {item.value}
          </div>
          <div style={{ fontSize: '10px', color: '#6B8090', marginTop: '2px' }}>{item.unit}</div>
        </div>
      ))}
    </div>
  )
}

export default VitalSignsGrid
