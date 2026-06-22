import React from 'react'

type ButtonVariant = 'primary' | 'outline' | 'danger' | 'ghost' | 'done'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  children: React.ReactNode
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: 'var(--color-primary)',
    color: '#FFFFFF',
    border: 'none',
  },
  outline: {
    backgroundColor: 'var(--color-bg)',
    color: 'var(--color-text)',
    border: '1.5px solid var(--color-border)',
  },
  danger: {
    backgroundColor: 'var(--color-danger)',
    color: '#FFFFFF',
    border: 'none',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: 'var(--color-muted)',
    border: 'none',
  },
  done: {
    backgroundColor: 'var(--color-ok-bg)',
    color: 'var(--color-ok)',
    border: '1px solid rgba(46,125,94,0.2)',
  },
}

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: '6px 12px', fontSize: '12px', minHeight: '32px' },
  md: { padding: '8px 16px', fontSize: '14px', minHeight: '44px' },
  lg: { padding: '12px 24px', fontSize: '15px', minHeight: '48px' },
}

const Spinner: React.FC = () => (
  <svg
    style={{
      width: '14px',
      height: '14px',
      animation: 'spin 0.8s linear infinite',
      marginRight: '6px',
    }}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
  >
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <path
      strokeLinecap="round"
      d="M12 2a10 10 0 0 1 10 10"
      opacity={0.3}
    />
    <path
      strokeLinecap="round"
      d="M12 2a10 10 0 0 1 10 10"
      strokeDasharray="15 45"
    />
  </svg>
)

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  style,
  ...rest
}) => {
  const isDisabled = disabled || loading

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    fontWeight: 600,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.5 : 1,
    transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease',
    fontFamily: 'inherit',
    lineHeight: 1.4,
    boxShadow: 'var(--shadow-card)',
    ...variantStyles[variant],
    ...sizeStyles[size],
    ...style,
  }

  return (
    <button style={baseStyle} disabled={isDisabled} {...rest}>
      {loading && <Spinner />}
      {children}
    </button>
  )
}

export default Button
