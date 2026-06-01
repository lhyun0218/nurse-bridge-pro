import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { ToastItem } from '../../hooks/useToast'

interface ToastProps {
  toasts: ToastItem[]
  onRemove: (id: string) => void
}

const toastConfig = {
  success: {
    bg: '#E8F5EE',
    color: '#2E7D5E',
    border: '1px solid #b8ddc9',
    icon: '✓',
  },
  error: {
    bg: '#FDECEA',
    color: '#C0392B',
    border: '1px solid #f5c6c2',
    icon: '✕',
  },
  info: {
    bg: '#EBF4F8',
    color: '#2C6E8A',
    border: '1px solid #b3d4e3',
    icon: 'ℹ',
  },
}

const ToastItem: React.FC<{ toast: ToastItem; onRemove: (id: string) => void }> = ({
  toast,
  onRemove,
}) => {
  const cfg = toastConfig[toast.type]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.95 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        backgroundColor: cfg.bg,
        color: cfg.color,
        border: cfg.border,
        borderRadius: '10px',
        padding: '12px 16px',
        minWidth: '260px',
        maxWidth: '360px',
        boxShadow: '0 4px 16px rgba(44,110,138,.12)',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
      }}
      onClick={() => onRemove(toast.id)}
    >
      <span
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: cfg.color,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {cfg.icon}
      </span>
      <span style={{ flex: 1 }}>{toast.message}</span>
    </motion.div>
  )
}

const Toast: React.FC<ToastProps> = ({ toasts, onRemove }) => {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        alignItems: 'flex-end',
      }}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  )
}

export default Toast
