import { useEffect, useRef } from 'react'
import { isToday, isPast } from 'date-fns'

function toDate(val) {
  if (!val) return null
  if (val.toDate) return val.toDate()
  return new Date(val)
}

export function useNotifications(tasks) {
  const notifiedRef = useRef(new Set())

  useEffect(() => {
    if (!('Notification' in window)) return
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    if (!tasks?.length) return
    if (Notification.permission !== 'granted') return

    const dueTasks = tasks.filter(t => {
      if (t.done) return false
      const d = toDate(t.dueDate)
      if (!d) return false
      return isToday(d) || isPast(d)
    })

    for (const task of dueTasks) {
      if (notifiedRef.current.has(task.id)) continue
      notifiedRef.current.add(task.id)
      new Notification('Tâche à faire — Chez Nous', {
        body: task.title,
        icon: '/icons/icon-192.png',
        tag: task.id,
      })
    }
  }, [tasks])
}
