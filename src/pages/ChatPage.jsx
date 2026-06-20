import { useState, useEffect, useRef } from 'react'
import { Send, Trash2 } from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { useHousehold } from '../contexts/HouseholdContext'
import { useAuth } from '../contexts/AuthContext'
import { AppLayout } from '../components/layout/AppLayout'
import { Avatar } from '../components/ui/Avatar'

function toDate(val) {
  if (!val) return null
  if (val.toDate) return val.toDate()
  return new Date(val)
}

function formatMsgDate(date) {
  if (!date) return ''
  if (isToday(date)) return format(date, 'HH:mm')
  if (isYesterday(date)) return `Hier ${format(date, 'HH:mm')}`
  return format(date, 'd MMM HH:mm', { locale: fr })
}

function DateDivider({ date }) {
  const label = isToday(date) ? "Aujourd'hui" : isYesterday(date) ? 'Hier' : format(date, 'EEEE d MMMM', { locale: fr })
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
      <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'capitalize' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
    </div>
  )
}

export default function ChatPage() {
  const { messages, members, sendMessage, deleteMessage } = useHousehold()
  const { user } = useAuth()
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e) => {
    e?.preventDefault()
    if (!text.trim()) return
    setSending(true)
    try {
      await sendMessage(text)
      setText('')
    } catch {
      toast.error('Erreur envoi')
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (msg) => {
    if (msg.createdBy !== user.uid) return
    try {
      await deleteMessage(msg.id)
    } catch {
      toast.error('Erreur')
    }
  }

  // Group messages by day for dividers
  let lastDay = null
  const rendered = []
  for (const msg of messages) {
    const d = toDate(msg.createdAt)
    const dayStr = d ? format(d, 'yyyy-MM-dd') : null
    if (dayStr && dayStr !== lastDay) {
      rendered.push({ type: 'divider', date: d, key: 'div-' + dayStr })
      lastDay = dayStr
    }
    rendered.push({ type: 'msg', msg })
  }

  return (
    <AppLayout title="Messages">
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-muted)' }}>
              <p style={{ fontSize: 40, marginBottom: 12 }}>💬</p>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>Pas encore de messages</p>
              <p style={{ fontSize: 13 }}>Commencez à discuter avec votre foyer !</p>
            </div>
          )}
          {rendered.map(item => {
            if (item.type === 'divider') return <DateDivider key={item.key} date={item.date} />
            const { msg } = item
            const author = members.find(m => m.id === msg.createdBy)
            const isMe = msg.createdBy === user.uid
            const d = toDate(msg.createdAt)
            return (
              <div key={msg.id} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8, marginBottom: 4 }}>
                {!isMe && <Avatar name={author?.displayName || '?'} color={author?.color} size="sm" />}
                <div style={{ maxWidth: '75%' }}>
                  {!isMe && author && (
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 2, paddingLeft: 4 }}>{author.displayName}</div>
                  )}
                  <div
                    style={{
                      padding: '9px 13px',
                      borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background: isMe ? 'var(--color-accent)' : 'var(--color-surface)',
                      border: isMe ? 'none' : '1px solid var(--color-border)',
                      color: isMe ? 'white' : 'var(--color-text)',
                      fontSize: 14,
                      lineHeight: 1.4,
                      wordBreak: 'break-word',
                    }}
                    onDoubleClick={() => handleDelete(msg)}
                  >
                    {msg.text}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2, textAlign: isMe ? 'right' : 'left', paddingLeft: isMe ? 0 : 4, paddingRight: isMe ? 4 : 0 }}>
                    {formatMsgDate(d)}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} style={{
          display: 'flex', gap: 8, padding: '12px 16px',
          borderTop: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        }}>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Message…"
            autoComplete="off"
            style={{
              flex: 1, padding: '10px 14px', fontSize: 15,
              background: 'var(--color-bg)', color: 'var(--color-text)',
              border: '1.5px solid var(--color-border)', borderRadius: 24,
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            style={{
              width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: text.trim() ? 'var(--color-accent)' : 'var(--color-border)',
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'background 0.15s',
            }}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </AppLayout>
  )
}
