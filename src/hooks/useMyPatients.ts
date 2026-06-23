import { useAppSelector } from './useAppSelector'

export function useMyPatients() {
  const currentUser = useAppSelector(s => s.auth.currentUser)
  const allPatients = useAppSelector(s => s.patients.allPatients)
  const allTasks    = useAppSelector(s => s.tasks.allTasks)
  const todayKey = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })()
  const assignsToday = useAppSelector(s => s.assignments.byDate[todayKey] ?? {})

  const myPatients = allPatients
    .filter(p => {
      const a = assignsToday[p.id]
      if (a) {
        // assignments가 있으면 Day/Evening/Night 중 현재 유저가 포함된 경우
        return Object.values(a).includes(currentUser?.id ?? '')
      }
      // assignments 미로드 시 patient.assignedNurseId fallback
      return p.assignedNurseId === (currentUser?.id ?? '')
    })
    .sort((a, b) => {
      const order: Record<string, number> = { High: 0, Medium: 1, Low: 2 }
      return order[a.severity] - order[b.severity]
    })

  const getPatientTasks = (patientId: string) =>
    allTasks.filter(t => t.patientId === patientId)

  const getCompletionRate = (patientId: string) => {
    const tasks = getPatientTasks(patientId)
    if (tasks.length === 0) return 0
    const completed = tasks.filter(t => t.status === 'Completed').length
    return Math.round((completed / tasks.length) * 100)
  }

  return { myPatients, getPatientTasks, getCompletionRate }
}
