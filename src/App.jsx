import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { HouseholdProvider, useHousehold } from './contexts/HouseholdContext'
import AuthPage from './pages/AuthPage'
import OnboardingPage from './pages/OnboardingPage'
import DashboardPage from './pages/DashboardPage'
import TasksPage from './pages/TasksPage'
import ShoppingPage from './pages/ShoppingPage'
import MealsPage from './pages/MealsPage'
import CalendarPage from './pages/CalendarPage'
import ExpensesPage from './pages/ExpensesPage'
import NotesPage from './pages/NotesPage'
import ChatPage from './pages/ChatPage'
import GuestShoppingPage from './pages/GuestShoppingPage'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const { household, loading: householdLoading } = useHousehold()

  if (loading || householdLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>🏠</div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Chargement…</div>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/auth" replace />
  if (!household) return <OnboardingPage />
  return children
}

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
        <div style={{ fontSize: 36 }}>🏠</div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
      <Route path="/share/:householdId" element={<GuestShoppingPage />} />
      <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
      <Route path="/shopping" element={<ProtectedRoute><ShoppingPage /></ProtectedRoute>} />
      <Route path="/meals" element={<ProtectedRoute><MealsPage /></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
      <Route path="/expenses" element={<ProtectedRoute><ExpensesPage /></ProtectedRoute>} />
      <Route path="/notes" element={<ProtectedRoute><NotesPage /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <HouseholdProvider>
          <AppRoutes />
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
                borderRadius: 10,
                fontSize: 14,
              },
            }}
          />
        </HouseholdProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
