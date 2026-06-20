import { TopBar } from './TopBar'
import { BottomNav } from './BottomNav'

export function AppLayout({ title, showBack, topBarActions, children }) {
  const contentStyle = {
    minHeight: 'calc(100vh - 56px)',
    paddingBottom: '80px',
    background: 'var(--color-bg)',
  }

  return (
    <div>
      <TopBar title={title} showBack={showBack}>
        {topBarActions}
      </TopBar>
      <main style={contentStyle}>
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
