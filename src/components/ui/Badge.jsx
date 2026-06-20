const presetColors = {
  success: { bg: 'rgba(34,197,94,0.15)', text: '#16a34a' },
  danger: { bg: 'rgba(239,68,68,0.15)', text: '#dc2626' },
  warning: { bg: 'rgba(234,179,8,0.15)', text: '#ca8a04' },
  info: { bg: 'rgba(59,130,246,0.15)', text: '#2563eb' },
}

export function Badge({ color = 'info', children, style: extraStyle }) {
  const preset = presetColors[color]

  const badgeStyle = preset
    ? { background: preset.bg, color: preset.text }
    : { background: color + '22', color: color }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: '999px',
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.03em',
        ...badgeStyle,
        ...extraStyle,
      }}
    >
      {children}
    </span>
  )
}
