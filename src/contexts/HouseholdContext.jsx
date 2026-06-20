import { createContext, useContext, useEffect, useState } from 'react'
import {
  doc, getDoc, setDoc, updateDoc, onSnapshot, collection,
  addDoc, deleteDoc, getDocs, query, orderBy, where, serverTimestamp
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from './AuthContext'

const HouseholdContext = createContext(null)

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export function HouseholdProvider({ children }) {
  const { user } = useAuth()
  const [household, setHousehold] = useState(null)
  const [members, setMembers] = useState([])
  const [tasks, setTasks] = useState([])
  const [shopping, setShopping] = useState([])
  const [meals, setMeals] = useState([])
  const [events, setEvents] = useState([])
  const [expenses, setExpenses] = useState([])
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    const unsub = onSnapshot(doc(db, 'users', user.uid), async (snap) => {
      const data = snap.data()
      if (data?.householdId) {
        const hSnap = await getDoc(doc(db, 'households', data.householdId))
        if (hSnap.exists()) setHousehold({ id: hSnap.id, ...hSnap.data() })
      }
      setLoading(false)
    })
    return unsub
  }, [user])

  useEffect(() => {
    if (!household?.id) return
    const hid = household.id
    const subs = []

    subs.push(onSnapshot(query(collection(db, `households/${hid}/tasks`), orderBy('createdAt', 'desc')), s => {
      setTasks(s.docs.map(d => ({ id: d.id, ...d.data() })))
    }))
    subs.push(onSnapshot(query(collection(db, `households/${hid}/shopping`), orderBy('createdAt', 'asc')), s => {
      setShopping(s.docs.map(d => ({ id: d.id, ...d.data() })))
    }))
    subs.push(onSnapshot(query(collection(db, `households/${hid}/meals`), orderBy('date', 'asc')), s => {
      setMeals(s.docs.map(d => ({ id: d.id, ...d.data() })))
    }))
    subs.push(onSnapshot(query(collection(db, `households/${hid}/events`), orderBy('startDate', 'asc')), s => {
      setEvents(s.docs.map(d => ({ id: d.id, ...d.data() })))
    }))
    subs.push(onSnapshot(query(collection(db, `households/${hid}/expenses`), orderBy('date', 'desc')), s => {
      setExpenses(s.docs.map(d => ({ id: d.id, ...d.data() })))
    }))
    subs.push(onSnapshot(query(collection(db, `households/${hid}/notes`), orderBy('createdAt', 'desc')), s => {
      setNotes(s.docs.map(d => ({ id: d.id, ...d.data() })))
    }))

    if (household.members) {
      Promise.all(household.members.map(uid => getDoc(doc(db, 'users', uid))))
        .then(snaps => setMembers(snaps.filter(s => s.exists()).map(s => ({ id: s.id, ...s.data() }))))
    }

    return () => subs.forEach(u => u())
  }, [household?.id])

  const createHousehold = async (name) => {
    const code = generateCode()
    const ref = await addDoc(collection(db, 'households'), {
      name, inviteCode: code, members: [user.uid], createdBy: user.uid, createdAt: serverTimestamp()
    })
    await setDoc(doc(db, 'users', user.uid), { householdId: ref.id }, { merge: true })
    return { id: ref.id, inviteCode: code }
  }

  const joinHousehold = async (code) => {
    const snap = await getDocs(query(collection(db, 'households'), where('inviteCode', '==', code)))
    if (snap.empty) throw new Error('Code invalide')
    const hDoc = snap.docs[0]
    await updateDoc(doc(db, 'households', hDoc.id), { members: [...(hDoc.data().members || []), user.uid] })
    await setDoc(doc(db, 'users', user.uid), { householdId: hDoc.id }, { merge: true })
  }

  const h = (sub) => `households/${household.id}/${sub}`

  const addTask = (data) => addDoc(collection(db, h('tasks')), { ...data, createdBy: user.uid, createdAt: serverTimestamp(), done: false })
  const updateTask = (id, data) => updateDoc(doc(db, h('tasks'), id), data)
  const deleteTask = (id) => deleteDoc(doc(db, h('tasks'), id))

  const addShoppingItem = (data) => addDoc(collection(db, h('shopping')), { ...data, createdBy: user.uid, createdAt: serverTimestamp(), checked: false })
  const updateShoppingItem = (id, data) => updateDoc(doc(db, h('shopping'), id), data)
  const deleteShoppingItem = (id) => deleteDoc(doc(db, h('shopping'), id))

  const addMeal = (data) => addDoc(collection(db, h('meals')), { ...data, createdBy: user.uid, createdAt: serverTimestamp() })
  const updateMeal = (id, data) => updateDoc(doc(db, h('meals'), id), data)
  const deleteMeal = (id) => deleteDoc(doc(db, h('meals'), id))

  const addEvent = (data) => addDoc(collection(db, h('events')), { ...data, createdBy: user.uid, createdAt: serverTimestamp() })
  const updateEvent = (id, data) => updateDoc(doc(db, h('events'), id), data)
  const deleteEvent = (id) => deleteDoc(doc(db, h('events'), id))

  const addExpense = (data) => addDoc(collection(db, h('expenses')), { ...data, createdBy: user.uid, createdAt: serverTimestamp() })
  const updateExpense = (id, data) => updateDoc(doc(db, h('expenses'), id), data)
  const deleteExpense = (id) => deleteDoc(doc(db, h('expenses'), id))

  const addNote = (data) => addDoc(collection(db, h('notes')), { ...data, createdBy: user.uid, createdAt: serverTimestamp() })
  const updateNote = (id, data) => updateDoc(doc(db, h('notes'), id), { ...data, updatedAt: serverTimestamp() })
  const deleteNote = (id) => deleteDoc(doc(db, h('notes'), id))

  return (
    <HouseholdContext.Provider value={{
      household, members, tasks, shopping, meals, events, expenses, notes, loading,
      createHousehold, joinHousehold,
      addTask, updateTask, deleteTask,
      addShoppingItem, updateShoppingItem, deleteShoppingItem,
      addMeal, updateMeal, deleteMeal,
      addEvent, updateEvent, deleteEvent,
      addExpense, updateExpense, deleteExpense,
      addNote, updateNote, deleteNote
    }}>
      {children}
    </HouseholdContext.Provider>
  )
}

export const useHousehold = () => useContext(HouseholdContext)
