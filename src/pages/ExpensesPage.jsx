import { useState, useMemo } from 'react'
import { format, startOfMonth, endOfMonth, subMonths, addMonths, isWithinInterval } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, ShoppingCart, Utensils, Home, Music, Heart, MoreHorizontal, Trash2, Target } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { useHousehold } from '../contexts/HouseholdContext'
import { AppLayout } from '../components/layout/AppLayout'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Avatar } from '../components/ui/Avatar'
import { Card } from '../components/ui/Card'

const CATEGORIES = [
  { key: 'courses', label: 'Courses', icon: ShoppingCart, color: '#6B8E6B' },
  { key: 'resto', label: 'Resto', icon: Utensils, color: '#B07B8B' },
  { key: 'maison', label: 'Maison', icon: Home, color: '#8B7355' },
  { key: 'loisirs', label: 'Loisirs', icon: Music, color: '#7B8FB0' },
  { key: 'santé', label: 'Santé', icon: Heart, color: '#ef4444' },
  { key: 'autre', label: 'Autre', icon: MoreHorizontal, color: '#999' },
]

function getCategoryInfo(key) {
  return CATEGORIES.find(c => c.key === key) || CATEGORIES[CATEGORIES.length - 1]
}

function toDate(val) {
  if (!val) return null
  if (val.toDate) return val.toDate()
  return new Date(val)
}

function AddExpenseModal({ open, onClose, members, addExpense }) {
  const [form, setForm] = useState({ amount: '', description: '', category: 'courses', paidBy: members[0]?.id || '', date: format(new Date(), 'yyyy-MM-dd') })
  const [loading, setLoading] = useState(false)
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const amount = parseFloat(form.amount)
    if (!amount || amount <= 0) { toast.error('Montant invalide'); return }
    if (!form.description.trim()) { toast.error('Description requise'); return }
    setLoading(true)
    try {
      await addExpense({ ...form, amount, date: new Date(form.date) })
      toast.success('Dépense ajoutée !')
      onClose()
      setForm({ amount: '', description: '', category: 'courses', paidBy: members[0]?.id || '', date: format(new Date(), 'yyyy-MM-dd') })
    } catch { toast.error('Erreur') } finally { setLoading(false) }
  }

  const selectStyle = {
    width: '100%', padding: '10px 14px', fontSize: 15,
    background: 'var(--color-surface)', color: 'var(--color-text)',
    border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius, 10px)',
    outline: 'none', cursor: 'pointer', boxSizing: 'border-box',
  }
  const labelStyle = { fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)' }

  return (
    <Modal open={open} onClose={onClose} title="Nouvelle dépense">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Montant (€)" type="number" value={form.amount} onChange={set('amount')} placeholder="0.00" required style={{ fontSize: 22, fontWeight: 700 }} />
        <Input label="Description" value={form.description} onChange={set('description')} placeholder="Ex: Courses Monoprix" required />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={labelStyle}>Catégorie</label>
          <select value={form.category} onChange={set('category')} style={selectStyle}>
            {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={labelStyle}>Payé par</label>
          <select value={form.paidBy} onChange={set('paidBy')} style={selectStyle}>
            {members.map(m => <option key={m.id} value={m.id}>{m.displayName}</option>)}
          </select>
        </div>
        <Input label="Date" type="date" value={form.date} onChange={set('date')} />
        <Button type="submit" fullWidth loading={loading}>Ajouter</Button>
      </form>
    </Modal>
  )
}

function BudgetModal({ open, onClose, budgets, onSave }) {
  const [form, setForm] = useState(
    Object.fromEntries(CATEGORIES.map(c => [c.key, budgets?.[c.key] || '']))
  )
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const cleaned = {}
      for (const [k, v] of Object.entries(form)) {
        if (v !== '' && !isNaN(parseFloat(v))) cleaned[k] = parseFloat(v)
      }
      await onSave(cleaned)
      toast.success('Budgets mis à jour !')
      onClose()
    } catch { toast.error('Erreur') } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Budgets mensuels">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>Définissez un budget par catégorie pour suivre vos dépenses.</p>
        {CATEGORIES.map(c => (
          <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: c.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <c.icon size={16} color={c.color} />
            </div>
            <label style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>{c.label}</label>
            <input
              type="number"
              value={form[c.key]}
              onChange={e => setForm(f => ({ ...f, [c.key]: e.target.value }))}
              placeholder="—"
              style={{
                width: 90, padding: '8px 10px', fontSize: 14, textAlign: 'right',
                background: 'var(--color-bg)', color: 'var(--color-text)',
                border: '1.5px solid var(--color-border)', borderRadius: 8, outline: 'none',
              }}
            />
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>€</span>
          </div>
        ))}
        <Button type="submit" fullWidth loading={loading} style={{ marginTop: 4 }}>Enregistrer</Button>
      </form>
    </Modal>
  )
}

function BudgetBars({ monthExpenses, budgets }) {
  if (!budgets || Object.keys(budgets).length === 0) return null
  const rows = CATEGORIES.filter(c => budgets[c.key]).map(c => {
    const spent = monthExpenses.filter(e => e.category === c.key).reduce((a, e) => a + e.amount, 0)
    const limit = budgets[c.key]
    const pct = Math.min((spent / limit) * 100, 100)
    const over = spent > limit
    return { ...c, spent, limit, pct, over }
  })
  if (rows.length === 0) return null
  return (
    <Card style={{ padding: 16 }}>
      <div style={{ fontWeight: 700, color: 'var(--color-text)', marginBottom: 12, fontSize: 15 }}>Budgets</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rows.map(row => (
          <div key={row.key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{row.label}</span>
              <span style={{ fontSize: 12, color: row.over ? '#dc2626' : 'var(--color-text-muted)', fontWeight: row.over ? 700 : 400 }}>
                {row.spent.toFixed(0)} / {row.limit} €{row.over ? ' 🚨' : ''}
              </span>
            </div>
            <div style={{ height: 8, background: 'var(--color-border)', borderRadius: 99 }}>
              <div style={{ width: `${row.pct}%`, height: '100%', background: row.over ? '#dc2626' : row.color, borderRadius: 99, transition: 'width 0.4s' }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default function ExpensesPage() {
  const { user } = useAuth()
  const { expenses, members, household, addExpense, deleteExpense, updateBudgets } = useHousehold()
  const [monthDate, setMonthDate] = useState(new Date())
  const [addModal, setAddModal] = useState(false)
  const [budgetModal, setBudgetModal] = useState(false)

  const monthStart = startOfMonth(monthDate)
  const monthEnd = endOfMonth(monthDate)

  const monthExpenses = expenses.filter(e => {
    const d = toDate(e.date)
    return d && isWithinInterval(d, { start: monthStart, end: monthEnd })
  })

  const balance = useMemo(() => {
    if (members.length < 2) return null
    const totals = {}
    members.forEach(m => { totals[m.id] = 0 })
    monthExpenses.forEach(e => { if (totals[e.paidBy] !== undefined) totals[e.paidBy] += e.amount })
    const total = Object.values(totals).reduce((a, b) => a + b, 0)
    const share = total / members.length
    const debts = members.map(m => ({ member: m, balance: totals[m.id] - share }))
    return { total, share, debts }
  }, [monthExpenses, members])

  const chartData = CATEGORIES.map(cat => ({
    name: cat.label,
    amount: monthExpenses.filter(e => e.category === cat.key).reduce((a, e) => a + e.amount, 0),
    color: cat.color,
  })).filter(d => d.amount > 0)

  const handleDelete = async (expense) => {
    if (!confirm(`Supprimer "${expense.description}" ?`)) return
    try { await deleteExpense(expense.id); toast.success('Dépense supprimée') } catch { toast.error('Erreur') }
  }

  const topBarActions = (
    <div style={{ display: 'flex', gap: 6 }}>
      <button onClick={() => setBudgetModal(true)} style={{ padding: '6px 8px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--color-text-muted)' }}>
        <Target size={16} />
      </button>
      <Button icon={Plus} size="sm" onClick={() => setAddModal(true)}>Ajouter</Button>
    </div>
  )

  return (
    <AppLayout title="Dépenses" topBarActions={topBarActions}>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => setMonthDate(m => subMonths(m, 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text)', padding: 4, display: 'flex' }}>
            <ChevronLeft size={24} />
          </button>
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-text)', textTransform: 'capitalize' }}>
            {format(monthDate, 'MMMM yyyy', { locale: fr })}
          </span>
          <button onClick={() => setMonthDate(m => addMonths(m, 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text)', padding: 4, display: 'flex' }}>
            <ChevronRight size={24} />
          </button>
        </div>

        {balance && members.length >= 2 && (
          <Card style={{ padding: 16 }}>
            <div style={{ fontWeight: 700, color: 'var(--color-text)', marginBottom: 12, fontSize: 15 }}>Balance du mois</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-accent)', marginBottom: 12 }}>
              {balance.total.toFixed(2)} €
            </div>
            {balance.debts.map(({ member, balance: b }) => (
              <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <Avatar name={member.displayName} color={member.color} size="sm" />
                <span style={{ fontSize: 14, color: 'var(--color-text)', flex: 1 }}>{member.displayName}</span>
                <span style={{ fontWeight: 700, color: b >= 0 ? '#16a34a' : '#dc2626', fontSize: 15 }}>
                  {b >= 0 ? '+' : ''}{b.toFixed(2)} €
                </span>
              </div>
            ))}
            {balance.debts.length >= 2 && (() => {
              const sorted = [...balance.debts].sort((a, b) => a.balance - b.balance)
              const debtor = sorted[0]; const creditor = sorted[sorted.length - 1]
              if (Math.abs(debtor.balance) > 0.01) return (
                <div style={{ marginTop: 8, padding: '10px', background: 'rgba(239,68,68,0.08)', borderRadius: 8, fontSize: 13, color: 'var(--color-text)', fontWeight: 600 }}>
                  💸 {debtor.member.displayName} doit {Math.abs(debtor.balance).toFixed(2)} € à {creditor.member.displayName}
                </div>
              )
            })()}
          </Card>
        )}

        <BudgetBars monthExpenses={monthExpenses} budgets={household?.budgets} />

        {chartData.length > 0 && (
          <Card style={{ padding: 16 }}>
            <div style={{ fontWeight: 700, color: 'var(--color-text)', marginBottom: 12, fontSize: 15 }}>Par catégorie</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <Tooltip formatter={(v) => [`${v.toFixed(2)} €`]} />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        <div>
          <div style={{ fontWeight: 700, color: 'var(--color-text)', marginBottom: 10, fontSize: 15 }}>
            Dépenses ({monthExpenses.length})
          </div>
          {monthExpenses.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '40px 0', fontSize: 14 }}>
              Aucune dépense ce mois-ci 💰
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {monthExpenses.map(expense => {
                const cat = getCategoryInfo(expense.category)
                const Icon = cat.icon
                const payer = members.find(m => m.id === expense.paidBy)
                const expDate = toDate(expense.date)
                return (
                  <Card key={expense.id} style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: cat.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={18} color={cat.color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: 14 }}>{expense.description}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                          {payer && <span>{payer.displayName}</span>}
                          {expDate && <span>· {format(expDate, 'd MMM', { locale: fr })}</span>}
                        </div>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--color-text)', flexShrink: 0 }}>
                        {expense.amount.toFixed(2)} €
                      </div>
                      <button onClick={() => handleDelete(expense)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4, display: 'flex', flexShrink: 0 }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <AddExpenseModal open={addModal} onClose={() => setAddModal(false)} members={members} addExpense={addExpense} />
      {budgetModal && <BudgetModal open onClose={() => setBudgetModal(false)} budgets={household?.budgets} onSave={updateBudgets} />}
    </AppLayout>
  )
}
