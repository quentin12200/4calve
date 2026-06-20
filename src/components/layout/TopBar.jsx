import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export function TopBar({ title, showBack = false, children }) {
  const navigate = useNavigate()

  const barStyle = {
    position: 'sticky',
    top: 0,
    height: '56px',
    background: 'var(--color-surface)',
    borderBottom: '1px solid var(--color-border)',
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    gap: '12px',
    zIndex: 50,
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
