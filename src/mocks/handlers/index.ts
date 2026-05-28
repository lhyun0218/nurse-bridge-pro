import { http, HttpResponse } from 'msw'
import { mockNurses, mockPatients, mockTasks, mockInventory } from '../../data/mockData'

export const handlers = [
  // ── 인증 ──────────────────────────────────
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as { employeeId: string; password: string }
    const nurse = mockNurses.find(n => n.employeeId === body.employeeId)
    if (nurse && body.password === '1234') {
      return HttpResponse.json({ success: true, user: nurse })
    }
    return HttpResponse.json({ success: false, message: '사번 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 })
  }),

  // ── 간호사 ────────────────────────────────
  http.get('/api/nurses', () => {
    return HttpResponse.json(mockNurses)
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

  // ── 재고 ──────────────────────────────────
  http.get('/api/inventory', () => {
    return HttpResponse.json(mockInventory)
  }),
  http.patch('/api/inventory/:itemId/consume', async ({ params, request }) => {
    const body = await request.json() as { amount: number }
    const item = mockInventory.find(i => i.itemId === params.itemId)
    if (!item) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    item.quantity = Math.max(0, item.quantity - body.amount)
    item.status = item.quantity === 0 ? 'critical' : item.quantity < item.reorderPoint ? 'warning' : 'sufficient'
    return HttpResponse.json(item)
  }),
  http.post('/api/inventory/:itemId/request', ({ params }) => {
    const item = mockInventory.find(i => i.itemId === params.itemId)
    if (!item) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    return HttpResponse.json({ success: true, message: `${item.itemName} 청구 요청이 전송되었습니다.` })
  }),
]
