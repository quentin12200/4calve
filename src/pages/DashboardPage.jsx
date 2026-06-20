import { useNavigate } from 'react-router-dom'
import { isToday, isPast, startOfWeek, endOfWeek, isWithinInterval, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CheckSquare, ShoppingCart, UtensilsCrossed, CalendarDays, Wallet, ChevronRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useHousehold } from '../contexts/HouseholdContext'
import { Avatar } from '../components/ui/Avatar'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { AppLayout } from '../components/layout/AppLayout'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

function toDate(val) {
  if (!val) return null
  if (val.toDate) return val.toDate()
  return new Date(val)
}

export default function DashboardPage() {
  const { user, userProfile } = useAuth()
  const { household, members, tasks, meals, events } = useHousehold()
  const navigate = useNavigate()

  const now = new Date()
  const todayTasks = tasks.filter(t => {
    if (t.done) return false
    if (!t.dueDate) return true
    const d = toDate(t.dueDate)
    return d && (isToday(d) || isPast(d))
  })

  const upcomingMeals = meals
    .filter(m => {
      const d = toDate(m.date)
      return d && (isToday(d) || d > now)
    })
    .slice(0, 2)

  const upcomingEvents = events
    .filter(e => {
      const d = toDate(e.startDate)
      return d && d >= now
    })
    .slice(0, 3)

  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
  const weekStats = members.map(m => ({
    member: m,
    count: tasks.filter(t => t.done && t.doneBy === m.id && t.doneAt && isWithinInterval(toDate(t.doneAt), { start: weekStart, end: weekEnd })).length
  }))

  const priorityColor = { haute: 'danger', normale: 'info', basse: 'success' }

  const sectionTitle = (text) => (
    <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 12px 0' }}>{text}</h2>
  )

  const quickActions = [
    { label: 'Tâches', icon: CheckSquare, to: '/tasks', color: '#7B8FB0' },
    { label: 'Courses', icon: ShoppingCart, to: '/shopping', color: '#6B8E6B' },
    { label: 'Repas', icon: UtensilsCrossed, to: '/meals', color: '#B07B8B' },
    { label: 'Agenda', icon: CalendarDays, to: '/calendar', color: '#8B9B6B' },
    { label: 'Dépenses', icon: Wallet, to: '/expenses', color: '#8B7355' },
  ]

  const name = userProfile?.displayName || user?.displayName || 'toi'

  return (
    <AppLayout title={household?.name || 'Chez Nous'}>
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Greeting */}
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>
            {getGreeting()}, {name} 👋
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '4px' }}>
            {format(now, "EEEE d MMMM", { locale: fr })}
          </p>
        </div>

        {/* Quick actions */}
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
          {quickActions.map(({ label, icon: Icon, to, color }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius, 10px)', padding: '14px 16px', cursor: 'pointer',
                minWidth: '72px', flexShrink: 0, transition: 'transform 0.1s',
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: '10px', background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} color={color} />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)' }}>{label}</span>
            </button>
          ))}
        </div>

        {/* Today's tasks */}
        <div>
          {sectionTitle(`Aujourd'hui (${todayTasks.length})`)}
          {todayTasks.length === 0 ? (
            <Card style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '14px' }}>
              ✨ Tout est fait pour aujourd'hui !
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {todayTasks.slice(0, 5).map(task => {
                const assignee = members.find(m => m.id === task.assignedTo)
                return (
                  <Card key={task.id} style={{ padding: '12px 14px' }} onClick={() => navigate('/tasks')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '14px' }}>{task.title}</div>
                        {task.dueDate && (
                          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                            {format(toDate(task.dueDate), 'd MMM', { locale: fr })}
                          </div>
                        )}
                      </div>
                      {task.priority && <Badge color={priorityColor[task.priority] || 'info'}>{task.priority}</Badge>}
                      {assignee && <Avatar name={assignee.displayName} color={assignee.color} size="sm" />}
                    </div>
                  </Card>
                )
              })}
              {todayTasks.length > 5 && (
                <button onClick={() => navigate('/tasks')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-accent)', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 0' }}>
                  Voir tout <ChevronRight size={14} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Upcoming meals */}
        {upcomingMeals.length > 0 && (
          <div>
            {sectionTitle('Prochains repas')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {upcomingMeals.map(meal => {
                const cook = members.find(m => m.id === meal.cookedBy)
                return (
                  <Card key={meal.id} style={{ padding: '12px 14px' }} onClick={() => navigate('/meals')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ fontSize: '24px' }}>🍽️</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '14px' }}>{meal.dishName}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                          {format(toDate(meal.date), 'EEEE d MMM', { locale: fr })} · {meal.slot === 'midi' ? 'Déjeuner' : 'Dîner'}
                        </div>
                      </div>
                      {cook && <Avatar name={cook.displayName} color={cook.color} size="sm" />}
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Upcoming events */}
        {upcomingEvents.length > 0 && (
          <div>
            {sectionTitle('Événements à venir')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {upcomingEvents.map(event => (
                <Card key={event.id} style={{ padding: '12px 14px' }} onClick={() => navigate('/calendar')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '10px', background: (event.color || 'var(--color-accent)') + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CalendarDays size={18} color={event.color || 'var(--color-accent)'} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '14px' }}>{event.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        {format(toDate(event.startDate), 'EEEE d MMM', { locale: fr })}
                        {event.startTime && ` · ${event.startTime}`}
                        {event.location && ` · ${event.location}`}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Weekly stats */}
        {weekStats.some(s => s.count > 0) && (
          <div>
            {sectionTitle('Cette semaine')}
            <Card style={{ padding: '16px' }}>
              <div style={{ display: 'flex', gap: '24px' }}>
                {weekStats.map(({ member, count }) => (
                  <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Avatar name={member.displayName} color={member.color} size="md" />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '20px', color: 'var(--color-text)' }}>{count}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>tâche{count !== 1 ? 's' : ''} faite{count !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
