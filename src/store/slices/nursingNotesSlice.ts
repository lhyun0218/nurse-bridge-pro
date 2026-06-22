import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { NursingNote } from '../../types'

interface NursingNotesState {
  notes: NursingNote[]
}

const initialState: NursingNotesState = {
  notes: [],
}

const nursingNotesSlice = createSlice({
  name: 'nursingNotes',
  initialState,
  reducers: {
    addNote: (state, action: PayloadAction<NursingNote>) => {
      state.notes.unshift(action.payload)  // 최신순 앞에 추가
    },
    deleteNote: (state, action: PayloadAction<string>) => {
      state.notes = state.notes.filter(n => n.id !== action.payload)
    },
    togglePinNote: (state, action: PayloadAction<string>) => {
      const note = state.notes.find(n => n.id === action.payload)
      if (note) note.isPinned = !note.isPinned
    },
    updateNote: (state, action: PayloadAction<{ id: string; content: string }>) => {
      const note = state.notes.find(n => n.id === action.payload.id)
      if (note) note.content = action.payload.content
    },
    // set notes for hydration
    setNotes: (state, action: PayloadAction<NursingNote[]>) => {
      state.notes = action.payload
    },
  },
})

export const { addNote, deleteNote, togglePinNote, updateNote, setNotes } = nursingNotesSlice.actions
export default nursingNotesSlice.reducer
