import { createContext, useContext, useEffect, useState } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db, googleProvider } from '../lib/firebase'

const AuthContext = createContext(null)

function randomColor() {
  const colors = ['#8B7355', '#6B8E6B', '#7B8FB0', '#B07B8B', '#8B9B6B']
  return colors[Math.floor(Math.random() * colors.length)]
}

async function ensureUserDoc(firebaseUser) {
  const ref = doc(db, 'users', firebaseUser.uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: firebaseUser.uid,
      displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
      email: firebaseUser.email,
      color: randomColor(),
      createdAt: new Date()
    })
    return (await getDoc(ref)).data()
  }
  return snap.data()
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        const profile = await ensureUserDoc(firebaseUser)
        setUserProfile(profile)
      } else {
        setUser(null)
        setUserProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password)

  const loginWithGoogle = () => signInWithPopup(auth, googleProvider)

  const register = async (email, password, displayName) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName })
    await setDoc(doc(db, 'users', cred.user.uid), {
      uid: cred.user.uid,
      displayName,
      email,
      color: randomColor(),
      createdAt: new Date()
    })
    return cred
  }

  const logout = () => signOut(auth)

  const updateUserProfile = async (data) => {
    await setDoc(doc(db, 'users', user.uid), data, { merge: true })
    setUserProfile(prev => ({ ...prev, ...data }))
  }

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, login, loginWithGoogle, register, logout, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
