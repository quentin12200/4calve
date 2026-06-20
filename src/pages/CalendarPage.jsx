import { useState } from 'react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameDay, isSameMonth,
  format, isToday
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useHousehold } from '../contexts/HouseholdContext'
import { AppLayout } from '../components/layout/AppLayout'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'

const CATEGORY_COLORS = {
  perso: '#7B8FB0',
  pro: '#8B9B6B',
  médical: '#ef4444',
  social: '#B07B8B',
  maison: '#8B7355',
}

function toDate(val) {
  if (!val) return null
  if (val.toDate) return val.toDate()
  return new Date(val)
}

function AddEventModal({ open, onClose, defaultDate, members, addEvent }) {
  const df = defaultDate ? format(defaultDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
  const [form, setForm] = useState({
    title: '', startDate: df, endDate: df, startTime: '', endTime: '',
    location: '', category: 'perso', color: '#7B8FB0', who: [],
  })
  const [loading, setLoading] = useState(false)
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const toggleWho = (uid) => {
    setForm(f => ({
      ...f,
      who: f.who.includes(uid) ? f.who.filter(u => u !== uid) : [...f.who, uid]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Titre requis'); return }
    setLoading(true)
    try {
      await addEvent({
        ...form,
        startDate: new Date(form.startDate),
        endDate: new Date(form.endDate),
        color: CATEGORY_COLORS[form.category] || form.color,
      })
      toast.success('Événement ajouté !')
      onClose()
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
    <Modal open={open} onClose={onClose} title="Nouvel événement">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <Input label="Titre" value={form.title} onChange={set('title')} placeholder="Ex: Rendez-vous médecin" required />
        <div style={{ display: 'flex', gap: '8px' }}>
          <Input label="Début" type="date" value={form.startDate} onChange={set('startDate')} style={{ flex: 1 }} />
          <Input label="Fin" type="date" value={form.endDate} onChange={set('endDate')} style={{ flex: 1 }} />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Input label="Heure début" type="time" value={form.startTime} onChange={set('startTime')} style={{ flex: 1 }} />
          <Input label="Heure fin" type="time" value={form.endTime} onChange={set('endTime')} style={{ flex: 1 }} />
        </div>
        <Input label="Lieu" value={form.location} onChange={set('location')} placeholder="Optionnel" icon={MapPin} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={labelStyle}>Catégorie</label>
          <select value={form.category} onChange={set('category')} style={selectStyle}>
            <option value="perso">Perso</option>
            <option value="pro">Pro</option>
            <option value="médical">Médical</option>
            <option value="social">Social</option>
            <option value="maison">Maison</option>
          </select>
        </div>
        {members.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={labelStyle}>Qui ?</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {members.map(m => (
                <button key={m.id} type="button" onClick={() => toggleWho(m.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '999px', border: `2px solid ${form.who.includes(m.id) ? 'var(--color-accent)' : 'var(--color-border)'}`, background: form.who.includes(m.id) ? 'rgba(139,115,85,0.1)' : 'transparent', cursor: 'pointer' }}>
                  <Avatar name={m.displayName} color={m.color} size="sm" />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>{m.displayName}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <Button type="submit" fullWidth loading={loading}>Ajouter</Button>
      </form>
    </Modal>
  )
}

export default function CalendarPage() {
  const { events, members, addEvent, deleteEvent } = useHousehold()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(new Date())
  const [addModal, setAddModal] = useState(false)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days = []
  let d = calStart
  while (d <= calEnd) {
    days.push(d)
    d = addDays(d, 1)
  }

  const getEventsForDay = (day) =>
    events.filter(e => {
      const start = toDate(e.startDate)
      const end = toDate(e.endDate) || start
      return start && day >= start && day <= end
    })

  const selectedEvents = getEventsForDay(selectedDay)

  const handleDelete = async (event) => {
    if (!confirm(`Supprimer "${event.title}" ?`)) return
    try {
      await deleteEvent(event.id)
      toast.success('Événement supprimé')
    } catch {
      toast.error('Erreur')
    }
  }

  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  const topBarActions = (
    <Button icon={Plus} size="sm" onClick={() => setAddModal(true)}>Ajouter</Button>
  )

  return (
    <AppLayout title="Agenda" topBarActions={topBarActions}>
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Month nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text)', padding: '4px', display: 'flex' }}>
            <ChevronLeft size={24} />
          </button>
          <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--color-text)', textTransform: 'capitalize' }}>
            {format(currentMonth, 'MMMM yyyy', { locale: fr })}
          </span>
          <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text)', padding: '4px', display: 'flex' }}>
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Calendar grid */}
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '4px' }}>
            {dayNames.map(n => (
              <div key={n} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', padding: '4px 0' }}>{n}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {days.map(day => {
              const dayEvents = getEventsForDay(day)
              const isSelected = isSameDay(day, selectedDay)
              const isCurrentMonth = isSameMonth(day, currentMonth)
              const isTodayDay = isToday(day)

              return (
                <button key={day.toISOString()} onClick={() => setSelectedDay(day)}
                  style={{
                    padding: '6px 2px', border: 'none', cursor: 'pointer', borderRadius: '8px', minHeight: '48px',
                    background: isSelected ? 'var(--color-accent)' : isTodayDay ? 'rgba(139,115,85,0.1)' : 'transparent',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                    transition: 'background 0.1s',
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: isSelected || isTodayDay ? 800 : 500, color: isSelected ? '#fff' : isCurrentMonth ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
                    {format(day, 'd')}
                  </span>
                  {dayEvents.length > 0 && (
                    <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', justifyContent: 'center' }}>
                      {dayEvents.slice(0, 3).map((ev, i) => (
                        <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: isSelected ? '#fff' : (ev.color || 'var(--color-accent)') }} />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected day events */}
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 10px 0', textTransform: 'capitalize' }}>
            {format(selectedDay, 'EEEE d MMMM', { locale: fr })}
          </h3>
          {selectedEvents.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '24px 0', fontSize: '14px' }}>
              Aucun événement ce jour
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedEvents.map(event => {
                const whoMembers = (event.who || []).map(uid => members.find(m => m.id === uid)).filter(Boolean)
                return (
                  <div key={event.id} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius, 10px)', padding: '12px 14px', borderLeft: `3px solid ${event.color || 'var(--color-accent)'}` }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: '14px' }}>{event.title}</div>
                        {(event.startTime || event.endTime) && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                            <Clock size={12} />
                            {event.startTime}{event.endTime ? ` → ${event.endTime}` : ''}
                          </div>
                        )}
                        {event.location && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                            <MapPin size={12} />
                            {event.location}
                          </div>
                        )}
                        {event.category && (
                          <div style={{ marginTop: '6px' }}>
                            <Badge color={event.color || 'info'}>{event.category}</Badge>
                          </div>
                        )}
                        {whoMembers.length > 0 && (
                          <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                            {whoMembers.map(m => <Avatar key={m.id} name={m.displayName} color={m.color} size="sm" />)}
                          </div>
                        )}
                      </div>
                      <button onClick={() => handleDelete(event)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '2px', display: 'flex' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <AddEventModal
        open={addModal}
        onClose={() => setAddModal(false)}
        defaultDate={selectedDay}
        members={members}
        addEvent={addEvent}
      />
    </AppLayout>
  )
}
