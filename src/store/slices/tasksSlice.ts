import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { NursingTask } from '../../types'

interface TasksState {
  allTasks: NursingTask[]
}

const initialState: TasksState = {
  allTasks: [],
}

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setTasks: (state, action: PayloadAction<NursingTask[]>) => {
      state.allTasks = action.payload
    },
    toggleTask: (state, action: PayloadAction<string>) => {
      const task = state.allTasks.find(t => t.taskId === action.payload)
      if (task) {
        task.status = task.status === 'Pending' ? 'Completed' : 'Pending'
      }
    },
    completeTaskById: (state, action: PayloadAction<string>) => {
      const task = state.allTasks.find(t => t.taskId === action.payload)
      if (task) {
        task.status = 'Completed'
      }
    },
    completeMultipleTasks: (state, action: PayloadAction<string[]>) => {
      action.payload.forEach(taskId => {
        const task = state.allTasks.find(t => t.taskId === taskId)
        if (task) {
          task.status = 'Completed'
        }
      })
    },
    addTask: (state, action: PayloadAction<NursingTask>) => {
      state.allTasks.push(action.payload)
    },
  },
})

export const { setTasks, toggleTask, completeTaskById, completeMultipleTasks, addTask } = tasksSlice.actions
export default tasksSlice.reducer
