import { useEffect } from 'react'
import { X } from 'lucide-react'

export function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [open])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!open) return null

  const backdropStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    backdropFilter: 'blur(4px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    animation: 'fadeIn 0.15s ease',
  }

  const panelStyle = {
    background: 'var(--color-surface)',
    borderRadius: 'calc(var(--radius, 10px) * 1.5)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
    width: '100%',
    maxWidth: '480px',
    maxHeight: '90vh',
    overflowY: 'auto',
    animation: 'slideUp 0.2s ease',
  }

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 20px 0 20px',
    marginBottom: '16px',
  }

  const titleStyle = {
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--color-text)',
  }

  const closeBtnStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--color-text-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
    borderRadius: '6px',
    transition: 'color 0.15s',
  }

  const bodyStyle = {
    padding: '0 20px 20px 20px',
  }

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
      <div style={backdropStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose?.() }}>
        <div style={panelStyle} onClick={(e) => e.stopPropagation()}>
          <div style={headerStyle}>
            {title && <span style={titleStyle}>{title}</span>}
            <button style={closeBtnStyle} onClick={onClose} type="button">
              <X size={20} />
            </button>
          </div>
          <div style={bodyStyle}>{children}</div>
        </div>
      </div>
    </>
  )
}
