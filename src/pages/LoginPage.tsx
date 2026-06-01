import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAppDispatch } from '../hooks/useAppDispatch'
import { loginSuccess, updateShift } from '../store/slices/authSlice'
import type { ShiftType } from '../types'

// 근무조 옵션 정의
const SHIFT_OPTIONS: { value: ShiftType; label: string; time: string }[] = [
  { value: 'Day',     label: 'Day',     time: '06:00~15:00' },
  { value: 'Evening', label: 'Evening', time: '15:00~23:00' },
  { value: 'Night',   label: 'Night',   time: '23:00~06:00' },
]

export default function LoginPage() {
  const dispatch  = useAppDispatch()
  const navigate  = useNavigate()

  const [employeeId, setEmployeeId] = useState('')
  const [password,   setPassword]   = useState('')
  const [shift,      setShift]      = useState<ShiftType>('Day')
  const [error,      setError]      = useState('')
  const [loading,    setLoading]    = useState(false)

  // 로그인 처리
  const handleLogin = async (empId: string, pwd: string) => {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: empId, password: pwd }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        dispatch(loginSuccess(data.user))
        dispatch(updateShift(shift))
        const role = data.user.role
        if (role === 'HeadNurse') {
          navigate('/head-nurse', { replace: true })
        } else {
          navigate('/dashboard', { replace: true })
        }
      } else {
        setError('사번 또는 비밀번호가 올바르지 않습니다.')
      }
    } catch {
      setError('서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleLogin(employeeId, password)
  }

  // 데모 계정 자동 입력 후 로그인
  const handleDemo = (empId: string, pwd: string) => {
    setEmployeeId(empId)
    setPassword(pwd)
    handleLogin(empId, pwd)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F0F4F7',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        fontFamily: "'Segoe UI', 'Apple SD Gothic Neo', sans-serif",
      }}
    >
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* 로고 영역 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ textAlign: 'center', marginBottom: '32px' }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '56px',
              height: '56px',
              background: '#2C6E8A',
              borderRadius: '14px',
              marginBottom: '12px',
            }}
          >
            <svg
              viewBox="0 0 24 24"
              style={{ width: '30px', height: '30px', fill: '#fff' }}
            >
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z" />
            </svg>
          </div>
          <div
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#1A2B38',
              letterSpacing: '-0.3px',
            }}
          >
            Nurse-Bridge PRO
          </div>
          <div style={{ fontSize: '13px', color: '#6B8090', marginTop: '4px' }}>
            간호사 업무 효율화 및 환자 안전 강화 시스템
          </div>
        </motion.div>

        {/* 로그인 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          style={{
            background: '#FFFFFF',
            borderRadius: '10px',
            boxShadow: '0 2px 16px rgba(44,110,138,.10)',
            padding: '36px 32px',
          }}
        >
          <div
            style={{
              fontSize: '17px',
              fontWeight: 600,
              color: '#1A2B38',
              marginBottom: '24px',
            }}
          >
            로그인
          </div>

          <form onSubmit={handleSubmit}>
            {/* 사번 입력 */}
            <div style={{ marginBottom: '18px' }}>
              <label
                htmlFor="employeeId"
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#6B8090',
                  marginBottom: '6px',
                }}
              >
                사번
              </label>
              <input
                id="employeeId"
                type="text"
                value={employeeId}
                onChange={e => setEmployeeId(e.target.value)}
                placeholder="사번을 입력하세요 (예: EMP001)"
                required
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  border: '1.5px solid #DDE3E8',
                  borderRadius: '8px',
                  fontSize: '15px',
                  color: '#1A2B38',
                  background: '#F0F4F7',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color .2s',
                }}
                onFocus={e => { e.target.style.borderColor = '#2C6E8A'; e.target.style.background = '#fff' }}
                onBlur={e => { e.target.style.borderColor = '#DDE3E8'; e.target.style.background = '#F0F4F7' }}
              />
            </div>

            {/* 비밀번호 입력 */}
            <div style={{ marginBottom: '18px' }}>
              <label
                htmlFor="password"
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#6B8090',
                  marginBottom: '6px',
                }}
              >
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                required
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  border: '1.5px solid #DDE3E8',
                  borderRadius: '8px',
                  fontSize: '15px',
                  color: '#1A2B38',
                  background: '#F0F4F7',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color .2s',
                }}
                onFocus={e => { e.target.style.borderColor = '#2C6E8A'; e.target.style.background = '#fff' }}
                onBlur={e => { e.target.style.borderColor = '#DDE3E8'; e.target.style.background = '#F0F4F7' }}
              />
            </div>

            {/* 근무조 선택 */}
            <div style={{ marginBottom: '24px' }}>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#6B8090',
                  marginBottom: '10px',
                }}
              >
                근무조 선택
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                }}
              >
                {SHIFT_OPTIONS.map(opt => {
                  const isSelected = shift === opt.value
                  return (
                    <label
                      key={opt.value}
                      style={{ position: 'relative', cursor: 'pointer' }}
                    >
                      <input
                        type="radio"
                        name="shift"
                        value={opt.value}
                        checked={isSelected}
                        onChange={() => setShift(opt.value)}
                        style={{
                          position: 'absolute',
                          opacity: 0,
                          width: 0,
                          height: 0,
                        }}
                      />
                      <span
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          padding: '10px 6px',
                          border: `1.5px solid ${isSelected ? '#2C6E8A' : '#DDE3E8'}`,
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: isSelected ? '#2C6E8A' : '#6B8090',
                          background: isSelected ? '#EBF4F8' : '#F0F4F7',
                          transition: 'all .2s',
                          gap: '3px',
                        }}
                      >
                        <strong
                          style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: isSelected ? '#2C6E8A' : '#1A2B38',
                          }}
                        >
                          {opt.label}
                        </strong>
                        {opt.time}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* 오류 메시지 */}
            {error && (
              <div
                style={{
                  background: '#FDECEA',
                  color: '#C0392B',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '13px',
                  marginBottom: '16px',
                }}
                role="alert"
              >
                {error}
              </div>
            )}

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                background: loading ? '#4A9BB5' : '#2C6E8A',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background .2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
              onMouseEnter={e => {
                if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#1E5470'
              }}
              onMouseLeave={e => {
                if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#2C6E8A'
              }}
            >
              {loading ? (
                <>
                  <svg
                    style={{
                      width: '18px',
                      height: '18px',
                      animation: 'spin 1s linear infinite',
                    }}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  로그인 중...
                </>
              ) : (
                '로그인'
              )}
            </button>
          </form>

          {/* 데모 계정 */}
          <div
            style={{
              marginTop: '20px',
              paddingTop: '20px',
              borderTop: '1px solid #DDE3E8',
            }}
          >
            <p
              style={{
                fontSize: '12px',
                color: '#6B8090',
                textAlign: 'center',
                marginBottom: '10px',
              }}
            >
              데모 계정으로 바로 접속
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <DemoButton
                label="👩‍⚕️ 일반 간호사"
                onClick={() => handleDemo('EMP001', '1234')}
                disabled={loading}
              />
              <DemoButton
                label="👔 수간호사"
                onClick={() => handleDemo('EMP006', '1234')}
                disabled={loading}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* 스피너 CSS 애니메이션 */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

// 데모 버튼 서브 컴포넌트
function DemoButton({
  label,
  onClick,
  disabled,
}: {
  label: string
  onClick: () => void
  disabled: boolean
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: 1,
        padding: '9px 6px',
        border: `1.5px solid ${hovered ? '#2C6E8A' : '#DDE3E8'}`,
        borderRadius: '8px',
        background: hovered ? '#EBF4F8' : '#F0F4F7',
        fontSize: '12px',
        fontWeight: 500,
        color: hovered ? '#2C6E8A' : '#6B8090',
        cursor: disabled ? 'not-allowed' : 'pointer',
        textAlign: 'center',
        transition: 'all .2s',
        minHeight: '44px',
      }}
    >
      {label}
    </button>
  )
}
