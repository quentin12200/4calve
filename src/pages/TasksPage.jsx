import { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Plus, CheckCircle2, Circle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { useHousehold } from '../contexts/HouseholdContext'
import { AppLayout } from '../components/layout/AppLayout'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { Card } from '../components/ui/Card'

const priorityColor = { haute: 'danger', normale: 'info', basse: 'success' }

function toDate(val) {
  if (!val) return null
  if (val.toDate) return val.toDate()
  return new Date(val)
}

function AddTaskModal({ open, onClose, members, currentUser, addTask }) {
  const [form, setForm] = useState({
    title: '', description: '', assignedTo: currentUser?.uid || '',
    priority: 'normale', dueDate: '', recurrence: 'unique'
  })
  const [loading, setLoading] = useState(false)

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Titre requis'); return }
    setLoading(true)
    try {
      await addTask({
        ...form,
        dueDate: form.dueDate ? new Date(form.dueDate) : null,
      })
      toast.success('Tâche ajoutée !')
      onClose()
      setForm({ title: '', description: '', assignedTo: currentUser?.uid || '', priority: 'normale', dueDate: '', recurrence: 'unique' })
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
    <Modal open={open} onClose={onClose} title="Nouvelle tâche">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <Input label="Titre" value={form.title} onChange={set('title')} placeholder="Ex: Passer l'aspirateur" required />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={labelStyle}>Description</label>
          <textarea value={form.description} onChange={set('description')} placeholder="Optionnel…"
            style={{ ...selectStyle, minHeight: '80px', resize: 'vertical', fontFamily: 'inherit' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={labelStyle}>Assigné à</label>
          <select value={form.assignedTo} onChange={set('assignedTo')} style={selectStyle}>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.displayName}</option>
            ))}
            <option value="both">Les deux</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={labelStyle}>Priorité</label>
            <select value={form.priority} onChange={set('priority')} style={selectStyle}>
              <option value="basse">Basse</option>
              <option value="normale">Normale</option>
              <option value="haute">Haute</option>
            </select>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={labelStyle}>Récurrence</label>
            <select value={form.recurrence} onChange={set('recurrence')} style={selectStyle}>
              <option value="unique">Unique</option>
              <option value="quotidienne">Quotidienne</option>
              <option value="hebdomadaire">Hebdomadaire</option>
              <option value="mensuelle">Mensuelle</option>
            </select>
          </div>
        </div>
        <Input label="Date limite" type="date" value={form.dueDate} onChange={set('dueDate')} />
        <Button type="submit" fullWidth loading={loading}>Ajouter la tâche</Button>
      </form>
    </Modal>
  )
}

export default function TasksPage() {
  const { user } = useAuth()
  const { tasks, members, addTask, updateTask } = useHousehold()
  const [modalOpen, setModalOpen] = useState(false)
  const [view, setView] = useState('list') // 'list' | 'byPerson'
  const [filter, setFilter] = useState('all') // 'all' | 'todo' | 'done'

  const filteredTasks = tasks.filter(t => {
    if (filter === 'todo') return !t.done
    if (filter === 'done') return t.done
    return true
  })

  const toggleDone = async (task) => {
    try {
      if (task.done) {
        await updateTask(task.id, { done: false, doneAt: null, doneBy: null })
      } else {
        await updateTask(task.id, { done: true, doneAt: new Date(), doneBy: user.uid })
      }
    } catch {
      toast.error('Erreur')
    }
  }

  const tabStyle = (active) => ({
    padding: '6px 14px', borderRadius: '999px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
    background: active ? 'var(--color-accent)' : 'transparent',
    color: active ? '#fff' : 'var(--color-text-muted)',
    transition: 'all 0.15s',
  })

  const TaskCard = ({ task }) => {
    const assignee = members.find(m => m.id === task.assignedTo)
    const dueDate = toDate(task.dueDate)
    return (
      <Card style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => toggleDone(task)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: task.done ? 'var(--color-accent)' : 'var(--color-border)', flexShrink: 0 }}>
            {task.done ? <CheckCircle2 size={22} /> : <Circle size={22} />}
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, color: task.done ? 'var(--color-text-muted)' : 'var(--color-text)', fontSize: '14px', textDecoration: task.done ? 'line-through' : 'none' }}>
              {task.title}
            </div>
            {task.description && (
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {task.description}
              </div>
            )}
            {dueDate && (
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                {format(dueDate, 'd MMM', { locale: fr })}
              </div>
            )}
          </div>
          {task.priority && <Badge color={priorityColor[task.priority] || 'info'}>{task.priority}</Badge>}
          {assignee && <Avatar name={assignee.displayName} color={assignee.color} size="sm" />}
        </div>
      </Card>
    )
  }

  const topBarActions = (
    <Button icon={Plus} size="sm" onClick={() => setModalOpen(true)}>Ajouter</Button>
  )

  return (
    <AppLayout title="Tâches" topBarActions={topBarActions}>
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button style={tabStyle(filter === 'all')} onClick={() => setFilter('all')}>Toutes</button>
          <button style={tabStyle(filter === 'todo')} onClick={() => setFilter('todo')}>À faire</button>
          <button style={tabStyle(filter === 'done')} onClick={() => setFilter('done')}>Terminées</button>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '3px' }}>
            <button style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, background: view === 'list' ? 'var(--color-accent)' : 'transparent', color: view === 'list' ? '#fff' : 'var(--color-text-muted)' }} onClick={() => setView('list')}>Liste</button>
            <button style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, background: view === 'byPerson' ? 'var(--color-accent)' : 'transparent', color: view === 'byPerson' ? '#fff' : 'var(--color-text-muted)' }} onClick={() => setView('byPerson')}>Par personne</button>
          </div>
        </div>

        {view === 'list' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredTasks.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '40px 0', fontSize: '14px' }}>
                Aucune tâche ici 🎉
              </div>
            ) : filteredTasks.map(task => <TaskCard key={task.id} task={task} />)}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {members.map(member => {
              const memberTasks = filteredTasks.filter(t => t.assignedTo === member.id || t.assignedTo === 'both')
              return (
                <div key={member.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <Avatar name={member.displayName} color={member.color} size="sm" />
                    <span style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: '15px' }}>{member.displayName}</span>
                    <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>({memberTasks.length})</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {memberTasks.length === 0
                      ? <div style={{ color: 'var(--color-text-muted)', fontSize: '13px', padding: '8px 0' }}>Aucune tâche</div>
                      : memberTasks.map(task => <TaskCard key={task.id} task={task} />)
                    }
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <AddTaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        members={members}
        currentUser={user}
        addTask={addTask}
      />
    </AppLayout>
  )
}
