import { useEffect, useRef } from 'react'
import { useAppDispatch } from './useAppDispatch'
import { useAppSelector } from './useAppSelector'
import { updateVitalSigns } from '../store/slices/patientsSlice'
import { upsertVitalAlert, removeVitalAlert } from '../store/slices/alertsSlice'
import type { VitalSigns } from '../types'
import type { VitalAlert } from '../store/slices/alertsSlice'

// 소폭 랜덤 변동 헬퍼 (±delta 범위 내 정수 변동)
function jitter(value: number, delta: number, min: number, max: number): number {
  const next = value + (Math.random() * delta * 2 - delta)
  return Math.round(Math.min(max, Math.max(min, next)) * 10) / 10
}

// 활력징후 임계값 체크 → 알림 목록 반환
function buildVitalAlerts(
  patientId: string,
  patientName: string,
  roomNumber: string,
  v: VitalSigns,
): VitalAlert[] {
  const alerts: VitalAlert[] = []
  const now = Date.now()

  const systolic = parseInt(v.bloodPressure.split('/')[0], 10)
  const diastolic = parseInt(v.bloodPressure.split('/')[1], 10)

  // 혈당 > 180
  if (v.bloodGlucose !== undefined && v.bloodGlucose > 180) {
    alerts.push({
      id: `${patientId}-glucose`,
      patientId,
      patientName,
      roomNumber,
      type: 'danger',
      message: `🚨 ${roomNumber}호 ${patientName} — 혈당 비정상 (${v.bloodGlucose} mg/dL)`,
      timestamp: now,
    })
  }

  // SpO₂ < 94%
  if (v.oxygenSaturation < 94) {
    alerts.push({
      id: `${patientId}-spo2`,
      patientId,
      patientName,
      roomNumber,
      type: 'danger',
      message: `🔴 ${roomNumber}호 ${patientName} — SpO₂ ${v.oxygenSaturation}% 저하`,
      timestamp: now,
    })
  }

  // 혈압 수축기 > 160 또는 이완기 > 100
  if (!isNaN(systolic) && (systolic > 160 || diastolic > 100)) {
    alerts.push({
      id: `${patientId}-bp`,
      patientId,
      patientName,
      roomNumber,
      type: 'danger',
      message: `🚨 ${roomNumber}호 ${patientName} — 혈압 위험 (${v.bloodPressure} mmHg)`,
      timestamp: now,
    })
  }

  // 심박수 > 100 또는 < 60
  if (v.heartRate > 100 || v.heartRate < 60) {
    alerts.push({
      id: `${patientId}-hr`,
      patientId,
      patientName,
      roomNumber,
      type: 'warn',
      message: `⚠️ ${roomNumber}호 ${patientName} — 맥박 이상 (${v.heartRate} bpm)`,
      timestamp: now,
    })
  }

  // 체온 > 38.5
  if (v.temperature > 38.5) {
    alerts.push({
      id: `${patientId}-temp`,
      patientId,
      patientName,
      roomNumber,
      type: 'warn',
      message: `⚠️ ${roomNumber}호 ${patientName} — 고열 (${v.temperature}°C)`,
      timestamp: now,
    })
  }

  // 호흡수 > 24
  if (v.respiratoryRate > 24) {
    alerts.push({
      id: `${patientId}-rr`,
      patientId,
      patientName,
      roomNumber,
      type: 'warn',
      message: `⚠️ ${roomNumber}호 ${patientName} — 호흡수 증가 (${v.respiratoryRate}회/분)`,
      timestamp: now,
    })
  }

  // 통증 > 6
  if (v.painScore !== undefined && v.painScore > 6) {
    alerts.push({
      id: `${patientId}-pain`,
      patientId,
      patientName,
      roomNumber,
      type: 'warn',
      message: `⚠️ ${roomNumber}호 ${patientName} — 통증 호소 (${v.painScore}/10)`,
      timestamp: now,
    })
  }

  return alerts
}

// 활력징후 Mock 업데이트 — 현실적인 소폭 변동
function simulateVitalUpdate(current: VitalSigns): VitalSigns {
  const systolic  = parseInt(current.bloodPressure.split('/')[0], 10)
  const diastolic = parseInt(current.bloodPressure.split('/')[1], 10)

  const newSystolic  = jitter(systolic,  3, 80, 200)
  const newDiastolic = jitter(diastolic, 2, 50, 120)

  const updated: VitalSigns = {
    bloodPressure:    `${newSystolic}/${newDiastolic}`,
    heartRate:        jitter(current.heartRate,        3, 40, 150),
    temperature:      jitter(current.temperature,      0.1, 35.0, 41.0),
    respiratoryRate:  jitter(current.respiratoryRate,  1, 8, 35),
    oxygenSaturation: jitter(current.oxygenSaturation, 1, 80, 100),
  }

  if (current.bloodGlucose !== undefined) {
    updated.bloodGlucose = jitter(current.bloodGlucose, 5, 50, 400)
  }
  if (current.painScore !== undefined) {
    updated.painScore = Math.round(jitter(current.painScore, 0.5, 0, 10))
  }
  if (current.gcs !== undefined) {
    updated.gcs = Math.round(jitter(current.gcs, 0.3, 3, 15))
  }

  return updated
}

/**
 * useVitalMonitor
 *
 * 5초마다 담당 환자들의 활력징후를 Mock 업데이트하고,
 * 임계값 초과 시 Redux alertsSlice에 알림을 upsert한다.
 *
 * @param patientIds - 모니터링할 환자 ID 배열 (빈 배열이면 비활성)
 */
export function useVitalMonitor(patientIds: string[]) {
  const dispatch   = useAppDispatch()
  const allPatients = useAppSelector(s => s.patients.allPatients)

  // 최신 환자 목록을 ref로 유지 (stale closure 방지)
  const patientsRef = useRef(allPatients)
  useEffect(() => {
    patientsRef.current = allPatients
  }, [allPatients])

  const patientIdsRef = useRef(patientIds)
  useEffect(() => {
    patientIdsRef.current = patientIds
  }, [patientIds])

  useEffect(() => {
    if (patientIds.length === 0) return

    const interval = setInterval(() => {
      const patients = patientsRef.current
      const ids      = patientIdsRef.current

      for (const pid of ids) {
        const patient = patients.find(p => p.id === pid)
        if (!patient) continue

        // High(위급) 환자만 라이브 자동 업데이트, 나머지는 수동 기록
        if (patient.severity !== 'High') continue

        const newVitals = simulateVitalUpdate(patient.vitalSigns)
        dispatch(updateVitalSigns({ patientId: pid, vitalSigns: { ...newVitals, lastUpdated: Date.now() } }))

        // 임계값 체크 → 알림 upsert / 해제
        const alerts = buildVitalAlerts(pid, patient.name, patient.roomNumber, newVitals)

        // 이번 업데이트에서 생성된 alert ID 집합
        const activeIds = new Set(alerts.map(a => a.id))

        // 이 환자에 대한 기존 alert 중 더 이상 해당 안 되는 것 제거
        const possibleIds = [
          `${pid}-glucose`, `${pid}-spo2`, `${pid}-bp`,
          `${pid}-hr`, `${pid}-temp`, `${pid}-rr`, `${pid}-pain`,
        ]
        for (const aid of possibleIds) {
          if (!activeIds.has(aid)) {
            dispatch(removeVitalAlert(aid))
          }
        }

        // 새 알림 upsert
        for (const alert of alerts) {
          dispatch(upsertVitalAlert(alert))
        }
      }
    }, 20000) // 위급 환자 20초마다 활력징후 업데이트

    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, patientIds.length])
}
