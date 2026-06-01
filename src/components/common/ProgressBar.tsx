import React from 'react'

interface ProgressBarProps {
  percentage: number
  height?: number
  showLabel?: boolean
  /** showLabel=true 일 때 "X/Y 완료" 형식으로 표시하기 위한 값 */
  completed?: number
  total?: number
}

function getBarColor(percentage: number): string {
  if (percentage >= 80) return '#2E7D5E'   // ok
  if (percentage >= 50) return '#2C6E8A'   // primary
  return '#D4860A'                          // warn
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  height = 6,
  showLabel = false,
  completed,
  total,
}) => {
  const clamped = Math.min(100, Math.max(0, percentage))
  const color = getBarColor(clamped)

  return (
    <div style={{ width: '100%' }}>
      {showLabel && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#6B8090',
            marginBottom: '4px',
          }}
        >
          {completed !== undefined && total !== undefined ? (
            <span>{completed}/{total} 완료</span>
          ) : (
            <span>{clamped}%</span>
          )}
          <span>{clamped}%</span>
        </div>
      )}
      <div
        style={{
          width: '100%',
          height: `${height}px`,
          backgroundColor: '#DDE3E8',
          borderRadius: '3px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${clamped}%`,
            height: '100%',
            backgroundColor: color,
            borderRadius: '3px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  )
}

export default ProgressBar
