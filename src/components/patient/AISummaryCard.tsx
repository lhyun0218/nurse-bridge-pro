import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface AISummaryCardProps {
  summary: string[]
  generatedAt?: string
}

const AISummaryCard: React.FC<AISummaryCardProps> = ({ summary, generatedAt }) => {
  const [loading, setLoading] = useState(true)
  const [displayed, setDisplayed] = useState<string[]>([])

  useEffect(() => {
    setLoading(true)
    setDisplayed([])
    const timer = setTimeout(() => {
      setDisplayed(summary)
      setLoading(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [summary])

  const timeStr = generatedAt
    ? new Date(generatedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #EBF4F8, #F4F7F9)',
        border: '1px solid #C5DDE8',
        borderRadius: '10px',
        padding: '18px',
        marginBottom: '14px',
      }}
    >
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <div
          style={{
            width: '32px', height: '32px',
            background: '#2C6E8A', borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '15px', flexShrink: 0,
          }}
        >
          🤖
        </div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#2C6E8A' }}>AI 인수인계 요약</div>
          <div style={{ fontSize: '11px', color: '#6B8090' }}>이전 근무조 기록 기반 · 오늘 {timeStr} 생성</div>
        </div>
      </div>

      {/* 로딩 */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6B8090', fontSize: '13px' }}>
          <div
            style={{
              width: '16px', height: '16px',
              border: '2px solid #DDE3E8', borderTop: '2px solid #2C6E8A',
              borderRadius: '50%', animation: 'spin 0.8s linear infinite',
            }}
          />
          AI 요약 생성 중...
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* 요약 목록 */}
      <AnimatePresence>
        {!loading && (
          <motion.ul
            style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '7px' }}
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
          >
            {displayed.map((line, i) => (
              <motion.li
                key={i}
                variants={{
                  hidden: { opacity: 0, x: -10 },
                  visible: { opacity: 1, x: 0 },
                }}
                style={{ display: 'flex', gap: '8px', fontSize: '13px', color: '#1A2B38', lineHeight: 1.5 }}
              >
                <span style={{ color: '#2C6E8A', fontWeight: 700, flexShrink: 0 }}>✓</span>
                {line}
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AISummaryCard
