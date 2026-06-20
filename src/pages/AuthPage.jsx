import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export default function AuthPage() {
  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState('')
  const { login, loginWithGoogle, register } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading('login')
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      toast.error(err.message || 'Erreur de connexion')
    } finally {
      setLoading('')
    }
  }

  const handleGoogle = async () => {
    setLoading('google')
    try {
      await loginWithGoogle()
      navigate('/')
    } catch (err) {
      toast.error(err.message || 'Erreur Google')
    } finally {
      setLoading('')
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!displayName.trim()) { toast.error('Prénom requis'); return }
    setLoading('register')
    try {
      await register(email, password, displayName)
      toast.success('Compte créé !')
      navigate('/')
    } catch (err) {
      toast.error(err.message || 'Erreur inscription')
    } finally {
      setLoading('')
    }
  }

  const pageStyle = {
    minHeight: '100vh',
    background: 'var(--color-bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  }

  const cardStyle = {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'calc(var(--radius, 10px) * 1.5)',
    boxShadow: '0 8px 40px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px',
    padding: '32px',
  }

  const logoStyle = {
    textAlign: 'center',
    marginBottom: '28px',
  }

  const tabsStyle = {
    display: 'flex',
    background: 'var(--color-bg)',
    borderRadius: 'var(--radius, 10px)',
    padding: '4px',
    marginBottom: '24px',
  }

  const tabBtn = (active) => ({
    flex: 1,
    padding: '8px',
    background: active ? 'var(--color-surface)' : 'transparent',
    border: 'none',
    borderRadius: 'calc(var(--radius, 10px) - 2px)',
    fontWeight: active ? 700 : 500,
    color: active ? 'var(--color-text)' : 'var(--color-text-muted)',
    cursor: 'pointer',
    fontSize: '14px',
    boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
    transition: 'all 0.15s',
  })

  const dividerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '16px 0',
    color: 'var(--color-text-muted)',
    fontSize: '13px',
  }

  const lineStyle = { flex: 1, height: '1px', background: 'var(--color-border)' }

  const googleBtnStyle = {
    width: '100%',
    padding: '10px',
    background: 'var(--color-bg)',
    border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius, 10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    cursor: loading === 'google' ? 'not-allowed' : 'pointer',
    opacity: loading === 'google' ? 0.6 : 1,
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--color-text)',
    transition: 'opacity 0.15s',
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={logoStyle}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>🏠</div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>Chez Nous</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '4px' }}>Votre espace de vie partagé</p>
        </div>

        <div style={tabsStyle}>
          <button style={tabBtn(tab === 'login')} onClick={() => setTab('login')}>Connexion</button>
          <button style={tabBtn(tab === 'register')} onClick={() => setTab('register')}>Inscription</button>
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Input
              label="Email"
              type="email"
              icon={Mail}
              placeholder="vous@exemple.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              label="Mot de passe"
              type="password"
              icon={Lock}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <Button type="submit" fullWidth loading={loading === 'login'} style={{ marginTop: '4px' }}>
              Se connecter
            </Button>

            <div style={dividerStyle}>
              <div style={lineStyle} />
              <span>ou</span>
              <div style={lineStyle} />
            </div>

            <button type="button" style={googleBtnStyle} onClick={handleGoogle} disabled={loading === 'google'}>
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Continuer avec Google
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Input
              label="Prénom"
              type="text"
              icon={User}
              placeholder="Votre prénom"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              required
              autoComplete="given-name"
            />
            <Input
              label="Email"
              type="email"
              icon={Mail}
              placeholder="vous@exemple.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              label="Mot de passe"
              type="password"
              icon={Lock}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
            <Button type="submit" fullWidth loading={loading === 'register'} style={{ marginTop: '4px' }}>
              Créer mon compte
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
