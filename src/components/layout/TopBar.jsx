import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export function TopBar({ title, showBack = false, children }) {
  const navigate = useNavigate()

  const barStyle = {
    position: 'sticky',
    top: 0,
    height: '56px',
    background: 'var(--color-surface)',
    borderBottom: '2px solid transparent',
    backgroundImage: 'linear-gradient(var(--color-surface), var(--color-surface)), linear-gradient(90deg, var(--color-accent), var(--nav-chat))',
    backgroundOrigin: 'border-box',
    backgroundClip: 'padding-box, border-box',
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    gap: '12px',
    zIndex: 50,
    boxShadow: '0 2px 12px rgba(99,102,241,0.1)',
  }

  const backBtnStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--color-text)',
    display: 'flex',
    alignItems: 'center',
    padding: '4px',
    borderRadius: '6px',
  }

  const titleStyle = {
    fontSize: '17px',
    fontWeight: 700,
    color: 'var(--color-text)',
    flex: 1,
  }

  const actionsStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginLeft: 'auto',
  }

  return (
    <div style={barStyle}>
      {showBack && (
        <button style={backBtnStyle} onClick={() => navigate(-1)} type="button">
          <ArrowLeft size={22} />
        </button>
      )}
      <span style={titleStyle}>{title}</span>
      {children && <div style={actionsStyle}>{children}</div>}
    </div>
  )
}
