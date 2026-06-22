import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ReassignSuggestion } from '../../utils/overtime'

interface ReassignBannerProps {
  suggestion: ReassignSuggestion | null
  onApply: () => void
}

const ReassignBanner: React.FC<ReassignBannerProps> = ({ suggestion, onApply }) => {
  const [hovered, setHovered] = useState(false)

  return (
    <AnimatePresence>
      {suggestion && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '10px',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontSize: '13px', color: '#1A2B38', lineHeight: 1.5 }}>
            {suggestion.message}
          </div>
          <button
            onClick={onApply}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
              padding: '10px 20px',
              background: hovered ? 'var(--color-primary-d)' : 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'background .15s',
              minHeight: '44px',
            }}
          >
            🤖 자동 재배치 적용
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ReassignBanner
