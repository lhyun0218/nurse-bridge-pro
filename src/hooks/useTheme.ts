import { useEffect, useCallback } from 'react'
import { useAppSelector } from './useAppSelector'

const STORAGE_KEY = 'nbp-theme'

/**
 * 다크 모드 훅
 * - localStorage에 테마 설정 저장/복원
 * - Night Shift 로그인 시 자동 다크 모드 활성화
 * - <html> 요소에 'dark' 클래스를 토글하여 Tailwind dark: 클래스 활성화
 */
export function useTheme() {
  const currentUser = useAppSelector(s => s.auth.currentUser)
  const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated)

  // 현재 다크 모드 여부 확인
  const isDark = () => document.documentElement.classList.contains('dark')

  // 테마 적용 함수
  const applyTheme = useCallback((dark: boolean) => {
    if (dark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light')
  }, [])

  // 토글 함수
  const toggleTheme = useCallback(() => {
    applyTheme(!isDark())
  }, [applyTheme])

  // 초기화: localStorage 복원 또는 Night Shift 자동 활성화
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)

    // 우선 사용자가 명시적으로 저장한 테마를 존중합니다.
    // 저장값이 없을 때만 Night 근무자 자동 다크 모드를 적용합니다.
    if (saved) {
      applyTheme(saved === 'dark')
    } else if (isAuthenticated && currentUser?.shiftType === 'Night') {
      applyTheme(true)
    } else {
      applyTheme(false)
    }
  }, [isAuthenticated, currentUser?.shiftType, applyTheme])

  return { isDark, toggleTheme }
}
