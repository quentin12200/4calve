const sizeMap = {
  sm: { width: 28, height: 28, fontSize: 11 },
  md: { width: 36, height: 36, fontSize: 14 },
  lg: { width: 48, height: 48, fontSize: 18 },
}

export function Avatar({ name = '', color, size = 'md' }) {
  const dim = sizeMap[size] || sizeMap.md

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')

  const style = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    background: color || 'var(--color-accent)',
    color: '#fff',
    fontWeight: 700,
    flexShrink: 0,
    userSelect: 'none',
    ...dim,
  }

  return <div style={style}>{initials || '?'}</div>
}
