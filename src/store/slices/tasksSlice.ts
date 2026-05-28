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
    addTask: (state, action: PayloadAction<NursingTask>) => {
      state.allTasks.push(action.payload)
    },
  },
})

export const { setTasks, toggleTask, addTask } = tasksSlice.actions
export default tasksSlice.reducer
