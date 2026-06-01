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
    backgroundColor: '#2C6E8A',
    color: '#FFFFFF',
    border: 'none',
  },
  outline: {
    backgroundColor: '#F0F4F7',
    color: '#1A2B38',
    border: '1.5px solid #DDE3E8',
  },
  danger: {
    backgroundColor: '#C0392B',
    color: '#FFFFFF',
    border: 'none',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: '#6B8090',
    border: 'none',
  },
  done: {
    backgroundColor: '#E8F5EE',
    color: '#2E7D5E',
    border: '1px solid #b8ddc9',
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
