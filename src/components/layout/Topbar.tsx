import { useEffect, useState } from 'react'
import { useAppSelector } from '../../hooks/useAppSelector'

interface TopbarProps {
  pageTitle: string
  onMenuToggle: () => void
}

export default function Topbar({ pageTitle, onMenuToggle }: TopbarProps) {
  const [currentTime, setCurrentTime] = useState(() => new Date())
  const currentUser = useAppSelector(s => s.auth.currentUser)

  // 1초마다 시간 업데이트
  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const timeStr = currentTime.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  const dateStr = currentTime.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })

  const shiftLabel =
    currentUser?.shiftType === 'Day'
      ? 'Day 근무'
      : currentUser?.shiftType === 'Evening'
      ? 'Evening 근무'
      : 'Night 근무'

  return (
    <header
      className="bg-[#FFFFFF] border-b border-[#DDE3E8] px-6 h-[58px] flex items-center justify-between sticky top-0 z-[100]"
      style={{ minHeight: 58 }}
    >
      {/* 좌측 */}
      <div className="flex items-center gap-[10px]">
        {/* 햄버거 — 모바일만 */}
        <button
          onClick={onMenuToggle}
          className="hamburger-btn w-9 h-9 rounded-[8px] border border-[#DDE3E8] bg-[#F0F4F7] items-center justify-center text-[20px] cursor-pointer"
          aria-label="메뉴 열기"
        >
          ☰
        </button>

        <div>
          <div className="text-[16px] font-bold text-[#1A2B38]">{pageTitle}</div>
          <div className="text-[12px] text-[#6B8090]">
            {dateStr} · {shiftLabel}
          </div>
        </div>
      </div>

      {/* 우측 */}
      <div className="flex items-center gap-2">
        {/* 현재 시간 칩 */}
        <div className="px-3 py-[5px] bg-[#F0F4F7] border border-[#DDE3E8] rounded-[20px] text-[12px] text-[#6B8090] font-medium whitespace-nowrap">
          🕐 {timeStr}
        </div>

        {/* 알림 버튼 */}
        <button
          className="w-9 h-9 rounded-[8px] border border-[#DDE3E8] bg-[#F0F4F7] flex items-center justify-center text-[16px] relative cursor-pointer"
          aria-label="알림"
        >
          🔔
          <span className="absolute top-[5px] right-[5px] w-2 h-2 rounded-full bg-[#C0392B] border-2 border-[#FFFFFF]" />
        </button>
      </div>
    </header>
  )
}
