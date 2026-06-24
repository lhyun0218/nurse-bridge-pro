/**
 * 로컬 시간 기준 오늘 날짜를 YYYY-MM-DD 형식으로 반환합니다.
 *
 * ⚠️ toISOString()은 UTC 기준이므로 한국(UTC+9) 오전 9시 이전에
 * 전날 날짜를 반환하는 버그가 발생합니다.
 * 모든 attendance date 키는 이 함수를 사용해야 합니다.
 */
export function toLocalDateKey(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
