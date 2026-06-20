import { useState } from 'react'

export function Input({
  label,
  error,
  icon: Icon,
  type = 'text',
  placeholder,
  value,
  onChange,
  name,
  required,
  autoComplete,
  style: extraStyle,
  inputRef,
}) {
  const [focused, setFocused] = useState(false)

  const wrapperStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    width: '100%',
  }

  const labelStyle = {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--color-text-muted)',
    letterSpacing: '0.01em',
  }

  const inputWrapperStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  }

  const iconStyle = {
    position: 'absolute',
    left: '12px',
    color: focused ? 'var(--color-accent)' : 'var(--color-text-muted)',
    pointerEvents: 'none',
    transition: 'color 0.15s',
  }

  const inputStyle = {
    width: '100%',
    padding: Icon ? '10px 14px 10px 40px' : '10px 14px',
    fontSize: '15px',
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    border: `1.5px solid ${error ? '#ef4444' : focused ? 'var(--color-accent)' : 'var(--color-border)'}`,
    borderRadius: 'var(--radius, 10px)',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    boxShadow: focused ? `0 0 0 3px ${error ? 'rgba(239,68,68,0.15)' : 'rgba(var(--color-accent-rgb, 139,115,85),0.15)'}` : 'none',
    boxSizing: 'border-box',
    ...extraStyle,
  }

  const errorStyle = {
    fontSize: '12px',
    color: '#ef4444',
    marginTop: '2px',
  }

  return (
    <div style={wrapperStyle}>
      {label && <label style={labelStyle}>{label}{required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}</label>}
      <div style={inputWrapperStyle}>
        {Icon && (
          <span style={iconStyle}>
            <Icon size={16} />
          </span>
        )}
        <input
          ref={inputRef}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          style={inputStyle}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </div>
      {error && <span style={errorStyle}>{error}</span>}
    </div>
  )
}
