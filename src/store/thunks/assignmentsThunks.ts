import type { ThunkAction } from 'redux-thunk'
import type { RootState } from '..'
import type { AnyAction } from 'redux'
import { setAssignmentsBulk } from '../slices/assignmentsSlice'
import { autoAssignPatients } from '../../utils/autoAssignPatients'
import { addNotification } from '../slices/notificationsSlice'
import { setCoverage } from '../slices/coverageSlice'

// Generate assignments for every day of the given month using scheduleRows
export const generateAssignmentsForMonth = (year: number, month: number, minPerShift = 1): ThunkAction<void, RootState, unknown, AnyAction> =>
  (dispatch, getState) => {
    const state = getState()
    const nurses = state.nurses.allNurses
    const patients = state.patients.allPatients
    const key = `${year}-${String(month).padStart(2, '0')}`
    const scheduleRows = state.schedule.saved[key] ?? []

    const days = new Date(year, month, 0).getDate()
    const result: Record<string, Record<string, { Day?: string; Evening?: string; Night?: string }>> = {}

    for (let day = 1; day <= days; day++) {
      const dateIndex = day - 1
      const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const assigns = autoAssignPatients(nurses, patients, { balance: true, scheduleRows, dateIndex })
      result[dateKey] = assigns
    }

    dispatch(setAssignmentsBulk(result))

    // compute coverage counts and holes per date
    try {
      const perDateShiftCounts: Record<string, { Day: number; Evening: number; Night: number }> = {}
      const holes: Array<{ date: string; shift: 'Day'|'Evening'|'Night'; count: number; required: number }> = []
      for (const dateKey of Object.keys(result)) {
        const counts = { Day: 0, Evening: 0, Night: 0 }
        const assignsForDate = result[dateKey]
        for (const pid of Object.keys(assignsForDate)) {
          const a = assignsForDate[pid]
          if (a.Day) counts.Day++
          if (a.Evening) counts.Evening++
          if (a.Night) counts.Night++
        }
        perDateShiftCounts[dateKey] = counts
        for (const s of ['Day', 'Evening', 'Night'] as const) {
          if ((counts as any)[s] < minPerShift) {
            holes.push({ date: dateKey, shift: s, count: (counts as any)[s], required: minPerShift })
          }
        }
      }
      dispatch(setCoverage({ key, perDateShiftCounts, holes }))
    } catch (e) {
      console.warn('coverage computation failed', e)
    }

    // Generate notifications for today where the usual assigned nurse is OFF
    try {
      const now = new Date()
      const todayKey = `${now.getFullYear()}-${String(month).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      const todayAssigns = result[todayKey] ?? {}
      // for each patient, if their baseline assignedNurseId is not on duty today and someone else is assigned, notify
      for (const p of patients) {
        const baseline = p.assignedNurseId
        const assignedToday = todayAssigns[p.id]
        if (!assignedToday) continue
        const assignedIds = new Set(Object.values(assignedToday))
        if (baseline && !Array.from(assignedIds).includes(baseline)) {
          // baseline nurse is not covering today for this patient -> create a notification
          const tempAssignee = Array.from(assignedIds)[0] ?? null
          if (tempAssignee) {
            dispatch(addNotification({
              id: `temp-manage-${todayKey}-${p.id}`,
              type: 'info',
              title: '오늘 임시 관리 발생',
              message: `${p.name} 환자는 담당 간호사(${baseline})가 휴무입니다. 오늘 임시 관리: ${tempAssignee}`,
              timestamp: Date.now(),
              patientId: p.id,
              patientName: p.name,
              roomNumber: p.roomNumber,
            }))
          }
        }
      }
    } catch (e) {
      // non-fatal
      console.warn('temp assignment notification generation failed', e)
    }
  }

export default generateAssignmentsForMonth
