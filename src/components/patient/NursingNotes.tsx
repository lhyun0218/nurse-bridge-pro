import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LuPin, LuPinOff, LuTrash2, LuPlus, LuStickyNote,
} from 'react-icons/lu'
import { useAppDispatch } from '../../hooks/useAppDispatch'
import { useAppSelector } from '../../hooks/useAppSelector'
import { addNote, deleteNote, togglePinNote } from '../../store/slices/nursingNotesSlice'
import type { NoteCategory, NursingNote } from '../../types'

interface NursingNotesProps {
  patientId: string
}

const CATEGORY_CONFIG: Record<NoteCategory, { label: string; bg: string; color: string }> = {
  general:     { label: '일반',   bg: '#EBF4F8', color: '#2C6E8A' },
  observation: { label: '관찰',   bg: '#FEF3E2', color: '#D4860A' },
  medication:  { label: '투약',   bg: '#F0EBF8', color: '#6B3FA0' },
  procedure:   { label: '처치',   bg: '#FDECEA', color: '#C0392B' },
  education:   { label: '교육',   bg: '#E8F5EE', color: '#2E7D5E' },
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const diffMin = Math.floor((now.getTime() - ts) / 60000)
  if (diffMin < 1)  return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}시간 전`
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const NursingNotes: React.FC<NursingNotesProps> = ({ patientId }) => {
  const dispatch    = useAppDispatch()
  const currentUser = useAppSelector(s => s.auth.currentUser)
  const allNotes    = useAppSelector(s => s.nursingNotes.notes)

  const notes = allNotes.filter(n => n.patientId === patientId)
  // 고정 노트 먼저, 그다음 최신순
  const sorted = [
    ...notes.filter(n => n.isPinned),
    ...notes.filter(n => !n.isPinned),
  ]

  const [open, setOpen]       = useState(false)
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<NoteCategory>('general')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || !currentUser) return

    const note: NursingNote = {
      id:        `note-${Date.now()}`,
      patientId,
      nurseId:   currentUser.id,
      nurseName: currentUser.name,
      category,
      content:   content.trim(),
      timestamp: Date.now(),
      isPinned:  false,
    }
    dispatch(addNote(note))
    setContent('')
    setOpen(false)
  }

  return (
    <div style={{
      background: 'var(--color-surface)',
      borderRadius: '10px',
      boxShadow: '0 2px 12px rgba(44,110,138,.09)',
      padding: '20px',
    }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LuStickyNote style={{ width: '16px', height: '16px', color: 'var(--color-primary)' }} />
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>
            간호 노트
          </span>
          {notes.length > 0 && (
            <span style={{
              fontSize: '11px', fontWeight: 700, padding: '1px 7px',
              borderRadius: '10px', backgroundColor: 'var(--color-bg)',
              color: 'var(--color-muted)', border: '1px solid var(--color-border)',
            }}>
              {notes.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setOpen(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '7px 14px', borderRadius: '8px',
            border: 'none', cursor: 'pointer',
            backgroundColor: open ? 'var(--color-bg)' : 'var(--color-primary)',
            color: open ? 'var(--color-muted)' : '#fff',
            fontSize: '12px', fontWeight: 600,
            transition: 'all 0.15s',
          }}
        >
          <LuPlus style={{ width: '14px', height: '14px' }} />
          {open ? '취소' : '노트 추가'}
        </button>
      </div>

      {/* 작성 폼 */}
      <AnimatePresence>
        {open && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit}
            style={{ overflow: 'hidden', marginBottom: '16px' }}
          >
            <div style={{
              padding: '14px',
              background: 'var(--color-bg)',
              borderRadius: '10px',
              border: '1px solid var(--color-border)',
            }}>
              {/* 카테고리 선택 */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {(Object.keys(CATEGORY_CONFIG) as NoteCategory[]).map(cat => {
                  const cfg = CATEGORY_CONFIG[cat]
                  const isSelected = category === cat
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      style={{
                        padding: '4px 10px', borderRadius: '20px', cursor: 'pointer',
                        fontSize: '11px', fontWeight: 600,
                        border: isSelected ? `1.5px solid ${cfg.color}` : '1.5px solid var(--color-border)',
                        background: isSelected ? cfg.bg : 'transparent',
                        color: isSelected ? cfg.color : 'var(--color-muted)',
                        transition: 'all 0.15s',
                      }}
                    >
                      {cfg.label}
                    </button>
                  )
                })}
              </div>

              {/* 텍스트 입력 */}
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="간호 내용을 입력하세요... (활력징후 변화, 처치 내용, 환자 반응 등)"
                rows={3}
                style={{
                  width: '100%', padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  fontSize: '13px', lineHeight: 1.6,
                  resize: 'vertical', outline: 'none',
                  fontFamily: 'inherit', boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-primary)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--color-border)' }}
                autoFocus
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px', gap: '8px' }}>
                <button
                  type="submit"
                  disabled={!content.trim()}
                  style={{
                    padding: '8px 18px', borderRadius: '8px',
                    border: 'none', cursor: content.trim() ? 'pointer' : 'not-allowed',
                    backgroundColor: content.trim() ? 'var(--color-primary)' : 'var(--color-border)',
                    color: '#fff', fontSize: '13px', fontWeight: 600,
                    transition: 'background-color 0.15s',
                  }}
                >
                  저장
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* 노트 목록 */}
      {sorted.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '32px 16px',
          color: 'var(--color-muted)', fontSize: '13px',
        }}>
          <LuStickyNote style={{ width: '32px', height: '32px', margin: '0 auto 8px', opacity: 0.4 }} />
          <div>아직 작성된 노트가 없습니다</div>
          <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.7 }}>
            활력징후 변화, 처치 내용 등을 기록해 보세요
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <AnimatePresence initial={false}>
            {sorted.map(note => {
              const cfg = CATEGORY_CONFIG[note.category]
              return (
                <motion.div
                  key={note.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: note.isPinned ? 'rgba(44,110,138,0.04)' : 'var(--color-bg)',
                    border: note.isPinned
                      ? '1.5px solid rgba(44,110,138,0.25)'
                      : '1px solid var(--color-border)',
                    position: 'relative',
                  }}
                >
                  {/* 노트 헤더 */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '5px',
                        fontSize: '10px', fontWeight: 700,
                        background: cfg.bg, color: cfg.color,
                      }}>
                        {cfg.label}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)' }}>
                        {note.nurseName}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                        {formatTime(note.timestamp)}
                      </span>
                      {note.isPinned && (
                        <span style={{ fontSize: '10px', color: 'var(--color-primary)', fontWeight: 600 }}>
                          📌 고정됨
                        </span>
                      )}
                    </div>

                    {/* 액션 버튼 */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => dispatch(togglePinNote(note.id))}
                        style={{
                          width: '28px', height: '28px', borderRadius: '6px',
                          border: 'none', background: 'none', cursor: 'pointer',
                          color: note.isPinned ? 'var(--color-primary)' : 'var(--color-muted)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'background 0.15s',
                        }}
                        title={note.isPinned ? '고정 해제' : '고정'}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-border)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                      >
                        {note.isPinned
                          ? <LuPinOff style={{ width: '14px', height: '14px' }} />
                          : <LuPin    style={{ width: '14px', height: '14px' }} />
                        }
                      </button>

                      {/* 삭제 확인 */}
                      {deleteId === note.id ? (
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', color: '#C0392B' }}>삭제?</span>
                          <button
                            onClick={() => { dispatch(deleteNote(note.id)); setDeleteId(null) }}
                            style={{
                              padding: '2px 8px', borderRadius: '5px',
                              border: 'none', background: '#C0392B', color: '#fff',
                              fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                            }}
                          >확인</button>
                          <button
                            onClick={() => setDeleteId(null)}
                            style={{
                              padding: '2px 8px', borderRadius: '5px',
                              border: '1px solid var(--color-border)', background: 'none',
                              color: 'var(--color-muted)',
                              fontSize: '11px', cursor: 'pointer',
                            }}
                          >취소</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteId(note.id)}
                          style={{
                            width: '28px', height: '28px', borderRadius: '6px',
                            border: 'none', background: 'none', cursor: 'pointer',
                            color: 'var(--color-muted)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'background 0.15s, color 0.15s',
                          }}
                          title="삭제"
                          onMouseEnter={e => { e.currentTarget.style.background = '#FDECEA'; e.currentTarget.style.color = '#C0392B' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--color-muted)' }}
                        >
                          <LuTrash2 style={{ width: '14px', height: '14px' }} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 노트 내용 */}
                  <p style={{
                    margin: 0, fontSize: '13px',
                    color: 'var(--color-text)', lineHeight: 1.65,
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  }}>
                    {note.content}
                  </p>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

export default NursingNotes
