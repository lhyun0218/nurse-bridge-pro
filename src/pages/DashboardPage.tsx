import React, { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAppDispatch } from '../hooks/useAppDispatch'
import { useAppSelector } from '../hooks/useAppSelector'
import { useMyPatients } from '../hooks/useMyPatients'
import { useVitalMonitor } from '../hooks/useVitalMonitor'
import { useMedicationTimer } from '../hooks/useMedicationTimer'
import { setPatients } from '../store/slices/patientsSlice'
import { setTasks } from '../store/slices/tasksSlice'
import { setNurses } from '../store/slices/nursesSlice'
import { saveShiftReport } from '../store/slices/shiftReportSlice'
import StatCards from '../components/dashboard/StatCards'
import AlertBanner from '../components/dashboard/AlertBanner'
import QuickMenu from '../components/dashboard/QuickMenu'
import PatientGrid from '../components/patient/PatientGrid'
import ShiftReportModal from '../components/report/ShiftReportModal'
import { requestCheckout } from '../store/slices/attendanceSlice'
import broadcast from '../utils/broadcast'
import { addNotification } from '../store/slices/notificationsSlice'

// ─────────────────────────────────────────
// 일반 간호사 대시보드
// ─────────────────────────────────────────
const NurseDashboard: React.FC = () => {
  // HeadNurseDashboard is unused in this file; defined elsewhere if needed.
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const allPatients = useAppSelector(s => s.patients.allPatients)
  const allTasks = useAppSelector(s => s.tasks.allTasks)
  const currentUser = useAppSelector(s => s.auth.currentUser)
  const { myPatients, getPatientTasks, getCompletionRate } = useMyPatients()
  const [reportOpen, setReportOpen] = useState(false)
  // 초기 데이터 로드
  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, tRes] = await Promise.all([fetch('/api/patients'), fetch('/api/tasks')])
        dispatch(setPatients(await pRes.json()))
        dispatch(setTasks(await tRes.json()))
      } catch (err) {
        console.error('데이터 로드 실패:', err)
      }
    }
    // Redux가 비어있으면 로드
    if (allPatients.length === 0 || allTasks.length === 0) {
      load()
    }
  }, [dispatch, allPatients.length, allTasks.length])

  const allTasksDone  = myPatients.length > 0 && myPatients.every(p => getCompletionRate(p.id) === 100)
  const myPatientIds  = myPatients.map(p => p.id)
  useVitalMonitor(myPatientIds)
  useMedicationTimer(myPatientIds)

  // 퇴근 신청: ShiftReport 저장 후 모달 오픈
  const handleCheckout = () => {
    if (currentUser) {
      (async () => {
        const myTasks = allTasks.filter(t => myPatients.some(p => p.id === t.patientId))
        const completedTaskIds = myTasks.filter(t => t.status === 'Completed').map(t => t.taskId)
        const pendingTasks = myTasks.filter(t => t.status === 'Pending')
        const handoffSummary = pendingTasks.length > 0
          ? pendingTasks.map(t => `${myPatients.find(p => p.id === t.patientId)?.name ?? t.patientId} — ${t.taskName} 미완료`).join('; ')
          : '모든 업무 완료'

        dispatch(saveShiftReport({
          reportId: `SR-${currentUser.id}-${Date.now()}`,
          shiftDate: new Date().toISOString(),
          shiftType: currentUser.shiftType,
          nurseId: currentUser.id,
          completedTaskIds,
          handoffSummary,
          notes: new Date().toLocaleString('ko-KR'),
        }))

        // 로컬 출석 상태에 퇴근 요청 표시
        const today = new Date().toISOString().slice(0,10)
        dispatch(requestCheckout({ nurseId: currentUser.id, date: today }))
        console.log('[DEBUG] 퇴근요청 디스패치됨', { nurseId: currentUser.id, date: today })

        // 알림 생성: 본인에게 퇴근 신청 접수 확인
        const notifId = `notif-checkout-${Date.now()}`
        dispatch(addNotification({ id: notifId, type: 'info', title: '퇴근 신청', message: '수간호사님께 퇴근 승인을 요청했습니다.', timestamp: Date.now() }))
        // 브로드캐스트로 다른 탭/클라이언트에 알림
        broadcast.send('attendance:request', { nurseId: currentUser.id, date: today, notifId })

        try {
          const res = await fetch('/api/attendance/checkout', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nurseId: currentUser.id, shiftType: currentUser.shiftType }),
          })
          const data = await res.json()
          if (!res.ok) {
            console.error('퇴근신청 실패:', data)
          }
        } catch (e) {
          console.error('퇴근신청 통신 실패', e)
        }
      })()
      // 보고서 저장 후 출석(퇴근신청) 페이지로 이동
      navigate('/attendance')
    }
  }

  return (
    <div>
      <AlertBanner patients={myPatients} />
      <main style={{ padding: '22px 24px 40px' }}>
        <StatCards patients={myPatients} allTasks={allTasks} />
        <QuickMenu allTasksDone={allTasksDone} onCheckout={handleCheckout} />
        <PatientGrid patients={myPatients} getPatientTasks={getPatientTasks} />
      </main>
      {currentUser && (
        <ShiftReportModal
          isOpen={reportOpen}
          onClose={() => setReportOpen(false)}
          nurse={currentUser}
          patients={myPatients}
          tasks={allTasks.filter(t => myPatients.some(p => p.id === t.patientId))}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────
// DashboardPage — 역할에 따라 분기
// ─────────────────────────────────────────
const DashboardPage: React.FC = () => {
  const dispatch  = useAppDispatch()
  const userRole  = useAppSelector(s => s.auth.userRole)
  const nurses    = useAppSelector(s => s.nurses.allNurses)
  const patients  = useAppSelector(s => s.patients.allPatients)

  // 수간호사: 필요한 데이터 미리 로드
  useEffect(() => {
    if (userRole !== 'HeadNurse') return
    const fetchAll = async () => {
      try {
        const [nRes, pRes, tRes] = await Promise.all([
          fetch('/api/nurses'),
          fetch('/api/patients'),
          fetch('/api/tasks'),
        ])
        dispatch(setNurses(await nRes.json()))
        dispatch(setPatients(await pRes.json()))
        dispatch(setTasks(await tRes.json()))
      } catch (e) {
        console.error(e)
      }
    }
    if (nurses.length === 0 || patients.length === 0) fetchAll()
  }, [dispatch, userRole, nurses.length, patients.length])

  if (userRole === 'HeadNurse') return <Navigate to="/head-nurse" replace />
  return <NurseDashboard />
}

export default DashboardPage
