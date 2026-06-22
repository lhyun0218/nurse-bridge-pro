import React, { useState } from 'react'
import { useAppDispatch } from '../../hooks/useAppDispatch'
import { updateVitalSigns } from '../../store/slices/patientsSlice'
import type { Patient, VitalSigns } from '../../types'

const ManualVitalEntry: React.FC<{ patient: Patient }> = ({ patient }) => {
  const dispatch = useAppDispatch()
  const [editing, setEditing] = useState(false)
  const [vitals, setVitals] = useState<VitalSigns>(patient.vitalSigns)

  const handleSave = () => {
    const withTs = { ...vitals, lastUpdated: Date.now() }
    dispatch(updateVitalSigns({ patientId: patient.id, vitalSigns: withTs }))
    setEditing(false)
  }

  return (
    <div style={{ marginTop: 12, padding: '10px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
      {!editing ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>활력징후 수동 입력 가능 (중증 아님)</div>
          <button onClick={() => setEditing(true)} style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: 'var(--color-primary)', color: '#fff', cursor: 'pointer' }}>수동 입력</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--color-muted)' }}>혈압 (Systolic/Diastolic)</label>
            <input value={vitals.bloodPressure} onChange={e => setVitals({ ...vitals, bloodPressure: e.target.value })} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--color-border)', marginTop: 6 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--color-muted)' }}>맥박 (bpm)</label>
            <input type="number" value={vitals.heartRate} onChange={e => setVitals({ ...vitals, heartRate: Number(e.target.value) })} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--color-border)', marginTop: 6 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--color-muted)' }}>체온 (°C)</label>
            <input type="number" step="0.1" value={vitals.temperature} onChange={e => setVitals({ ...vitals, temperature: Number(e.target.value) })} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--color-border)', marginTop: 6 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--color-muted)' }}>호흡수</label>
            <input type="number" value={vitals.respiratoryRate} onChange={e => setVitals({ ...vitals, respiratoryRate: Number(e.target.value) })} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--color-border)', marginTop: 6 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--color-muted)' }}>SpO₂ (%)</label>
            <input type="number" value={vitals.oxygenSaturation} onChange={e => setVitals({ ...vitals, oxygenSaturation: Number(e.target.value) })} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--color-border)', marginTop: 6 }} />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <button onClick={handleSave} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: 'var(--color-primary)', color: '#fff', cursor: 'pointer' }}>저장</button>
            <button onClick={() => { setEditing(false); setVitals(patient.vitalSigns) }} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-muted)', cursor: 'pointer' }}>취소</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManualVitalEntry
