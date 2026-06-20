import { useState } from 'react'
import { startOfWeek, addDays, format, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Trash2, ShoppingCart } from 'lucide-react'
import toast from 'react-hot-toast'
import { useHousehold } from '../contexts/HouseholdContext'
import { AppLayout } from '../components/layout/AppLayout'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Avatar } from '../components/ui/Avatar'

function toDate(val) {
  if (!val) return null
  if (val.toDate) return val.toDate()
  return new Date(val)
}

function AddMealModal({ open, onClose, date, slot, members, addMeal, onAddIngredients }) {
  const [form, setForm] = useState({ dishName: '', cookedBy: members[0]?.id || '', recipeUrl: '', slot: slot || 'midi' })
  const [loading, setLoading] = useState(false)
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.dishName.trim()) { toast.error('Nom du plat requis'); return }
    setLoading(true)
    try {
      await addMeal({ ...form, date })
      toast.success('Repas ajouté !')
      onClose()
      setForm({ dishName: '', cookedBy: members[0]?.id || '', recipeUrl: '', slot: slot || 'midi' })
    } catch {
      toast.error('Erreur')
    } finally {
      setLoading(false)
    }
  }

  const selectStyle = {
    width: '100%', padding: '10px 14px', fontSize: '15px',
    background: 'var(--color-surface)', color: 'var(--color-text)',
    border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius, 10px)',
    outline: 'none', cursor: 'pointer', boxSizing: 'border-box',
  }
  const labelStyle = { fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)' }

  return (
    <Modal open={open} onClose={onClose} title="Ajouter un repas">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <Input label="Plat" value={form.dishName} onChange={set('dishName')} placeholder="Ex: Poulet rôti" required />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={labelStyle}>Moment</label>
          <select value={form.slot} onChange={set('slot')} style={selectStyle}>
            <option value="midi">Déjeuner</option>
            <option value="soir">Dîner</option>
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={labelStyle}>Qui cuisine</label>
          <select value={form.cookedBy} onChange={set('cookedBy')} style={selectStyle}>
            {members.map(m => <option key={m.id} value={m.id}>{m.displayName}</option>)}
            <option value="both">Les deux</option>
          </select>
        </div>
        <Input label="Recette (URL)" type="url" value={form.recipeUrl} onChange={set('recipeUrl')} placeholder="https://..." />
        <Button type="submit" fullWidth loading={loading}>Ajouter</Button>
      </form>
    </Modal>
  )
}

function AddIngredientsModal({ open, onClose, mealName, addShoppingItem }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const items = text.split('\n').map(l => l.trim()).filter(Boolean)
    if (items.length === 0) { toast.error('Aucun ingrédient'); return }
    setLoading(true)
    try {
      await Promise.all(items.map(name => addShoppingItem({ name, category: 'épicerie' })))
      toast.success(`${items.length} ingrédient${items.length > 1 ? 's' : ''} ajouté${items.length > 1 ? 's' : ''} aux courses`)
      onClose()
      setText('')
    } catch {
      toast.error('Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Ingrédients - ${mealName}`}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '6px' }}>
            Un ingrédient par ligne
          </label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={"Pommes de terre\nHaricots verts\nBeurre"}
            style={{
              width: '100%', minHeight: '140px', padding: '10px 14px', fontSize: '15px',
              background: 'var(--color-surface)', color: 'var(--color-text)',
              border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius, 10px)',
              outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          />
        </div>
        <Button type="submit" fullWidth loading={loading} icon={ShoppingCart}>Ajouter aux courses</Button>
      </form>
    </Modal>
  )
}

export default function MealsPage() {
  const { meals, members, addMeal, deleteMeal, addShoppingItem } = useHousehold()
  const [weekOffset, setWeekOffset] = useState(0)
  const [addModal, setAddModal] = useState(null) // { date, slot }
  const [ingrModal, setIngrModal] = useState(null) // meal object

  const weekStart = startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const getMeal = (date, slot) =>
    meals.find(m => {
      const d = toDate(m.date)
      return d && isSameDay(d, date) && m.slot === slot
    })

  const handleDelete = async (meal) => {
    if (!confirm(`Supprimer "${meal.dishName}" ?`)) return
    try {
      await deleteMeal(meal.id)
      toast.success('Repas supprimé')
    } catch {
      toast.error('Erreur')
    }
  }

  const SlotCell = ({ date, slot }) => {
    const meal = getMeal(date, slot)
    const cook = meal ? members.find(m => m.id === meal.cookedBy) : null

    if (meal) {
      return (
        <div style={{ background: 'var(--color-accent)', borderRadius: '8px', padding: '8px', minHeight: '60px', position: 'relative' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '4px', paddingRight: '20px' }}>{meal.dishName}</div>
          {cook && <Avatar name={cook.displayName} color={cook.color} size="sm" />}
          <div style={{ position: 'absolute', top: '4px', right: '4px', display: 'flex', gap: '2px' }}>
            <button onClick={() => setIngrModal(meal)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}>
              <ShoppingCart size={11} color="#fff" />
            </button>
            <button onClick={() => handleDelete(meal)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}>
              <Trash2 size={11} color="#fff" />
            </button>
          </div>
        </div>
      )
    }

    return (
      <button
        onClick={() => setAddModal({ date, slot })}
        style={{
          width: '100%', minHeight: '60px', background: 'var(--color-bg)',
          border: '1.5px dashed var(--color-border)', borderRadius: '8px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--color-text-muted)', transition: 'border-color 0.15s',
        }}
      >
        <Plus size={18} />
      </button>
    )
  }

  const isToday = (date) => isSameDay(date, new Date())

  return (
    <AppLayout title="Repas">
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Week nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => setWeekOffset(w => w - 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text)', padding: '4px', display: 'flex' }}>
            <ChevronLeft size={24} />
          </button>
          <span style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: '15px' }}>
            {format(weekStart, 'd MMM', { locale: fr })} – {format(addDays(weekStart, 6), 'd MMM yyyy', { locale: fr })}
          </span>
          <button onClick={() => setWeekOffset(w => w + 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text)', padding: '4px', display: 'flex' }}>
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Week grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {days.map(day => (
            <div key={day.toISOString()} style={{ display: 'grid', gridTemplateColumns: '72px 1fr 1fr', gap: '8px', alignItems: 'start' }}>
              <div style={{
                paddingTop: '8px',
                fontWeight: isToday(day) ? 800 : 600,
                fontSize: '13px',
                color: isToday(day) ? 'var(--color-accent)' : 'var(--color-text)',
              }}>
                <div>{format(day, 'EEE', { locale: fr })}</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 500 }}>{format(day, 'd MMM', { locale: fr })}</div>
              </div>
              <SlotCell date={day} slot="midi" />
              <SlotCell date={day} slot="soir" />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
          <span style={{ fontWeight: 600 }}>Midi</span>
          <span style={{ fontWeight: 600 }}>Soir</span>
        </div>
      </div>

      {addModal && (
        <AddMealModal
          open={!!addModal}
          onClose={() => setAddModal(null)}
          date={addModal.date}
          slot={addModal.slot}
          members={members}
          addMeal={addMeal}
          onAddIngredients={() => {}}
        />
      )}

      {ingrModal && (
        <AddIngredientsModal
          open={!!ingrModal}
          onClose={() => setIngrModal(null)}
          mealName={ingrModal.dishName}
          addShoppingItem={addShoppingItem}
        />
      )}
    </AppLayout>
  )
}
