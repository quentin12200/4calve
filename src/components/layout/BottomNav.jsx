import { NavLink } from 'react-router-dom'
import { House, CheckSquare, ShoppingCart, UtensilsCrossed, CalendarDays, Wallet } from 'lucide-react'

const navItems = [
  { to: '/', icon: House, label: 'Accueil' },
  { to: '/tasks', icon: CheckSquare, label: 'Tâches' },
  { to: '/shopping', icon: ShoppingCart, label: 'Courses' },
  { to: '/meals', icon: UtensilsCrossed, label: 'Repas' },
  { to: '/calendar', icon: CalendarDays, label: 'Agenda' },
  { to: '/expenses', icon: Wallet, label: 'Dépenses' },
]

export function BottomNav() {
  const navStyle = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '64px',
    background: 'var(--color-surface)',
    borderTop: '1px solid var(--color-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    zIndex: 100,
    paddingBottom: 'env(safe-area-inset-bottom)',
  }

  return (
    <nav style={navStyle}>
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            textDecoration: 'none',
            color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
            fontSize: '10px',
            fontWeight: isActive ? 700 : 500,
            transition: 'color 0.15s',
            padding: '4px 8px',
            minWidth: '44px',
          })}
        >
          {({ isActive }) => (
            <>
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
