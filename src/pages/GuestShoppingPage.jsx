import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { CheckCircle2, Circle } from 'lucide-react'

const CATEGORY_EMOJI = {
  'fruits & légumes': '🥦', 'viande & poisson': '🥩',
  'épicerie': '🛒', 'hygiène': '🧴', 'maison': '🏠', 'autre': '📦',
}

export default function GuestShoppingPage() {
  const { householdId } = useParams()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!householdId) return
    const unsub = onSnapshot(
      query(collection(db, `households/${householdId}/shopping`), orderBy('createdAt', 'asc')),
      snap => {
        setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      () => setLoading(false)
    )
    return unsub
  }, [householdId])

  const grouped = {}
  items.forEach(item => {
    const cat = item.category || 'autre'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(item)
  })

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAF7F2' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🛒</div>
        <div style={{ color: '#888', fontSize: 14 }}>Chargement…</div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#2D2418', marginBottom: 4 }}>🛒 Liste de courses</h1>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>Partagée depuis l'app Chez Nous · lecture seule</p>

        {items.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#888', padding: '60px 0' }}>La liste est vide</div>
        ) : (
          Object.entries(grouped).map(([cat, catItems]) => (
            <div key={cat} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span>{CATEGORY_EMOJI[cat] || '📦'}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'capitalize' }}>{cat}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {catItems.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'white', borderRadius: 10, padding: '10px 12px', border: '1px solid #E8E0D0' }}>
                    {item.checked ? <CheckCircle2 size={20} color="#8B7355" /> : <Circle size={20} color="#D0C8B8" />}
                    <span style={{ fontSize: 15, color: item.checked ? '#AAA' : '#2D2418', textDecoration: item.checked ? 'line-through' : 'none' }}>
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        <div style={{ marginTop: 32, textAlign: 'center', fontSize: 12, color: '#BBB' }}>
          Chez Nous · Application familiale
        </div>
      </div>
    </div>
  )
}
