import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppDispatch } from '../hooks/useAppDispatch'
import { useAppSelector } from '../hooks/useAppSelector'
import { useMyPatients } from '../hooks/useMyPatients'
import { toggleTask } from '../store/slices/tasksSlice'
import type { NursingTask, TaskCategory, Severity } from '../types'

type StatusFilter = 'All' | 'Pending' | 'Completed'

const catStyles: Record<TaskCategory, { bg: string; color: string; label: string }> = {
  Monitoring:    { bg: '#EBF4F8', color: '#2C6E8A', label: '모니터링' },
  Medication:    { bg: '#FEF3E2', color: '#D4860A', label: '투약' },
  Hygiene:       { bg: '#E8F5EE', color: '#2E7D5E', label: '위생' },
  Documentation: { bg: '#F0F4F7', color: '#6B8090', label: '기록' },
}

const severityColor: Record<Severity, string> = {
  High:   '#C0392B',
  Medium: '#D4860A',
  Low:    '#2E7D5E',
}

const TodoPage: React.FC = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { myPatients, getPatientTasks } = useMyPatients()
  const allPatients = useAppSelector(s => s.patients.allPatients)
  const loading = allPatients.length === 0

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All')
  const [expandedPatients, setExpandedPatients] = useState<Set<string>>(
    () => new Set<string>(), // 기본 모두 접힘
  )
  const [isAllExpanded, setIsAllExpanded] = useState(false)

  // 모든 할 일 수집
  const allMyTasks = myPatients.flatMap(p => getPatientTasks(p.id))
  const pendingAll   = allMyTasks.filter(t => t.status === 'Pending').length
  const completedAll = allMyTasks.filter(t => t.status === 'Completed').length
  const totalAll     = allMyTasks.length
  const overallRate  = totalAll === 0 ? 0 : Math.round((completedAll / totalAll) * 100)
  const barColor     = overallRate >= 80 ? '#2E7D5E' : overallRate >= 50 ? '#2C6E8A' : '#D4860A'

  const togglePatient = (id: string) => {
    setExpandedPatients(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleToggleAll = () => {
    if (isAllExpanded) {
      setExpandedPatients(new Set())
    } else {
      setExpandedPatients(new Set(myPatients.map(p => p.id)))
    }
    setIsAllExpanded(!isAllExpanded)
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: 'calc(100vh - 58px)', background: 'var(--color-bg)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px', height: '40px',
            border: '3px solid #DDE3E8', borderTop: '3px solid #2C6E8A',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite',
            margin: '0 auto 12px',
          }} />
          <p style={{ color: '#6B8090', fontSize: '14px' }}>할 일 목록 로딩 중...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ padding: '22px 24px 40px' }}>
      {/* 페이지 헤더 */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{
          fontSize: '20px', fontWeight: 700,
          color: 'var(--color-text)', marginBottom: '4px',
        }}>
          오늘의 Todo
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
          담당 환자 {myPatients.length}명 · 전체 {totalAll}개 업무
        </p>
      </div>

      {/* 전체 진행률 카드 */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>
            전체 완료율
          </span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: barColor }}>
            {completedAll} / {totalAll} ({overallRate}%)
          </span>
        </div>
        <div style={{ height: '8px', background: 'var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{
            width: `${overallRate}%`, height: '100%',
            background: barColor, borderRadius: '4px',
            transition: 'width 0.4s ease',
          }} />
        </div>
        <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
          <span style={{ fontSize: '12px', color: '#D4860A' }}>⏳ 미완료 {pendingAll}개</span>
          <span style={{ fontSize: '12px', color: '#2E7D5E' }}>✅ 완료 {completedAll}개</span>
        </div>
      </div>

      {/* 필터 + 전체 펼치기 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '8px', marginBottom: '16px', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['All', 'Pending', 'Completed'] as StatusFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              style={{
                padding: '5px 14px', borderRadius: '20px',
                fontSize: '12px', fontWeight: 500,
                border: statusFilter === f ? '1.5px solid #2C6E8A' : '1.5px solid var(--color-border)',
                background: statusFilter === f ? '#EBF4F8' : 'var(--color-surface)',
                color: statusFilter === f ? '#2C6E8A' : 'var(--color-muted)',
                cursor: 'pointer', transition: 'all .15s',
              }}
            >
              {f === 'All' ? '전체' : f === 'Pending' ? '⏳ 미완료' : '✅ 완료'}
            </button>
          ))}
        </div>
        <button
          onClick={handleToggleAll}
          style={{
            padding: '5px 14px', borderRadius: '8px',
            fontSize: '12px', fontWeight: 500,
            border: '1.5px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-muted)',
            cursor: 'pointer', transition: 'all .15s',
          }}
        >
          {isAllExpanded ? '▲ 전체 접기' : '▼ 전체 펼치기'}
        </button>
      </div>

      {/* 환자별 Todo 그룹 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {myPatients.map(patient => {
          const tasks = getPatientTasks(patient.id)
          const filtered = tasks.filter(t =>
            statusFilter === 'All'       ? true :
            statusFilter === 'Pending'   ? t.status === 'Pending' :
                                          t.status === 'Completed'
          )
          const done  = tasks.filter(t => t.status === 'Completed').length
          const total = tasks.length
          const rate  = total === 0 ? 0 : Math.round((done / total) * 100)
          const isExpanded = expandedPatients.has(patient.id)
          const sColor = severityColor[patient.severity]

          return (
            <div
              key={patient.id}
              style={{
                background: 'var(--color-surface)',
                border: '1.5px solid var(--color-border)',
                borderRadius: '12px',
                overflow: 'hidden',
                transition: 'border-color 0.15s',
              }}
            >
              {/* 환자 헤더 (클릭으로 펼치기/접기) */}
              <button
                onClick={() => togglePatient(patient.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '13px 16px', background: 'transparent', border: 'none',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                {/* 중증도 점 */}
                <span style={{
                  width: '10px', height: '10px', borderRadius: '50%',
                  background: sColor, flexShrink: 0,
                }} />

                {/* 이름 + 병실 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '14px', fontWeight: 600,
                    color: 'var(--color-text)',
                    display: 'flex', alignItems: 'center', gap: '6px',
                  }}>
                    {patient.name}
                    <span style={{
                      fontSize: '11px', color: 'var(--color-muted)',
                      fontWeight: 400,
                    }}>
                      {patient.roomNumber}
                    </span>
                    <span style={{
                      fontSize: '10px', padding: '1px 6px', borderRadius: '5px',
                      background: `${sColor}18`, color: sColor,
                      fontWeight: 600,
                    }}>
                      {patient.severity}
                    </span>
                  </div>
                  {/* 미니 진행 바 */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px',
                  }}>
                    <div style={{
                      flex: 1, height: '4px', background: 'var(--color-border)',
                      borderRadius: '2px', overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${rate}%`, height: '100%',
                        background: rate >= 80 ? '#2E7D5E' : rate >= 50 ? '#2C6E8A' : '#D4860A',
                        borderRadius: '2px', transition: 'width 0.3s ease',
                      }} />
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--color-muted)', flexShrink: 0 }}>
                      {done}/{total}
                    </span>
                  </div>
                </div>

                {/* 미완료 배지 */}
                {tasks.filter(t => t.status === 'Pending').length > 0 && (
                  <span style={{
                    flexShrink: 0, background: '#D4860A', color: '#fff',
                    fontSize: '11px', fontWeight: 700,
                    padding: '2px 8px', borderRadius: '10px',
                  }}>
                    {tasks.filter(t => t.status === 'Pending').length}
                  </span>
                )}

                {/* 환자 상세 이동 버튼 */}
                <button
                  onClick={e => { e.stopPropagation(); navigate(`/patient/${patient.id}`) }}
                  style={{
                    flexShrink: 0, padding: '4px 8px', borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg)',
                    color: 'var(--color-muted)', fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  상세 →
                </button>

                {/* 펼치기 아이콘 */}
                <span style={{
                  flexShrink: 0, color: 'var(--color-muted)', fontSize: '12px',
                  transition: 'transform 0.2s',
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                }}>
                  ▼
                </span>
              </button>

              {/* 펼쳐지는 Todo 목록 */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{
                      borderTop: '1px solid var(--color-border)',
                      padding: '12px 16px 14px',
                      display: 'flex', flexDirection: 'column', gap: '7px',
                    }}>
                      {filtered.length === 0 ? (
                        <div style={{
                          textAlign: 'center', padding: '20px',
                          color: 'var(--color-muted)', fontSize: '13px',
                        }}>
                          {statusFilter === 'Pending' ? '모든 업무가 완료됐습니다 ✅' : '완료된 업무가 없습니다'}
                        </div>
                      ) : (
                        filtered.map(task => <TodoItem key={task.taskId} task={task} onToggle={() => dispatch(toggleTask(task.taskId))} />)
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}

        {myPatients.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '52px 24px',
            background: 'var(--color-surface)',
            borderRadius: '12px',
            border: '1.5px dashed var(--color-border)',
          }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>📋</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '6px' }}>
              담당 환자가 없습니다
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
              현재 배정된 환자가 없습니다
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/** 단일 Todo 아이템 */
const TodoItem: React.FC<{ task: NursingTask; onToggle: () => void }> = ({ task, onToggle }) => {
  const isDone = task.status === 'Completed'
  const cat    = catStyles[task.category] ?? catStyles.Documentation

  return (
    <div
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '11px 13px',
        background: isDone ? 'var(--color-bg)' : 'var(--color-surface)',
        borderRadius: '8px',
        border: `1.5px solid ${isDone ? 'var(--color-border)' : 'transparent'}`,
        cursor: 'pointer', transition: 'all .15s',
        opacity: isDone ? 0.65 : 1,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = '#2C6E8A'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = isDone ? 'var(--color-border)' : 'transparent'
      }}
    >
      {/* 체크 원 */}
      <div style={{
        width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
        border: isDone ? 'none' : '2px solid var(--color-border)',
        background: isDone ? '#2E7D5E' : 'var(--color-surface)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.15s',
      }}>
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

      <span style={{
        flex: 1, fontSize: '13px', color: 'var(--color-text)',
        textDecoration: isDone ? 'line-through' : 'none',
      }}>
        {task.taskName}
      </span>

      <span style={{
        fontSize: '10px', fontWeight: 500, padding: '2px 7px',
        borderRadius: '5px', whiteSpace: 'nowrap',
        background: cat.bg, color: cat.color,
      }}>
        {cat.label}
      </span>

      <span style={{
        fontSize: '11px', color: 'var(--color-muted)', whiteSpace: 'nowrap',
        background: 'var(--color-bg)', padding: '2px 7px',
        borderRadius: '5px', border: '1px solid var(--color-border)',
      }}>
        {task.estimatedMinutes}분
      </span>
    </div>
  )
}

export default TodoPage
