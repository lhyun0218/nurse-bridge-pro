import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import type { Nurse } from '../../types'
import { getOvertimeStatus } from '../../utils/overtime'

interface OvertimeChartProps {
  nurses: Nurse[]
}

const STATUS_FILL: Record<string, string> = {
  ok:     '#2E7D5E',
  warn:   '#D4860A',
  danger: '#C0392B',
}

const OvertimeChart: React.FC<OvertimeChartProps> = ({ nurses }) => {
  const data = nurses.map(n => ({
    name: n.name,
    overtime: n.overtimeHours,
    fill: STATUS_FILL[getOvertimeStatus(n.overtimeHours)],
  }))

  return (
    <div style={{
      background: '#FFFFFF', borderRadius: '10px',
      boxShadow: '0 2px 12px rgba(44,110,138,.09)', padding: '20px',
    }}>
      <div style={{
        fontSize: '11px', fontWeight: 700, color: '#6B8090',
        textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '14px',
      }}>
        ⏱️ 간호사별 예상 오버타임
      </div>
      <ResponsiveContainer width="100%" height={Math.max(120, data.length * 36)}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: '#6B8090' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `${v}h`}
          />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fontSize: 12, fill: '#1A2B38' }}
            width={60}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value) => [`${value}h`, '오버타임']}
            contentStyle={{ borderRadius: '8px', border: '1px solid #DDE3E8', fontSize: '12px' }}
          />
          <Bar dataKey="overtime" radius={[0, 4, 4, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default OvertimeChart
