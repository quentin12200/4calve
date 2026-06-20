import { useState, useRef } from 'react'
import { Plus, X, CheckCircle2, Circle, Archive, BookMarked, Save, Trash2, Share2, Camera, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useHousehold } from '../contexts/HouseholdContext'
import { AppLayout } from '../components/layout/AppLayout'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { scanReceipt } from '../lib/openai'

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

function SaveTemplateModal({ onSave, onClose, currentItems }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      const items = currentItems.map(({ name, category }) => ({ name, category }))
      await onSave(name.trim(), items)
      toast.success('Modèle sauvegardé !')
      onClose()
    } catch {
      toast.error('Erreur')
    } finally {
      setLoading(false)
    }
  }
  return (
    <Modal open onClose={onClose} title="Sauvegarder comme modèle">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>{currentItems.length} article{currentItems.length !== 1 ? 's' : ''} seront sauvegardés</p>
        <Input label="Nom du modèle" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Courses du week-end" autoFocus required />
        <Button type="submit" fullWidth loading={loading}>Sauvegarder</Button>
      </form>
    </Modal>
  )
}

function TemplatesModal({ templates, onLoad, onDelete, onClose }) {
  return (
    <Modal open onClose={onClose} title="Modèles de listes">
      {templates.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
          Aucun modèle sauvegardé.<br />Crée une liste et sauvegarde-la !
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {templates.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text)' }}>{t.name}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{t.items?.length || 0} articles</div>
              </div>
              <button onClick={() => onLoad(t)} style={{ padding: '6px 12px', background: 'var(--color-accent)', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Charger
              </button>
              <button onClick={() => onDelete(t.id)} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex' }}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}

export default function ShoppingPage() {
  const { shopping, shoppingTemplates, addShoppingItem, updateShoppingItem, deleteShoppingItem, saveShoppingTemplate, deleteShoppingTemplate, loadShoppingTemplate, household } = useHousehold()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [showSave, setShowSave] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [scanning, setScanning] = useState(false)
  const inputRef = useRef(null)
  const cameraRef = useRef(null)

  const handleAdd = async (e) => {
    e?.preventDefault()
    const name = input.trim()
    if (!name) return
    setLoading(true)
    try {
      await addShoppingItem({ name, category: detectCategory(name) })
      setInput('')
      inputRef.current?.focus()
    } catch {
      toast.error('Erreur')
    } finally {
      setLoading(false)
    }
  }

  const toggleCheck = async (item) => {
    try { await updateShoppingItem(item.id, { checked: !item.checked }) } catch { toast.error('Erreur') }
  }

  const handleDelete = async (id) => {
    try { await deleteShoppingItem(id) } catch { toast.error('Erreur') }
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

  const handleLoadTemplate = async (template) => {
    try {
      await loadShoppingTemplate(template)
      toast.success(`"${template.name}" chargé !`)
      setShowTemplates(false)
    } catch {
      toast.error('Erreur')
    }
  }

  const handleScanReceipt = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setScanning(true)
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result.split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const items = await scanReceipt(base64)
      if (items.length === 0) { toast('Aucun article détecté'); return }
      await Promise.all(items.map(item => addShoppingItem({ name: item.name, category: item.category || detectCategory(item.name) })))
      toast.success(`${items.length} article${items.length > 1 ? 's' : ''} ajouté${items.length > 1 ? 's' : ''} depuis le ticket !`)
    } catch (err) {
      toast.error('Erreur scan : ' + err.message)
    } finally {
      setScanning(false)
      if (cameraRef.current) cameraRef.current.value = ''
    }
  }

  const handleShareList = () => {
    const url = `${window.location.origin}/share/${household?.id}`
    if (navigator.share) {
      navigator.share({ title: 'Liste de courses', url })
    } else {
      navigator.clipboard.writeText(url)
      toast.success('Lien copié !')
    }
  }

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
  const uncheckedItems = shopping.filter(i => !i.checked)

  const topBarActions = (
    <div style={{ display: 'flex', gap: 6 }}>
      <button onClick={handleShareList} style={{ padding: '6px 8px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--color-text-muted)' }}>
        <Share2 size={16} />
      </button>
      <button onClick={() => setShowTemplates(true)} style={{ padding: '6px 8px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--color-text-muted)' }}>
        <BookMarked size={16} />
      </button>
      {uncheckedItems.length > 0 && (
        <button onClick={() => setShowSave(true)} style={{ padding: '6px 8px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--color-text-muted)' }}>
          <Save size={16} />
        </button>
      )}
      <button onClick={() => cameraRef.current?.click()} disabled={scanning} style={{ padding: '6px 8px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--color-text-muted)' }}>
        {scanning ? <Loader2 size={16} /> : <Camera size={16} />}
      </button>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleScanReceipt} style={{ display: 'none' }} />
      {checkedCount > 0 && (
        <Button icon={Archive} size="sm" variant="secondary" onClick={handleArchive} loading={archiving}>
          ({checkedCount})
        </Button>
      )}
    </div>
  )

  return (
    <AppLayout title="Courses" topBarActions={topBarActions}>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Ajouter un article…"
            style={{
              flex: 1, padding: '10px 14px', fontSize: 15,
              background: 'var(--color-surface)', color: 'var(--color-text)',
              border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius, 10px)',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
          <Button icon={Plus} onClick={handleAdd} loading={loading} style={{ flexShrink: 0 }} />
        </div>

        {shopping.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '60px 0', fontSize: 15 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
            La liste est vide
            {shoppingTemplates.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <button onClick={() => setShowTemplates(true)} style={{ padding: '10px 20px', background: 'var(--color-accent)', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  Charger un modèle
                </button>
              </div>
            )}
          </div>
        ) : (
          sortedCategories.map(cat => (
            <div key={cat}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 16 }}>{CATEGORY_EMOJI[cat] || '📦'}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>{cat}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {grouped[cat].map(item => (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius, 10px)', padding: '10px 12px',
                  }}>
                    <button onClick={() => toggleCheck(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: item.checked ? 'var(--color-accent)' : 'var(--color-border)', flexShrink: 0 }}>
                      {item.checked ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                    </button>
                    <span style={{ flex: 1, fontSize: 15, color: item.checked ? 'var(--color-text-muted)' : 'var(--color-text)', textDecoration: item.checked ? 'line-through' : 'none' }}>
                      {item.name}
                    </span>
                    <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4, display: 'flex', borderRadius: 6 }}>
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {showSave && (
        <SaveTemplateModal
          currentItems={uncheckedItems}
          onSave={saveShoppingTemplate}
          onClose={() => setShowSave(false)}
        />
      )}
      {showTemplates && (
        <TemplatesModal
          templates={shoppingTemplates}
          onLoad={handleLoadTemplate}
          onDelete={deleteShoppingTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </AppLayout>
  )
}
