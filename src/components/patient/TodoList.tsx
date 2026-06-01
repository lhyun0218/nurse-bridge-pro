import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppDispatch } from '../../hooks/useAppDispatch'
import { toggleTask } from '../../store/slices/tasksSlice'
import type { NursingTask, TaskCategory } from '../../types'

interface TodoListProps {
  tasks: NursingTask[]
}

const catStyles: Record<TaskCategory, { bg: string; color: string; label: string }> = {
  Monitoring:    { bg: '#EBF4F8', color: '#2C6E8A', label: '모니터링' },
  Medication:    { bg: '#FEF3E2', color: '#D4860A', label: '투약' },
  Hygiene:       { bg: '#E8F5EE', color: '#2E7D5E', label: '위생' },
  Documentation: { bg: '#F0F4F7', color: '#6B8090', label: '기록' },
}

const TodoList: React.FC<TodoListProps> = ({ tasks }) => {
  const dispatch = useAppDispatch()
  const completed = tasks.filter(t => t.status === 'Completed').length
  const total = tasks.length
  const rate = total === 0 ? 0 : Math.round((completed / total) * 100)
  const barColor = rate >= 80 ? '#2E7D5E' : rate >= 50 ? '#2C6E8A' : '#D4860A'

  return (
    <div>
      {/* 완료율 */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
          <span style={{ fontSize: '13px', fontWeight: 500, color: '#1A2B38' }}>완료율</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#2C6E8A' }}>
            {completed} / {total} ({rate}%)
          </span>
        </div>
        <div style={{ height: '6px', background: '#DDE3E8', borderRadius: '3px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${rate}%`, height: '100%',
              background: barColor, borderRadius: '3px',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Todo 항목 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
        {tasks.map(task => {
          const isDone = task.status === 'Completed'
          const cat = catStyles[task.category] ?? catStyles.Documentation
          return (
            <div
              key={task.taskId}
              onClick={() => dispatch(toggleTask(task.taskId))}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '11px 13px',
                background: '#F0F4F7', borderRadius: '8px',
                border: '1.5px solid transparent',
                cursor: 'pointer', transition: 'all .15s',
                opacity: isDone ? 0.6 : 1,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = '#DDE3E8'
                ;(e.currentTarget as HTMLDivElement).style.background = '#fff'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'transparent'
                ;(e.currentTarget as HTMLDivElement).style.background = '#F0F4F7'
              }}
            >
              {/* 체크박스 */}
              <div
                style={{
                  width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                  border: isDone ? 'none' : '2px solid #DDE3E8',
                  background: isDone ? '#2E7D5E' : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <AnimatePresence>
                  {isDone && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      style={{ color: '#fff', fontSize: '11px', fontWeight: 700 }}
                    >
                      ✓
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              {/* 업무명 */}
              <div
                style={{
                  flex: 1, fontSize: '13px', color: '#1A2B38',
                  textDecoration: isDone ? 'line-through' : 'none',
                }}
              >
                {task.taskName}
              </div>

              {/* 카테고리 배지 */}
              <span
                style={{
                  fontSize: '10px', fontWeight: 500, padding: '2px 7px',
                  borderRadius: '5px', whiteSpace: 'nowrap',
                  background: cat.bg, color: cat.color,
                }}
              >
                {cat.label}
              </span>

              {/* 소요시간 */}
              <span
                style={{
                  fontSize: '11px', color: '#6B8090', whiteSpace: 'nowrap',
                  background: '#fff', padding: '2px 7px',
                  borderRadius: '5px', border: '1px solid #DDE3E8',
                }}
              >
                {task.estimatedMinutes}분
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TodoList
