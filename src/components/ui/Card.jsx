export function Card({ children, onClick, style: extraStyle, className }) {
  const cardStyle = {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius, 10px)',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    overflow: 'hidden',
    cursor: onClick ? 'pointer' : undefined,
    transition: onClick ? 'box-shadow 0.15s, transform 0.1s' : undefined,
    ...extraStyle,
  }

  return (
    <div
      style={cardStyle}
      onClick={onClick}
      className={className}
      onMouseEnter={onClick ? e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-1px)' } : undefined}
      onMouseLeave={onClick ? e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(0)' } : undefined}
    >
      {children}
    </div>
  )
}
