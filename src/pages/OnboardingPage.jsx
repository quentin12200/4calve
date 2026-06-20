import { useState } from 'react'
import { Copy, Check, Home, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { useHousehold } from '../contexts/HouseholdContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export default function OnboardingPage() {
  const [mode, setMode] = useState(null) // 'create' | 'join'
  const [householdName, setHouseholdName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [inviteCode, setInviteCode] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const { createHousehold, joinHousehold } = useHousehold()

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!householdName.trim()) { toast.error('Nom requis'); return }
    setLoading(true)
    try {
      const result = await createHousehold(householdName.trim())
      setInviteCode(result.inviteCode)
      toast.success('Foyer créé !')
    } catch (err) {
      toast.error(err.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async (e) => {
    e.preventDefault()
    if (joinCode.trim().length !== 6) { toast.error('Code à 6 caractères'); return }
    setLoading(true)
    try {
      await joinHousehold(joinCode.trim().toUpperCase())
      toast.success('Foyer rejoint !')
    } catch (err) {
      toast.error(err.message || 'Code invalide')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Code copié !')
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
    maxWidth: '420px',
    padding: '32px',
  }

  const optionCardStyle = (selected) => ({
    border: `2px solid ${selected ? 'var(--color-accent)' : 'var(--color-border)'}`,
    borderRadius: 'var(--radius, 10px)',
    padding: '20px',
    cursor: 'pointer',
    background: selected ? 'rgba(var(--color-accent-rgb, 139,115,85),0.06)' : 'transparent',
    transition: 'all 0.15s',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  })

  const codeBoxStyle = {
    background: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius, 10px)',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '16px',
  }

  if (inviteCode) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>🎉</div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>Foyer créé !</h2>
            <p style={{ color: 'var(--color-text-muted)', marginTop: '8px', fontSize: '14px' }}>
              Partagez ce code avec votre partenaire pour qu'il rejoigne votre foyer.
            </p>
          </div>
          <div style={codeBoxStyle}>
            <span style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '6px', color: 'var(--color-accent)' }}>
              {inviteCode}
            </span>
            <button
              onClick={handleCopy}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, fontSize: '14px' }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copié' : 'Copier'}
            </button>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '12px', textAlign: 'center' }}>
            Ce code est valable pour rejoindre votre foyer "Chez Nous".
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>🏠</div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>Bienvenue !</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '6px' }}>
            Créez ou rejoignez un foyer pour commencer.
          </p>
        </div>

        {!mode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={optionCardStyle(false)} onClick={() => setMode('create')}>
              <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Home size={22} color="#fff" />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: '15px' }}>Créer un foyer</div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '2px' }}>Je commence un nouveau foyer</div>
              </div>
            </div>
            <div style={optionCardStyle(false)} onClick={() => setMode('join')}>
              <div style={{ width: 44, height: 44, borderRadius: '12px', background: '#6B8E6B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Users size={22} color="#fff" />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: '15px' }}>Rejoindre un foyer</div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '2px' }}>J'ai un code d'invitation</div>
              </div>
            </div>
          </div>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Nom de votre foyer"
              placeholder="Ex: Chez Martin & Julie"
              value={householdName}
              onChange={e => setHouseholdName(e.target.value)}
              required
              icon={Home}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="secondary" fullWidth onClick={() => setMode(null)} type="button">Retour</Button>
              <Button type="submit" fullWidth loading={loading}>Créer</Button>
            </div>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Code d'invitation (6 caractères)"
              placeholder="EX: AB12CD"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              required
              style={{ textTransform: 'uppercase', letterSpacing: '4px', fontSize: '18px', textAlign: 'center' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="secondary" fullWidth onClick={() => setMode(null)} type="button">Retour</Button>
              <Button type="submit" fullWidth loading={loading}>Rejoindre</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
