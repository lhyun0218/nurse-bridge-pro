import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LuEye, LuEyeOff, LuShieldCheck, LuUser, LuLock, LuChevronRight,
  LuActivity, LuPill, LuClipboardList, LuBuilding2,
} from 'react-icons/lu'
import { useAppDispatch } from '../hooks/useAppDispatch'
import { setNurses } from '../store/slices/nursesSlice'
import ConfirmShiftModal from '../components/common/ConfirmShiftModal'
import { loginSuccess, updateShift } from '../store/slices/authSlice'
import { autoAssignPatients } from '../utils/autoAssignPatients'
import { setPatients } from '../store/slices/patientsSlice'
import type { ShiftType } from '../types'

const SHIFT_OPTIONS: { value: ShiftType; label: string; time: string; color: string }[] = [
  { value: 'Day',     label: 'Day',     time: '06:00 – 15:00', color: '#2C6E8A' },
  { value: 'Evening', label: 'Evening', time: '15:00 – 23:00', color: '#D4860A' },
  { value: 'Night',   label: 'Night',   time: '23:00 – 06:00', color: '#3F51B5' },
]

const DEMO_ACCOUNTS = [
  { label: '일반 간호사', sub: 'EMP001', empId: 'EMP001', pwd: '1234', color: '#2C6E8A' },
  { label: '수간호사',     sub: 'EMP006', empId: 'EMP006', pwd: '1234', color: '#D4860A' },
]

export default function LoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const [employeeId, setEmployeeId] = useState('')
  const [password,   setPassword]   = useState('')
  const [shift,      setShift]      = useState<ShiftType>('Day')
  const [error,      setError]      = useState('')
  const [loading,    setLoading]    = useState(false)
  const [showPw,     setShowPw]     = useState(false)
  const [focusId,    setFocusId]    = useState(false)
  const [focusPw,    setFocusPw]    = useState(false)

  // ── 로그인 완료 후처리 (nurses+patients 로드, navigate) ──────────────────
  const finalizeLogin = async (userData: any, selectedShift: ShiftType) => {
    dispatch(loginSuccess({ ...userData.user, shiftType: selectedShift }))
    dispatch(updateShift(selectedShift))
    try {
      const [nRes, pRes] = await Promise.all([fetch('/api/nurses'), fetch('/api/patients')])
      if (nRes.ok && pRes.ok) {
        const [ns, pts] = await Promise.all([nRes.json(), pRes.json()])
        dispatch(setNurses(ns))
        const saved = typeof localStorage !== 'undefined'
          ? JSON.parse(localStorage.getItem('savedSchedule') || '{}')
          : {}
        const now = new Date()
        const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        const scheduleRows = saved[key] ?? []
        const dateIdx = now.getDate() - 1
        const assigns = autoAssignPatients(ns, pts, { balance: true, scheduleRows, dateIndex: dateIdx })
        const updated = pts.map((p: any) => ({
          ...p,
          assignedNurseId: assigns?.[p.id]?.[selectedShift] ?? p.assignedNurseId,
        }))
        dispatch(setPatients(updated))
      }
    } catch (e) {
      console.warn('assignments load after login failed', e)
    }
    navigate(userData.user.role === 'HeadNurse' ? '/head-nurse' : '/dashboard', { replace: true })
  }

  // ── 로그인 시도: empId/pwd + 현재 선택 교대 ───────────────────────────
  const handleLogin = async (empId: string, pwd: string, overrideShift?: ShiftType) => {
    setError('')
    setLoading(true)
    const selectedShift = overrideShift ?? shift
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: empId, password: pwd }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        const profileShift: ShiftType = data.user.shiftType
        // 프로필 교대와 선택 교대가 다를 때만 확인 모달
        if (profileShift !== selectedShift) {
          setPendingUser(data)
          setModalOpen(true)
          setLoading(false)
          return
        }
        await finalizeLogin(data, selectedShift)
      } else {
        setError(data.message ?? '사번 또는 비밀번호가 올바르지 않습니다.')
      }
    } catch {
      setError('서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  const [modalOpen, setModalOpen] = useState(false)
  const [pendingUser, setPendingUser] = useState<any | null>(null)
  const [rememberApplied, setRememberApplied] = useState(false)

  // 기억된 교대 복원
  useEffect(() => {
    try {
      const raw = localStorage.getItem('nb:rememberShift')
      if (raw) {
        const p = JSON.parse(raw)
        if (p?.shift) { setShift(p.shift); setRememberApplied(true) }
      }
    } catch (e) {}
  }, [])

  // 모달에서 "이 교대로 로그인" 확인
  const handleConfirmShift = async (remember: boolean) => {
    if (!pendingUser) { setModalOpen(false); setLoading(false); return }
    if (remember) {
      try { localStorage.setItem('nb:rememberShift', JSON.stringify({ shift })) } catch (e) {}
    }
    setModalOpen(false)
    setPendingUser(null)
    setLoading(true)
    try {
      await finalizeLogin(pendingUser, shift)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); handleLogin(employeeId, password) }

  // 데모 버튼: 해당 간호사의 프로필 교대를 먼저 구한 뒤 로그인
  const handleDemo = async (empId: string, pwd: string) => {
    setEmployeeId(empId)
    setPassword(pwd)
    setError('')
    let demoShift: ShiftType = shift
    try {
      const res = await fetch('/api/nurses')
      if (res.ok) {
        const ns = await res.json()
        const nurse = ns.find((n: any) => n.employeeId === empId)
        if (nurse?.shiftType) {
          demoShift = nurse.shiftType as ShiftType
          setShift(demoShift)
        }
      }
    } catch (e) { /* ignore */ }
    // shift state update는 비동기이므로 직접 구한 값을 넘김
    handleLogin(empId, pwd, demoShift)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--color-bg)',
      transition: 'background-color 0.3s ease',
    }}>

      {/* ── 좌측 패널 (데스크탑) ─────────────────────────────── */}
      <div
        className="login-left-panel"
        style={{
          flex: '0 0 420px',
          background: 'linear-gradient(160deg, #0D3349 0%, #1A5070 55%, #2C6E8A 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 44px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 배경 장식 원 */}
        <div style={{
          position: 'absolute', top: '-60px', right: '-60px',
          width: '260px', height: '260px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '40px', left: '-80px',
          width: '320px', height: '320px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.03)', pointerEvents: 'none',
        }} />

        {/* 상단 로고 */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
            <img
              src="/logo.jpeg"
              alt="너스브릿지 PRO 로고"
              style={{
                width: '42px', height: '42px', borderRadius: '10px',
                objectFit: 'cover', flexShrink: 0,
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}
            />
            <div>
              <div style={{ color: '#fff', fontSize: '16px', fontWeight: 700, letterSpacing: '-0.2px' }}>
                너스브릿지 PRO
              </div>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '11px', marginTop: '1px' }}>
                Clinical Nursing Management System
              </div>
            </div>
          </div>

          <ConfirmShiftModal
            open={modalOpen}
            nurseName={pendingUser?.user?.name ?? ''}
            profileShift={(pendingUser?.user?.shiftType ?? 'Day') as 'Day' | 'Evening' | 'Night'}
            selectedShift={shift}
            onConfirm={handleConfirmShift}
            onCancel={() => { setModalOpen(false); setPendingUser(null); setLoading(false) }}
          />

          <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '26px', fontWeight: 700, lineHeight: 1.35, letterSpacing: '-0.5px' }}>
            환자 안전을<br />최우선으로
          </div>
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px', marginTop: '12px', lineHeight: 1.7 }}>
            실시간 활력징후 모니터링, 투약 스케줄<br />
            관리, 인수인계까지 — 하나의 플랫폼에서.
          </div>
        </div>

        {/* 하단 기능 요약 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { Icon: LuActivity,      text: '실시간 활력징후 알림',     color: '#ff6b6b' },
            { Icon: LuPill,          text: '투약 타이머 & 스케줄',     color: '#4A9BB5' },
            { Icon: LuClipboardList, text: '전자 인수인계 보고서',     color: '#6BB8D0' },
            { Icon: LuBuilding2,     text: '병동 관제 & 자원 배분',   color: '#7EC8A4' },
          ].map(item => (
            <div key={item.text} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 14px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.07)',
            }}>
              <item.Icon style={{ width: '16px', height: '16px', color: item.color, flexShrink: 0 }} />
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 우측 로그인 폼 ──────────────────────────────────── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px',
        minWidth: 0,
      }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          style={{ width: '100%', maxWidth: '400px' }}
        >
          {/* 모바일용 로고 (좌측 패널 숨겨질 때) */}
          <div className="login-mobile-logo" style={{ marginBottom: '28px', textAlign: 'center', display: 'none' }}>
            <img
              src="/logo.jpeg"
              alt="너스브릿지 PRO 로고"
              style={{
                width: '52px', height: '52px', borderRadius: '13px',
                objectFit: 'cover', marginBottom: '10px',
                boxShadow: '0 4px 12px rgba(44,110,138,0.25)',
              }}
            />
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)' }}>너스브릿지 PRO</div>
            <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '3px' }}>Clinical Nursing Management System</div>
          </div>

          {/* 헤더 */}
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 4px', letterSpacing: '-0.3px' }}>
              시스템 로그인
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: 0 }}>
              병원 발급 사번과 비밀번호를 입력하세요
            </p>
          </div>

          {/* 폼 카드 */}
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '28px 28px 24px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            transition: 'background-color 0.3s ease',
          }}>
            <form onSubmit={handleSubmit}>

              {/* 사번 */}
              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="employeeId" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  사번 (Employee ID)
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                    color: focusId ? '#2C6E8A' : 'var(--color-muted)',
                    display: 'flex', alignItems: 'center', transition: 'color 0.15s',
                  }}>
                    <LuUser style={{ width: '16px', height: '16px' }} />
                  </span>
                  <input
                    id="employeeId"
                    type="text"
                    value={employeeId}
                    onChange={e => setEmployeeId(e.target.value)}
                    onFocus={() => setFocusId(true)}
                    onBlur={() => setFocusId(false)}
                    placeholder="예: EMP001"
                    required
                    autoComplete="username"
                    style={{
                      width: '100%', padding: '10px 12px 10px 38px',
                      border: `1.5px solid ${focusId ? '#2C6E8A' : 'var(--color-border)'}`,
                      borderRadius: '8px', fontSize: '14px',
                      color: 'var(--color-text)', background: 'var(--color-surface)',
                      outline: 'none', boxSizing: 'border-box',
                      transition: 'border-color 0.15s, background-color 0.3s ease',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
              </div>

              {/* 비밀번호 */}
              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="password" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  비밀번호
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                    color: focusPw ? '#2C6E8A' : 'var(--color-muted)',
                    display: 'flex', alignItems: 'center', transition: 'color 0.15s',
                  }}>
                    <LuLock style={{ width: '16px', height: '16px' }} />
                  </span>
                  <input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocusPw(true)}
                    onBlur={() => setFocusPw(false)}
                    placeholder="비밀번호 입력"
                    required
                    autoComplete="current-password"
                    style={{
                      width: '100%', padding: '10px 40px 10px 38px',
                      border: `1.5px solid ${focusPw ? '#2C6E8A' : 'var(--color-border)'}`,
                      borderRadius: '8px', fontSize: '14px',
                      color: 'var(--color-text)', background: 'var(--color-surface)',
                      outline: 'none', boxSizing: 'border-box',
                      transition: 'border-color 0.15s, background-color 0.3s ease',
                      fontFamily: 'inherit',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    style={{
                      position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                      color: 'var(--color-muted)', display: 'flex', alignItems: 'center',
                    }}
                    tabIndex={-1}
                    aria-label={showPw ? '비밀번호 숨기기' : '비밀번호 표시'}
                  >
                    {showPw ? <LuEyeOff style={{ width: '15px', height: '15px' }} /> : <LuEye style={{ width: '15px', height: '15px' }} />}
                  </button>
                </div>
              </div>

              {/* 근무조 */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  근무조
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {SHIFT_OPTIONS.map(opt => {
                    const sel = shift === opt.value
                    return (
                      <label key={opt.value} style={{ cursor: 'pointer' }}>
                        <input
                          type="radio" name="shift" value={opt.value}
                          checked={sel} onChange={() => setShift(opt.value)}
                          style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                        />
                        <span style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center',
                          padding: '10px 6px',
                          border: `1.5px solid ${sel ? opt.color : 'var(--color-border)'}`,
                          borderRadius: '8px',
                          background: sel ? `${opt.color}12` : 'var(--color-surface)',
                          transition: 'all 0.15s',
                          gap: '2px',
                        }}>
                          <strong style={{ fontSize: '13px', fontWeight: 700, color: sel ? opt.color : 'var(--color-text)' }}>
                            {opt.label}
                          </strong>
                          <span style={{ fontSize: '10px', color: sel ? opt.color : 'var(--color-muted)', letterSpacing: '-0.2px' }}>
                            {opt.time}
                          </span>
                        </span>
                      </label>
                    )
                  })}
                </div>
                {rememberApplied && (
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-muted)' }}>[기억된 교대] 이전에 선택한 교대가 자동 적용되었습니다.</div>
                )}
              </div>

              {/* 오류 */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      background: '#FDECEA', color: '#C0392B',
                      borderRadius: '8px', padding: '10px 14px',
                      fontSize: '13px', marginBottom: '14px',
                      border: '1px solid #F5B7B1',
                      display: 'flex', alignItems: 'center', gap: '8px',
                    }}
                    role="alert"
                  >
                    <span style={{ flexShrink: 0 }}>⚠️</span>
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 로그인 버튼 */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '12px',
                  background: loading ? '#4A9BB5' : '#2C6E8A',
                  color: '#fff', border: 'none', borderRadius: '8px',
                  fontSize: '14px', fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  letterSpacing: '0.2px',
                }}
                onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#1E5470' }}
                onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#2C6E8A' }}
              >
                {loading ? (
                  <>
                    <svg style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    로그인 중...
                  </>
                ) : (
                  <>
                    <LuChevronRight style={{ width: '16px', height: '16px' }} />
                    시스템 접속
                  </>
                )}
              </button>
            </form>

            {/* 구분선 + 데모 */}
            <div style={{ marginTop: '20px', paddingTop: '18px', borderTop: '1px solid var(--color-border)' }}>
              <p style={{ fontSize: '11px', color: 'var(--color-muted)', textAlign: 'center', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                데모 계정으로 접속
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                {DEMO_ACCOUNTS.map(acc => (
                  <button
                    key={acc.empId}
                    type="button"
                    onClick={() => handleDemo(acc.empId, acc.pwd)}
                    disabled={loading}
                    style={{
                      flex: 1, padding: '10px 8px',
                      border: `1.5px solid var(--color-border)`,
                      borderRadius: '8px', background: 'var(--color-bg)',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s',
                      textAlign: 'center',
                    }}
                    onMouseEnter={e => {
                      if (!loading) {
                        const el = e.currentTarget as HTMLButtonElement
                        el.style.borderColor = acc.color
                        el.style.background  = `${acc.color}0D`
                      }
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLButtonElement
                      el.style.borderColor = 'var(--color-border)'
                      el.style.background  = 'var(--color-bg)'
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '3px' }}>{acc.label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginBottom: '4px', fontWeight: 500 }}>
                      {acc.empId}
                    </div>
                    <div style={{ fontSize: '10px', color: acc.color, fontWeight: 600, letterSpacing: '0.3px' }}>
                      클릭하여 바로 로그인
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 하단 보안 배지 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '20px' }}>
            <LuShieldCheck style={{ width: '13px', height: '13px', color: 'var(--color-muted)' }} />
            <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
              256-bit SSL 암호화 · HIPAA 준수 · 접속 이력 기록
            </span>
          </div>
        </motion.div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .login-left-panel { display: none !important; }
          .login-mobile-logo { display: block !important; }
        }
      `}</style>
    </div>
  )
}
