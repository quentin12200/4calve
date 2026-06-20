import { useNavigate } from 'react-router-dom'
import { isToday, isPast, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CheckSquare, ShoppingCart, UtensilsCrossed, CalendarDays, Wallet, ChevronRight, MessageCircle, UserPlus } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useHousehold } from '../contexts/HouseholdContext'
import { useNotifications } from '../hooks/useNotifications'
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

function BalanceBar({ members, tasks, expenses }) {
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const scores = members.map(m => {
    const tasksDone = tasks.filter(t =>
      t.done && t.doneBy === m.id && t.doneAt &&
      isWithinInterval(toDate(t.doneAt), { start: monthStart, end: monthEnd })
    ).length
    const expensesPaid = expenses.filter(e =>
      e.paidBy === m.id && e.date &&
      isWithinInterval(toDate(e.date), { start: monthStart, end: monthEnd })
    ).reduce((a, e) => a + (e.amount || 0), 0)
    return { member: m, tasksDone, expensesPaid }
  })

  const totalTasks = scores.reduce((a, s) => a + s.tasksDone, 0)
  const totalExp = scores.reduce((a, s) => a + s.expensesPaid, 0)

  if (totalTasks === 0 && totalExp === 0) return null

  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 12px' }}>Équilibre ce mois-ci</h2>
      <Card style={{ padding: 16 }}>
        {scores.map(({ member, tasksDone, expensesPaid }) => {
          const taskPct = totalTasks > 0 ? Math.round((tasksDone / totalTasks) * 100) : 0
          const expPct = totalExp > 0 ? Math.round((expensesPaid / totalExp) * 100) : 0
          return (
            <div key={member.id} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Avatar name={member.displayName} color={member.color} size="sm" />
                <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text)', flex: 1 }}>{member.displayName}</span>
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{tasksDone} tâche{tasksDone !== 1 ? 's' : ''}</span>
                {totalExp > 0 && <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>· {expensesPaid.toFixed(0)} €</span>}
              </div>
              {totalTasks > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckSquare size={12} color="var(--color-text-muted)" />
                  <div style={{ flex: 1, height: 6, background: 'var(--color-border)', borderRadius: 99 }}>
                    <div style={{ width: `${taskPct}%`, height: '100%', background: member.color || 'var(--color-accent)', borderRadius: 99, transition: 'width 0.4s' }} />
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)', minWidth: 28, textAlign: 'right' }}>{taskPct}%</span>
                </div>
              )}
            </div>
          )
        })}
        {scores.length >= 2 && totalTasks > 0 && (() => {
          const sorted = [...scores].sort((a, b) => b.tasksDone - a.tasksDone)
          const diff = sorted[0].tasksDone - sorted[1].tasksDone
          if (diff > 3) {
            return (
              <div style={{ marginTop: 4, padding: '8px 12px', background: 'rgba(var(--color-accent-rgb, 139,115,85),0.1)', borderRadius: 8, fontSize: 12, color: 'var(--color-text)', fontWeight: 600 }}>
                ⚡ {sorted[0].member.displayName} a fait {diff} tâches de plus ce mois-ci
              </div>
            )
          }
        })()}
      </Card>
    </div>
  )
}

export default function DashboardPage() {
  const { user, userProfile } = useAuth()
  const { household, members, tasks, meals, events, expenses, messages } = useHousehold()
  const navigate = useNavigate()

  useNotifications(tasks)

  const now = new Date()
  const todayTasks = tasks.filter(t => {
    if (t.done) return false
    if (!t.dueDate) return true
    const d = toDate(t.dueDate)
    return d && (isToday(d) || isPast(d))
  })

  const upcomingMeals = meals
    .filter(m => { const d = toDate(m.date); return d && (isToday(d) || d > now) })
    .slice(0, 2)

  const upcomingEvents = events
    .filter(e => { const d = toDate(e.startDate); return d && d >= now })
    .slice(0, 3)

  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
  const weekStats = members.map(m => ({
    member: m,
    count: tasks.filter(t => t.done && t.doneBy === m.id && t.doneAt && isWithinInterval(toDate(t.doneAt), { start: weekStart, end: weekEnd })).length
  }))

  const unreadMessages = messages.length > 0 ? messages.slice(-1)[0] : null

  const priorityColor = { haute: 'danger', normale: 'info', basse: 'success' }

  const sectionTitle = (text) => (
    <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 12px' }}>{text}</h2>
  )

  const quickActions = [
    { label: 'Tâches', icon: CheckSquare, to: '/tasks', color: '#7B8FB0' },
    { label: 'Courses', icon: ShoppingCart, to: '/shopping', color: '#6B8E6B' },
    { label: 'Repas', icon: UtensilsCrossed, to: '/meals', color: '#B07B8B' },
    { label: 'Agenda', icon: CalendarDays, to: '/calendar', color: '#8B9B6B' },
    { label: 'Dépenses', icon: Wallet, to: '/expenses', color: '#8B7355' },
    { label: 'Messages', icon: MessageCircle, to: '/chat', color: '#7B8FB0' },
  ]

  const name = userProfile?.displayName || user?.displayName || 'toi'

  const showInviteCode = () => {
    const code = household?.inviteCode
    if (!code) return
    if (navigator.share) {
      navigator.share({ title: 'Rejoindre notre foyer', text: `Code d'invitation : ${code}` })
    } else {
      navigator.clipboard.writeText(code)
      import('react-hot-toast').then(({ default: toast }) => toast.success(`Code copié : ${code}`))
    }
  }

  return (
    <AppLayout title={household?.name || 'Chez Nous'} topBarActions={
      <button onClick={showInviteCode} title="Inviter quelqu'un" style={{ padding: '6px 10px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 600 }}>
        <UserPlus size={16} /> Inviter
      </button>
    }>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>
            {getGreeting()}, {name} 👋
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 4 }}>
            {format(now, 'EEEE d MMMM', { locale: fr })}
          </p>
        </div>

        {/* Quick actions */}
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
          {quickActions.map(({ label, icon: Icon, to, color }) => (
            <button key={to} onClick={() => navigate(to)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius, 10px)', padding: '14px 16px', cursor: 'pointer',
              minWidth: 72, flexShrink: 0,
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} color={color} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)' }}>{label}</span>
            </button>
          ))}
        </div>

        {/* Last message preview */}
        {unreadMessages && (
          <Card style={{ padding: '12px 14px', cursor: 'pointer' }} onClick={() => navigate('/chat')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MessageCircle size={18} color="white" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text)' }}>
                  {members.find(m => m.id === unreadMessages.createdBy)?.displayName || 'Message'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {unreadMessages.text}
                </div>
              </div>
              <ChevronRight size={16} color="var(--color-text-muted)" />
            </div>
          </Card>
        )}

        {/* Today's tasks */}
        <div>
          {sectionTitle(`Aujourd'hui (${todayTasks.length})`)}
          {todayTasks.length === 0 ? (
            <Card style={{ padding: 20, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14 }}>
              ✨ Tout est fait pour aujourd'hui !
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {todayTasks.slice(0, 5).map(task => {
                const assignee = members.find(m => m.id === task.assignedTo)
                return (
                  <Card key={task.id} style={{ padding: '12px 14px' }} onClick={() => navigate('/tasks')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: 14 }}>{task.title}</div>
                        {task.dueDate && (
                          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
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
                <button onClick={() => navigate('/tasks')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-accent)', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 0' }}>
                  Voir tout <ChevronRight size={14} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Balance mensuelle */}
        <BalanceBar members={members} tasks={tasks} expenses={expenses} />

        {/* Upcoming meals */}
        {upcomingMeals.length > 0 && (
          <div>
            {sectionTitle('Prochains repas')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {upcomingMeals.map(meal => {
                const cook = members.find(m => m.id === meal.cookedBy)
                return (
                  <Card key={meal.id} style={{ padding: '12px 14px' }} onClick={() => navigate('/meals')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ fontSize: 24 }}>🍽️</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: 14 }}>{meal.dishName}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {upcomingEvents.map(event => (
                <Card key={event.id} style={{ padding: '12px 14px' }} onClick={() => navigate('/calendar')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: (event.color || 'var(--color-accent)') + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CalendarDays size={18} color={event.color || 'var(--color-accent)'} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: 14 }}>{event.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
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
            <Card style={{ padding: 16 }}>
              <div style={{ display: 'flex', gap: 24 }}>
                {weekStats.map(({ member, count }) => (
                  <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={member.displayName} color={member.color} size="md" />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--color-text)' }}>{count}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>tâche{count !== 1 ? 's' : ''} faite{count !== 1 ? 's' : ''}</div>
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
