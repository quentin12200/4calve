import { Loader2 } from 'lucide-react'

const variantStyles = {
  primary: {
    background: 'var(--color-accent)',
    color: '#fff',
    border: 'none',
  },
  secondary: {
    background: 'transparent',
    color: 'var(--color-text)',
    border: '1.5px solid var(--color-border)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--color-text)',
    border: 'none',
  },
  danger: {
    background: '#ef4444',
    color: '#fff',
    border: 'none',
  },
}

const sizeStyles = {
  sm: { padding: '6px 12px', fontSize: '13px', height: '32px' },
  md: { padding: '8px 16px', fontSize: '15px', height: '40px' },
  lg: { padding: '12px 24px', fontSize: '16px', height: '48px' },
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  icon: Icon,
  children,
  onClick,
  type = 'button',
  disabled,
  style: extraStyle,
}) {
  const isDisabled = disabled || loading

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderRadius: 'var(--radius, 10px)',
    fontWeight: 600,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.6 : 1,
    transition: 'opacity 0.15s, transform 0.1s',
    width: fullWidth ? '100%' : undefined,
    userSelect: 'none',
    outline: 'none',
    whiteSpace: 'nowrap',
    ...variantStyles[variant],
    ...sizeStyles[size],
    ...extraStyle,
  }

  return (
    <button
      type={type}
      style={baseStyle}
      onClick={onClick}
      disabled={isDisabled}
      onMouseDown={e => { if (!isDisabled) e.currentTarget.style.transform = 'scale(0.97)' }}
      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
    >
      {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : Icon ? <Icon size={16} /> : null}
      {children}
    </button>
  )
}
