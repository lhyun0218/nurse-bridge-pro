import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

interface OccupancyData {
  shift: string
  rate: number
  count: number
}

interface OccupancyChartProps {
  data?: OccupancyData[]
}

const DEFAULT_DATA: OccupancyData[] = [
  { shift: 'Day',     rate: 83, count: 50 },
  { shift: 'Evening', rate: 55, count: 33 },
  { shift: 'Night',   rate: 35, count: 21 },
]

const SHIFT_COLORS: Record<string, string> = {
  Day:     '#2C6E8A',
  Evening: '#4A9BB5',
  Night:   '#7BBDD4',
}

const OccupancyChart: React.FC<OccupancyChartProps> = ({ data = DEFAULT_DATA }) => {
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: '10px',
      boxShadow: '0 2px 12px rgba(44,110,138,.09)', padding: '20px',
    }}>
      <div style={{
        fontSize: '11px', fontWeight: 700, color: '#6B8090',
        textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '14px',
      }}>
        📊 근무조별 병상 가동률
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <XAxis dataKey="shift" tick={{ fontSize: 12, fill: '#6B8090' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#6B8090' }} domain={[0, 100]} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
          <Tooltip
            formatter={(value) => [`${value}%`, '가동률']}
            contentStyle={{ borderRadius: '8px', border: '1px solid #DDE3E8', fontSize: '12px' }}
          />
          <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.shift} fill={SHIFT_COLORS[entry.shift] ?? '#2C6E8A'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default OccupancyChart
