import React from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts'

interface SeverityData {
  name: string
  value: number
  color: string
}

interface SeverityPieChartProps {
  data: SeverityData[]
  total: number
}

const SeverityPieChart: React.FC<SeverityPieChartProps> = ({ data, total }) => {
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: '10px',
      boxShadow: '0 2px 12px rgba(44,110,138,.09)', padding: '20px',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        fontSize: '11px', fontWeight: 700, color: '#6B8090',
        textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '14px',
      }}>
        🩺 환자 중증도 분포
      </div>

      <div style={{ position: 'relative', width: '100%', height: 200 }}>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [
                `${value}명 (${total > 0 ? Math.round((Number(value) / total) * 100) : 0}%)`,
                name,
              ]}
              contentStyle={{ borderRadius: '8px', border: '1px solid #DDE3E8', fontSize: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* 도넛 중앙 텍스트 */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center', pointerEvents: 'none',
        }}>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#1A2B38' }}>{total}</div>
          <div style={{ fontSize: '10px', color: '#6B8090' }}>총 환자</div>
        </div>
      </div>

      {/* 범례 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
        {data.map(item => (
          <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
            <span style={{ color: '#6B8090', flex: 1 }}>
              {item.name === 'High' ? 'High (위험)' : item.name === 'Medium' ? 'Medium (주의)' : 'Low (안정)'}
            </span>
            <span style={{ fontWeight: 600, color: '#1A2B38' }}>
              {item.value}명 · {total > 0 ? Math.round((item.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SeverityPieChart
