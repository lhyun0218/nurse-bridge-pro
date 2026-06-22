import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'
import type { Nurse } from '../../types'
import type { NurseScheduleRow } from '../../types'
import { getOvertimeStatus, getMonthlyWorkDays } from '../../utils/overtime'

interface OvertimeChartProps {
  nurses: Nurse[]
  scheduleRows: NurseScheduleRow[]
}

const STATUS_FILL: Record<string, string> = {
  ok:     '#2E7D5E',
  warn:   '#D4860A',
  danger: '#C0392B',
}

const OvertimeChart: React.FC<OvertimeChartProps> = ({ nurses, scheduleRows }) => {
  const hasSchedule = scheduleRows.length > 0

  const data = nurses.map(n => {
    const workDays = getMonthlyWorkDays(n.id, scheduleRows)
    return {
      name: n.name,
      workDays,
      fill: STATUS_FILL[getOvertimeStatus(workDays)],
    }
  })

  if (!hasSchedule) {
    return (
      <div style={{
        background: '#FFFFFF', borderRadius: '10px',
        boxShadow: '0 2px 12px rgba(44,110,138,.09)', padding: '20px',
      }}>
        <div style={{
          fontSize: '11px', fontWeight: 700, color: '#6B8090',
          textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '14px',
        }}>
          📅 간호사별 이번 달 근무일
        </div>
        <div style={{ textAlign: 'center', padding: '24px', color: '#6B8090', fontSize: '13px' }}>
          근무표를 생성하면 근무일 현황이 표시됩니다
        </div>
      </div>
    )
  }

  return (
    <div style={{
      background: '#FFFFFF', borderRadius: '10px',
      boxShadow: '0 2px 12px rgba(44,110,138,.09)', padding: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{
          fontSize: '11px', fontWeight: 700, color: '#6B8090',
          textTransform: 'uppercase', letterSpacing: '.6px',
        }}>
          📅 간호사별 이번 달 근무일
        </div>
        <div style={{ fontSize: '11px', color: '#6B8090' }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '2px', background: '#C0392B', marginRight: '4px' }} />
          25일↑ 과부하
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '2px', background: '#D4860A', margin: '0 4px 0 10px' }} />
          23~24일 경고
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '2px', background: '#2E7D5E', margin: '0 4px 0 10px' }} />
          22일↓ 정상
        </div>
      </div>
      <ResponsiveContainer width="100%" height={Math.max(120, data.length * 36)}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
          <XAxis
            type="number"
            domain={[0, 31]}
            tick={{ fontSize: 11, fill: '#6B8090' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `${v}일`}
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
            formatter={(value) => [`${value}일`, '이번 달 근무일']}
            contentStyle={{ borderRadius: '8px', border: '1px solid #DDE3E8', fontSize: '12px' }}
          />
          {/* 권고 기준선 22일 */}
          <ReferenceLine
            x={22}
            stroke="#2C6E8A"
            strokeDasharray="4 3"
            label={{ value: '권고 22일', position: 'top', fontSize: 10, fill: '#2C6E8A' }}
          />
          <Bar dataKey="workDays" radius={[0, 4, 4, 0]}>
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
