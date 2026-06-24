import { http, HttpResponse } from 'msw'
import { mockNurses, mockPatients, mockTasks, mockPrescriptions } from '../../data/mockData'
import { autoAssignPatients } from '../../utils/autoAssignPatients'

// ── Attendance 헬퍼: Redux persist 키('nb:persist:v1')와 동일한 저장소를 사용 ──
const PERSIST_KEY = 'nb:persist:v1'

function readAttendanceRecords(): any[] {
  try {
    const raw = localStorage.getItem(PERSIST_KEY)
    if (!raw) return []
    const p = JSON.parse(raw)
    return Array.isArray(p?.attendance?.records) ? p.attendance.records : []
  } catch (e) {}
  return []
}

function writeAttendanceRecords(records: any[]) {
  try {
    const raw = localStorage.getItem(PERSIST_KEY)
    const p = raw ? JSON.parse(raw) : {}
    p.attendance = { ...(p.attendance ?? {}), records }
    localStorage.setItem(PERSIST_KEY, JSON.stringify(p))
  } catch (e) {}
}

export const handlers = [
  // ── 인증 ──────────────────────────────────
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as { employeeId: string; password: string }
    const nurse = mockNurses.find(n => n.employeeId === body.employeeId)
    if (!nurse || body.password !== '1234') {
      return HttpResponse.json({ success: false, message: '사번 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 })
    }
    if (nurse.status !== 'Active') {
      return HttpResponse.json({ success: false, message: '비활성 계정입니다.' }, { status: 403 })
    }
    // 교대 확인은 클라이언트(모달)에서 처리 — 서버는 인증만 담당
    return HttpResponse.json({ success: true, user: nurse })
  }),

  // ── 간호사 ────────────────────────────────
  http.get('/api/nurses', () => {
    return HttpResponse.json(mockNurses)
  }),
  // 환자 배치 (자동)
  http.get('/api/assignments', () => {
    const map = autoAssignPatients(mockNurses, mockPatients)
    return HttpResponse.json(map)
  }),
  http.get('/api/nurses/:id', ({ params }) => {
    const nurse = mockNurses.find(n => n.id === params.id)
    if (!nurse) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    return HttpResponse.json(nurse)
  }),

  // ── 환자 ──────────────────────────────────
  http.get('/api/patients', () => {
    return HttpResponse.json(mockPatients)
  }),
  http.get('/api/patients/:id', ({ params }) => {
    const patient = mockPatients.find(p => p.id === params.id)
    if (!patient) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    return HttpResponse.json(patient)
  }),

  // ── 간호 업무 ─────────────────────────────
  http.get('/api/tasks', () => {
    return HttpResponse.json(mockTasks)
  }),
  http.get('/api/tasks/patient/:patientId', ({ params }) => {
    const tasks = mockTasks.filter(t => t.patientId === params.patientId)
    return HttpResponse.json(tasks)
  }),
  http.patch('/api/tasks/:taskId/toggle', ({ params }) => {
    const task = mockTasks.find(t => t.taskId === params.taskId)
    if (!task) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    task.status = task.status === 'Pending' ? 'Completed' : 'Pending'
    return HttpResponse.json(task)
  }),

  // ── 근태 ──────────────────────────────────────
  http.post('/api/attendance/checkout', async ({ request }) => {
    const body = await request.json() as any
    const nurse = mockNurses.find(n => n.id === body.nurseId)
    if (!nurse) return HttpResponse.json({ success: false, message: '간호사 없음' }, { status: 404 })
    const d = new Date()
    const today = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    const records = readAttendanceRecords()
    const rec = records.find((r: any) => r.nurseId === nurse.id && r.date === today)
    if (rec) {
      rec.checkoutRequested = true
    } else {
      records.push({ nurseId: nurse.id, date: today, checkoutRequested: true })
    }
    writeAttendanceRecords(records)
    return HttpResponse.json({ success: true })
  }),
  http.get('/api/attendance', ({ request }) => {
    const params = new URL(request.url).searchParams
    const nurseId = params.get('nurseId')
    const records = readAttendanceRecords()
    const out = nurseId ? records.filter((r: any) => r.nurseId === nurseId) : records
    return HttpResponse.json(out)
  }),
  http.post('/api/attendance/approve', async ({ request }) => {
    const body = await request.json() as any
    const { nurseId, date } = body
    const records = readAttendanceRecords()
    const rec = records.find((r: any) => r.nurseId === nurseId && r.date === date)
    if (rec) {
      rec.checkoutApproved = true
    } else {
      records.push({ nurseId, date, checkoutApproved: true })
    }
    writeAttendanceRecords(records)
    return HttpResponse.json({ success: true })
  }),
  // ── 처방 ──────────────────────────────────────
  http.get('/api/prescriptions', ({ request }) => {
    const params = new URL(request.url).searchParams
    const patientId = params.get('patientId')
    const out = patientId
      ? mockPrescriptions.filter(p => p.patientId === patientId)
      : mockPrescriptions
    return HttpResponse.json(out)
  }),
  http.patch('/api/prescriptions/:id/verify', ({ params }) => {
    const rx = mockPrescriptions.find(p => p.id === params.id)
    if (!rx) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    rx.verified = true
    return HttpResponse.json(rx)
  }),
  http.patch('/api/prescriptions/:id/discontinue', ({ params }) => {
    const rx = mockPrescriptions.find(p => p.id === params.id)
    if (!rx) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    rx.status = 'discontinued'
    return HttpResponse.json(rx)
  }),
]
