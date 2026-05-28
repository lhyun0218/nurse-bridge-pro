import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import patientsReducer from './slices/patientsSlice'
import tasksReducer from './slices/tasksSlice'
import inventoryReducer from './slices/inventorySlice'
import nursesReducer from './slices/nursesSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    patients: patientsReducer,
    tasks: tasksReducer,
    inventory: inventoryReducer,
    nurses: nursesReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
