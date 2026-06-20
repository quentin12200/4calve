import { useState, useRef } from 'react'
import { Plus, X, CheckCircle2, Circle, Archive } from 'lucide-react'
import toast from 'react-hot-toast'
import { useHousehold } from '../contexts/HouseholdContext'
import { AppLayout } from '../components/layout/AppLayout'
import { Button } from '../components/ui/Button'

const CATEGORIES = {
  'fruits & légumes': { keywords: ['pomme', 'poire', 'banane', 'orange', 'citron', 'tomate', 'salade', 'carotte', 'courgette', 'poivron', 'oignon', 'ail', 'poireau', 'champignon', 'avocat', 'fraise', 'raisin', 'fruits', 'légumes', 'laitue', 'épinards', 'brocoli'], emoji: '🥦' },
  'viande & poisson': { keywords: ['poulet', 'bœuf', 'porc', 'agneau', 'veau', 'saumon', 'thon', 'crevette', 'viande', 'steak', 'filet', 'poisson', 'jambon', 'lardon', 'saucisse'], emoji: '🥩' },
  'épicerie': { keywords: ['pâtes', 'riz', 'farine', 'sucre', 'huile', 'sel', 'poivre', 'café', 'thé', 'biscuit', 'confiture', 'miel', 'sauce', 'conserve', 'chocolat', 'céréales', 'pain', 'yaourt', 'fromage', 'lait', 'beurre', 'œuf', 'crème'], emoji: '🛒' },
  'hygiène': { keywords: ['shampoing', 'savon', 'dentifrice', 'brosse', 'rasoir', 'déodorant', 'crème', 'coton', 'mouchoir', 'papier toilette', 'serviette'], emoji: '🧴' },
  'maison': { keywords: ['lessive', 'liquide vaisselle', 'éponge', 'sac poubelle', 'essuie-tout', 'nettoyant', 'désinfectant', 'ampoule', 'pile', 'scotch'], emoji: '🏠' },
}

function detectCategory(name) {
  const lower = name.toLowerCase()
  for (const [cat, { keywords }] of Object.entries(CATEGORIES)) {
    if (keywords.some(k => lower.includes(k))) return cat
  }
  return 'autre'
}

const CATEGORY_EMOJI = { ...Object.fromEntries(Object.entries(CATEGORIES).map(([k, v]) => [k, v.emoji])), autre: '📦' }

export default function ShoppingPage() {
  const { shopping, addShoppingItem, updateShoppingItem, deleteShoppingItem } = useHousehold()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const inputRef = useRef(null)

  const handleAdd = async (e) => {
    e?.preventDefault()
    const name = input.trim()
    if (!name) return
    setLoading(true)
    try {
      const category = detectCategory(name)
      await addShoppingItem({ name, category })
      setInput('')
      inputRef.current?.focus()
    } catch {
      toast.error('Erreur')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAdd()
  }

  const toggleCheck = async (item) => {
    try {
      await updateShoppingItem(item.id, { checked: !item.checked })
    } catch {
      toast.error('Erreur')
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteShoppingItem(id)
    } catch {
      toast.error('Erreur')
    }
  }

  const handleArchive = async () => {
    const checked = shopping.filter(i => i.checked)
    if (checked.length === 0) { toast('Rien à archiver'); return }
    setArchiving(true)
    try {
      await Promise.all(checked.map(i => deleteShoppingItem(i.id)))
      toast.success(`${checked.length} article${checked.length > 1 ? 's' : ''} archivé${checked.length > 1 ? 's' : ''}`)
    } catch {
      toast.error('Erreur')
    } finally {
      setArchiving(false)
    }
  }

  // Group by category
  const grouped = {}
  shopping.forEach(item => {
    const cat = item.category || 'autre'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(item)
  })

  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const aHasUnchecked = grouped[a].some(i => !i.checked)
    const bHasUnchecked = grouped[b].some(i => !i.checked)
    if (aHasUnchecked && !bHasUnchecked) return -1
    if (!aHasUnchecked && bHasUnchecked) return 1
    return a.localeCompare(b)
  })

  const checkedCount = shopping.filter(i => i.checked).length

  const topBarActions = checkedCount > 0 ? (
    <Button icon={Archive} size="sm" variant="secondary" onClick={handleArchive} loading={archiving}>
      Archiver ({checkedCount})
    </Button>
  ) : null

  return (
    <AppLayout title="Courses" topBarActions={topBarActions}>
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Quick add */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ajouter un article…"
            style={{
              flex: 1, padding: '10px 14px', fontSize: '15px',
              background: 'var(--color-surface)', color: 'var(--color-text)',
              border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius, 10px)',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
          <Button icon={Plus} onClick={handleAdd} loading={loading} style={{ flexShrink: 0 }} />
        </div>

        {shopping.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '60px 0', fontSize: '15px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🛒</div>
            La liste est vide
          </div>
        ) : (
          sortedCategories.map(cat => (
            <div key={cat}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '16px' }}>{CATEGORY_EMOJI[cat] || '📦'}</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>{cat}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {grouped[cat].map(item => (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius, 10px)', padding: '10px 12px',
                  }}>
                    <button onClick={() => toggleCheck(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: item.checked ? 'var(--color-accent)' : 'var(--color-border)', flexShrink: 0 }}>
                      {item.checked ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                    </button>
                    <span style={{ flex: 1, fontSize: '15px', color: item.checked ? 'var(--color-text-muted)' : 'var(--color-text)', textDecoration: item.checked ? 'line-through' : 'none' }}>
                      {item.name}
                    </span>
                    <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px', display: 'flex', alignItems: 'center', borderRadius: '6px' }}>
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </AppLayout>
  )
}
