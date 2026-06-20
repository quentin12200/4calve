import { useState } from 'react'
import { startOfWeek, addDays, format, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Trash2, ShoppingCart, Sparkles, Loader2, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import { useHousehold } from '../contexts/HouseholdContext'
import { AppLayout } from '../components/layout/AppLayout'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Avatar } from '../components/ui/Avatar'
import { generateRecipe, suggestMealsForWeek, generateShoppingListFromMeals } from '../lib/openai'

function toDate(val) {
  if (!val) return null
  if (val.toDate) return val.toDate()
  return new Date(val)
}

// ─── Modal Gemini : Générer une recette ──────────────────────────────────────
function GeminiRecipeModal({ open, onClose, onAddToShopping }) {
  const [step, setStep] = useState('input') // 'input' | 'loading' | 'result'
  const [dishName, setDishName] = useState('')
  const [servings, setServings] = useState('2')
  const [constraints, setConstraints] = useState('')
  const [recipe, setRecipe] = useState(null)

  const handleGenerate = async () => {
    if (!dishName.trim()) return toast.error('Indique un plat')
    setStep('loading')
    try {
      const result = await generateRecipe(dishName, parseInt(servings), constraints)
      setRecipe(result)
      setStep('result')
    } catch (err) {
      console.error('Gemini error:', err)
      toast.error('Gemini : ' + (err.message || 'Erreur inconnue'), { duration: 6000 })
      setStep('input')
    }
  }

  const handleAddIngredients = async () => {
    if (!recipe) return
    await onAddToShopping(recipe.ingredients.map(i => `${i.quantity} ${i.name}`))
    toast.success(`${recipe.ingredients.length} ingrédients ajoutés aux courses`)
  }

  const s = { width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: 14, outline: 'none' }
  const l = { fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }

  return (
    <Modal open={open} onClose={() => { onClose(); setStep('input'); setRecipe(null); setDishName('') }} title="✨ Générer une recette avec Gemini">
      {step === 'input' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label style={l}>Nom du plat *</label><input style={s} value={dishName} onChange={e => setDishName(e.target.value)} placeholder="Ex: Risotto aux champignons" autoFocus /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={l}>Personnes</label><input type="number" min="1" max="10" style={s} value={servings} onChange={e => setServings(e.target.value)} /></div>
            <div><label style={l}>Contraintes</label><input style={s} value={constraints} onChange={e => setConstraints(e.target.value)} placeholder="Sans gluten…" /></div>
          </div>
          <button onClick={handleGenerate} style={{ background: 'linear-gradient(135deg, #8B7355, #B07B8B)', color: 'white', padding: '13px', borderRadius: 'var(--radius)', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Sparkles size={18} /> Générer avec Gemini
          </button>
        </div>
      )}

      {step === 'loading' && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Loader2 size={40} style={{ color: 'var(--color-accent)', animation: 'spin 1s linear infinite', marginBottom: 16 }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          <p style={{ color: 'var(--color-text-muted)' }}>Gemini prépare ta recette…</p>
        </div>
      )}

      {step === 'result' && recipe && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--color-accent-bg)', borderRadius: 'var(--radius)', padding: 14 }}>
            <h3 style={{ fontWeight: 700, fontSize: 17, color: 'var(--color-accent)', marginBottom: 6 }}>{recipe.name}</h3>
            <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--color-text-muted)' }}>
              <span>⏱ Prépa : {recipe.prepTime}</span>
              <span>🍳 Cuisson : {recipe.cookTime}</span>
              <span>📊 {recipe.difficulty}</span>
              <span>👤 {recipe.servings} pers.</span>
            </div>
          </div>

          <div>
            <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Ingrédients</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {recipe.ingredients?.map((ing, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, fontSize: 14, padding: '4px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-accent)', minWidth: 60 }}>{ing.quantity}</span>
                  <span>{ing.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Étapes</p>
            <ol style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recipe.steps?.map((step, i) => (
                <li key={i} style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--color-text)' }}>{step}</li>
              ))}
            </ol>
          </div>

          {recipe.tips && (
            <div style={{ background: 'var(--color-surface-alt)', borderRadius: 8, padding: 12, fontSize: 13, color: 'var(--color-text-muted)' }}>
              💡 {recipe.tips}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setStep('input'); setRecipe(null) }} style={{ flex: 1, padding: '11px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', fontWeight: 600, color: 'var(--color-text-muted)' }}>
              Nouvelle recette
            </button>
            <button onClick={handleAddIngredients} style={{ flex: 2, padding: '11px', borderRadius: 'var(--radius)', background: 'var(--color-success)', color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <ShoppingCart size={16} /> Ajouter aux courses
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

// ─── Modal suggestion semaine ─────────────────────────────────────────────────
function SuggestWeekModal({ open, onClose, weekDays, addMeal, members, userId }) {
  const [preferences, setPreferences] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState(null)

  const handleSuggest = async () => {
    setLoading(true)
    try {
      const data = await suggestMealsForWeek(preferences)
      setSuggestions(data.meals)
    } catch {
      toast.error('Erreur Gemini')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async () => {
    if (!suggestions) return
    setLoading(true)
    try {
      await Promise.all(suggestions.map((meal, i) => {
        const day = weekDays[i]
        if (!day) return null
        return addMeal({ dishName: meal.name, date: day.toISOString(), slot: 'soir', cookedBy: userId, recipeUrl: '' })
      }))
      toast.success('Semaine planifiée !')
      onClose()
      setSuggestions(null)
    } catch {
      toast.error('Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={() => { onClose(); setSuggestions(null) }} title="✨ Planifier la semaine avec Gemini">
      {!suggestions ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Gemini va suggérer 7 dîners variés et équilibrés pour la semaine.</p>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>Préférences / contraintes</label>
            <input
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: 14, outline: 'none' }}
              value={preferences} onChange={e => setPreferences(e.target.value)}
              placeholder="Sans viande rouge, cuisine méditerranéenne…"
            />
          </div>
          <button onClick={handleSuggest} disabled={loading} style={{ background: 'linear-gradient(135deg, #8B7355, #B07B8B)', color: 'white', padding: '13px', borderRadius: 'var(--radius)', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Génération…</> : <><Sparkles size={18} /> Suggérer 7 repas</>}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {suggestions.map((meal, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--color-surface-alt)', borderRadius: 8 }}>
              <span style={{ fontSize: 22 }}>{meal.emoji}</span>
              <div>
                <p style={{ fontWeight: 600, fontSize: 14 }}>{meal.name}</p>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{weekDays[i] ? format(weekDays[i], 'EEEE', { locale: fr }) : ''} · {meal.type}</p>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={() => setSuggestions(null)} style={{ flex: 1, padding: '11px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', fontWeight: 600, color: 'var(--color-text-muted)' }}>Regénérer</button>
            <button onClick={handleApply} disabled={loading} style={{ flex: 2, padding: '11px', borderRadius: 'var(--radius)', background: 'var(--color-accent)', color: 'white', fontWeight: 600 }}>
              {loading ? 'Ajout...' : '✓ Appliquer à la semaine'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

function AddMealModal({ open, onClose, date, slot, members, addMeal }) {
  const [form, setForm] = useState({ dishName: '', cookedBy: members[0]?.id || '', recipeUrl: '', slot: slot || 'midi' })
  const [loading, setLoading] = useState(false)
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const s = { width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: 14, outline: 'none' }
  const l = { fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.dishName.trim()) { toast.error('Nom du plat requis'); return }
    setLoading(true)
    try {
      await addMeal({ ...form, date: date.toISOString() })
      toast.success('Repas ajouté !')
      onClose()
    } catch { toast.error('Erreur') }
    finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Ajouter un repas">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div><label style={l}>Plat *</label><input style={s} value={form.dishName} onChange={set('dishName')} placeholder="Ex: Poulet rôti" required autoFocus /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div><label style={l}>Moment</label>
            <select value={form.slot} onChange={set('slot')} style={s}>
              <option value="midi">Déjeuner</option>
              <option value="soir">Dîner</option>
            </select>
          </div>
          <div><label style={l}>Qui cuisine</label>
            <select value={form.cookedBy} onChange={set('cookedBy')} style={s}>
              {members.map(m => <option key={m.id} value={m.id}>{m.displayName}</option>)}
              <option value="both">Les deux</option>
            </select>
          </div>
        </div>
        <div><label style={l}>Recette (URL)</label><input type="url" style={s} value={form.recipeUrl} onChange={set('recipeUrl')} placeholder="https://..." /></div>
        <button type="submit" disabled={loading} style={{ background: 'var(--color-accent)', color: 'white', padding: '12px', borderRadius: 'var(--radius)', fontWeight: 600 }}>
          {loading ? 'Ajout...' : 'Ajouter'}
        </button>
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
    if (!items.length) { toast.error('Aucun ingrédient'); return }
    setLoading(true)
    try {
      await Promise.all(items.map(name => addShoppingItem({ name, category: 'épicerie' })))
      toast.success(`${items.length} ingrédient(s) ajouté(s)`)
      onClose(); setText('')
    } catch { toast.error('Erreur') }
    finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Ingrédients — ${mealName}`}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Un ingrédient par ligne</p>
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder={"Pommes de terre\nHaricots verts\nBeurre"}
          style={{ width: '100%', minHeight: 120, padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: 14, outline: 'none', resize: 'vertical' }} />
        <button type="submit" disabled={loading} style={{ background: 'var(--color-success)', color: 'white', padding: '12px', borderRadius: 'var(--radius)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <ShoppingCart size={16} /> {loading ? 'Ajout...' : 'Ajouter aux courses'}
        </button>
      </form>
    </Modal>
  )
}

export default function MealsPage() {
  const { meals, members, addMeal, deleteMeal, addShoppingItem } = useHousehold()
  const [weekOffset, setWeekOffset] = useState(0)
  const [addModal, setAddModal] = useState(null)
  const [ingrModal, setIngrModal] = useState(null)
  const [geminiModal, setGeminiModal] = useState(false)
  const [suggestModal, setSuggestModal] = useState(false)
  const [shoppingLoading, setShoppingLoading] = useState(false)

  const weekStart = startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const getMeal = (date, slot) => meals.find(m => { const d = toDate(m.date); return d && isSameDay(d, date) && m.slot === slot })

  const handleAddToShopping = async (lines) => {
    await Promise.all(lines.map(name => addShoppingItem({ name, category: 'épicerie' })))
  }

  const handleGenerateWeekShopping = async () => {
    const weekMeals = days.flatMap(day =>
      ['midi', 'soir'].map(slot => getMeal(day, slot)).filter(Boolean).map(m => m.dishName)
    )
    if (weekMeals.length === 0) return toast.error('Aucun repas planifié cette semaine')
    setShoppingLoading(true)
    try {
      const data = await generateShoppingListFromMeals(weekMeals)
      await Promise.all(data.items.map(item =>
        addShoppingItem({ name: `${item.quantity} ${item.name}`, category: item.category || 'épicerie' })
      ))
      toast.success(`🛒 ${data.items.length} articles ajoutés aux courses !`)
    } catch (err) {
      toast.error('Erreur Gemini : ' + err.message)
    } finally {
      setShoppingLoading(false)
    }
  }

  const SlotCell = ({ date, slot }) => {
    const meal = getMeal(date, slot)
    const cook = meal ? members.find(m => m.id === meal.cookedBy) : null
    if (meal) return (
      <div style={{ background: 'var(--color-accent)', borderRadius: 8, padding: 8, minHeight: 60, position: 'relative' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 4, paddingRight: 20 }}>{meal.dishName}</div>
        {cook && <Avatar name={cook.displayName} color={cook.color} size="sm" />}
        <div style={{ position: 'absolute', top: 4, right: 4, display: 'flex', gap: 2 }}>
          {meal.recipeUrl && <a href={meal.recipeUrl} target="_blank" rel="noopener" style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 4, padding: 3, display: 'flex' }}><ExternalLink size={10} color="#fff" /></a>}
          <button onClick={() => setIngrModal(meal)} style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 4, padding: 3, display: 'flex' }}><ShoppingCart size={10} color="#fff" /></button>
          <button onClick={() => { if(confirm(`Supprimer "${meal.dishName}" ?`)) deleteMeal(meal.id) }} style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 4, padding: 3, display: 'flex' }}><Trash2 size={10} color="#fff" /></button>
        </div>
      </div>
    )
    return (
      <button onClick={() => setAddModal({ date, slot })} style={{ width: '100%', minHeight: 60, background: 'var(--color-bg)', border: '1.5px dashed var(--color-border)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
        <Plus size={18} />
      </button>
    )
  }

  return (
    <AppLayout title="Repas" topBarActions={
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={handleGenerateWeekShopping} disabled={shoppingLoading} style={{ background: '#6B8E6B', color: 'white', borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
          {shoppingLoading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <ShoppingCart size={13} />} Courses
        </button>
        <button onClick={() => setSuggestModal(true)} style={{ background: 'linear-gradient(135deg, #8B7355, #B07B8B)', color: 'white', borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Sparkles size={14} /> Semaine
        </button>
        <button onClick={() => setGeminiModal(true)} style={{ background: 'var(--color-accent)', color: 'white', borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Sparkles size={14} /> Recette
        </button>
      </div>
    }>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => setWeekOffset(w => w - 1)} style={{ color: 'var(--color-text)', padding: 4 }}><ChevronLeft size={24} /></button>
          <span style={{ fontWeight: 700, fontSize: 15 }}>
            {format(weekStart, 'd MMM', { locale: fr })} – {format(addDays(weekStart, 6), 'd MMM yyyy', { locale: fr })}
          </span>
          <button onClick={() => setWeekOffset(w => w + 1)} style={{ color: 'var(--color-text)', padding: 4 }}><ChevronRight size={24} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {days.map(day => (
            <div key={day.toISOString()} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 1fr', gap: 8, alignItems: 'start' }}>
              <div style={{ paddingTop: 8, fontWeight: isSameDay(day, new Date()) ? 800 : 600, fontSize: 13, color: isSameDay(day, new Date()) ? 'var(--color-accent)' : 'var(--color-text)' }}>
                <div>{format(day, 'EEE', { locale: fr })}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500 }}>{format(day, 'd MMM', { locale: fr })}</div>
              </div>
              <SlotCell date={day} slot="midi" />
              <SlotCell date={day} slot="soir" />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 40, fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600 }}>
          <span>← Midi</span><span>Soir →</span>
        </div>
      </div>

      {addModal && <AddMealModal open={true} onClose={() => setAddModal(null)} date={addModal.date} slot={addModal.slot} members={members} addMeal={addMeal} />}
      {ingrModal && <AddIngredientsModal open={true} onClose={() => setIngrModal(null)} mealName={ingrModal.dishName} addShoppingItem={addShoppingItem} />}
      <GeminiRecipeModal open={geminiModal} onClose={() => setGeminiModal(false)} onAddToShopping={handleAddToShopping} />
      <SuggestWeekModal open={suggestModal} onClose={() => setSuggestModal(false)} weekDays={days} addMeal={addMeal} members={members} userId={members[0]?.id} />
    </AppLayout>
  )
}
