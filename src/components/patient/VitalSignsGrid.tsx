import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
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
  /** 실시간 모니터링 중일 때 true — "실시간" 배지 표시 */
  isRealtime?: boolean
}

function getValueColor(isAbnormal?: boolean, isBorderline?: boolean): string {
  if (isAbnormal) return '#C0392B'
  if (isBorderline) return '#D4860A'
  return 'var(--color-text)'
}

function buildItems(v: VitalSigns): VitalItem[] {
  const systolic = parseInt(v.bloodPressure.split('/')[0], 10)

  return [
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
}

/** 수치가 변경됐을 때 잠깐 강조 애니메이션을 주는 셀 */
const VitalCell: React.FC<{ item: VitalItem; animate: boolean }> = ({ item, animate }) => {
  const color = getValueColor(item.isAbnormal, item.isBorderline)

  return (
    <motion.div
      style={{
        background: item.isAbnormal ? '#FFF5F5' : 'var(--color-bg)',
        borderRadius: '10px',
        padding: '12px 8px',
        textAlign: 'center',
        border: item.isAbnormal ? '1px solid #FDECEA' : '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '3px',
        minHeight: '72px',
      }}
      animate={animate ? { scale: [1, 1.04, 1] } : {}}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <div style={{ fontSize: '10px', color: 'var(--color-muted)', fontWeight: 600, letterSpacing: '0.3px' }}>
        {item.label}
      </div>
      <div
        style={{
          fontSize: '15px',
          fontWeight: 700,
          color,
          lineHeight: 1.3,
          fontVariantNumeric: 'tabular-nums',
          fontFeatureSettings: '"tnum"',
          wordBreak: 'break-all',   // 긴 수치(혈압 등) 줄바꿈 허용
          overflowWrap: 'anywhere',
          maxWidth: '100%',
        }}
      >
        {item.value}
      </div>
      <div style={{ fontSize: '9px', color: 'var(--color-muted)' }}>{item.unit}</div>
    </motion.div>
  )
}

const VitalSignsGrid: React.FC<VitalSignsGridProps> = ({ vitalSigns: v, isRealtime = false }) => {
  const items = buildItems(v)

  // 이전 값과 비교해 변경된 항목 추적
  const prevItemsRef = useRef<VitalItem[]>(items)
  const [changedKeys, setChangedKeys] = useState<Set<string>>(new Set())

  useEffect(() => {
    const prev = prevItemsRef.current
    const changed = new Set<string>()

    items.forEach((item, i) => {
      if (prev[i] && String(prev[i].value) !== String(item.value)) {
        changed.add(item.label)
      }
    })

    if (changed.size > 0) {
      setChangedKeys(changed)
      // 애니메이션 후 초기화
      const t = setTimeout(() => setChangedKeys(new Set()), 600)
      prevItemsRef.current = items
      return () => clearTimeout(t)
    }

    prevItemsRef.current = items
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v])

  return (
    <div>
      {/* 타임스탬프 표시 */}
      {v.lastUpdated && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
            최근: {new Date(v.lastUpdated).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      )}
      {/* 실시간 배지 */}
      {isRealtime && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#2E7D5E',
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#2E7D5E', letterSpacing: '0.4px' }}>
            실시간 모니터링
          </span>
          <span style={{ fontSize: '10px', color: 'var(--color-muted)' }}>· 5초마다 업데이트</span>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
        }}
      >
        {items.map((item) => (
          <VitalCell
            key={item.label}
            item={item}
            animate={changedKeys.has(item.label)}
          />
        ))}
      </div>
    </div>
  )
}

export default VitalSignsGrid
