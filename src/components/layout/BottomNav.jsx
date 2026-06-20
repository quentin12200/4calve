import { NavLink } from 'react-router-dom'
import { House, CheckSquare, ShoppingCart, UtensilsCrossed, CalendarDays, Wallet, NotebookPen, MessageCircle } from 'lucide-react'

const navItems = [
  { to: '/', icon: House, label: 'Accueil', color: 'var(--nav-home)' },
  { to: '/tasks', icon: CheckSquare, label: 'Tâches', color: 'var(--nav-tasks)' },
  { to: '/shopping', icon: ShoppingCart, label: 'Courses', color: 'var(--nav-shopping)' },
  { to: '/meals', icon: UtensilsCrossed, label: 'Repas', color: 'var(--nav-meals)' },
  { to: '/calendar', icon: CalendarDays, label: 'Agenda', color: 'var(--nav-calendar)' },
  { to: '/expenses', icon: Wallet, label: 'Dépenses', color: 'var(--nav-expenses)' },
  { to: '/notes', icon: NotebookPen, label: 'Notes', color: 'var(--nav-notes)' },
  { to: '/chat', icon: MessageCircle, label: 'Chat', color: 'var(--nav-chat)' },
]

export function BottomNav() {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: '62px', background: 'var(--color-surface)',
      borderTop: '1px solid var(--color-border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      zIndex: 100, paddingBottom: 'env(safe-area-inset-bottom)',
      boxShadow: '0 -4px 20px rgba(99,102,241,0.08)',
    }}>
      {navItems.map(({ to, icon: Icon, label, color }) => (
        <NavLink key={to} to={to} end={to === '/'}
          style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '4px 2px', minWidth: 36 }}
        >
          {({ isActive }) => (
            <>
              <div style={{
                width: 36, height: 28, borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isActive ? color + '20' : 'transparent',
                transition: 'all 0.18s',
              }}>
                <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} color={isActive ? color : 'var(--color-text-muted)'} />
              </div>
              <span style={{
                fontSize: 8, fontWeight: isActive ? 700 : 500,
                color: isActive ? color : 'var(--color-text-muted)',
                transition: 'color 0.18s',
              }}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
