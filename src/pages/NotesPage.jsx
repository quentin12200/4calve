import { useState, useRef } from 'react'
import { Plus, Trash2, Pin, PinOff, Edit2, Check, X, Image, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../lib/firebase'
import { useHousehold } from '../contexts/HouseholdContext'
import { useAuth } from '../contexts/AuthContext'
import { AppLayout } from '../components/layout/AppLayout'
import { Avatar } from '../components/ui/Avatar'

const NOTE_COLORS = [
  { id: 'default', bg: 'var(--color-surface)', border: 'var(--color-border)' },
  { id: 'warm', bg: '#FFF8E8', border: '#F0D898' },
  { id: 'green', bg: '#EFF7EF', border: '#C8E6C8' },
  { id: 'blue', bg: '#EEF3FB', border: '#C8D8F0' },
  { id: 'pink', bg: '#FBF0F3', border: '#F0C8D4' },
  { id: 'purple', bg: '#F5F0FB', border: '#D8C8F0' },
]

async function uploadPhoto(file, uid) {
  const ext = file.name.split('.').pop()
  const path = `notes/${uid}/${Date.now()}.${ext}`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}

function NoteCard({ note, members, onDelete, onPin, onUpdate }) {
  const { user } = useAuth()
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(note.title || '')
  const [editContent, setEditContent] = useState(note.content || '')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)
  const author = members.find(m => m.id === note.createdBy)
  const color = NOTE_COLORS.find(c => c.id === note.color) || NOTE_COLORS[0]

  const handleSave = () => {
    if (!editTitle.trim() && !editContent.trim()) return
    onUpdate(note.id, { title: editTitle, content: editContent })
    setEditing(false)
    toast.success('Note modifiée')
  }

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadPhoto(file, user.uid)
      const existing = note.photos || []
      await onUpdate(note.id, { photos: [...existing, url] })
      toast.success('Photo ajoutée !')
    } catch {
      toast.error('Erreur upload')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{
      background: color.bg, border: `1px solid ${color.border}`,
      borderRadius: 'var(--radius)', padding: 16,
      display: 'flex', flexDirection: 'column', gap: 10,
      boxShadow: note.pinned ? '0 2px 12px rgba(0,0,0,0.1)' : 'none',
      position: 'relative'
    }}>
      {note.pinned && (
        <div style={{ position: 'absolute', top: 10, right: 10 }}>
          <Pin size={13} color="var(--color-accent)" fill="var(--color-accent)" />
        </div>
      )}

      {editing ? (
        <>
          <input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Titre" autoFocus
            style={{ border: 'none', background: 'transparent', fontSize: 15, fontWeight: 600, color: 'var(--color-text)', outline: 'none', width: '100%' }} />
          <textarea value={editContent} onChange={e => setEditContent(e.target.value)} placeholder="Contenu..."
            style={{ border: 'none', background: 'transparent', fontSize: 14, color: 'var(--color-text)', outline: 'none', resize: 'none', minHeight: 80, width: '100%' }} />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setEditing(false)} style={{ padding: '6px 12px', borderRadius: 8, color: 'var(--color-text-muted)', fontSize: 13 }}><X size={14} /></button>
            <button onClick={handleSave} style={{ padding: '6px 12px', borderRadius: 8, background: 'var(--color-accent)', color: 'white', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Check size={14} /> Sauver
            </button>
          </div>
        </>
      ) : (
        <>
          {note.title && <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--color-text)', margin: 0 }}>{note.title}</p>}
          {note.content && <p style={{ fontSize: 14, color: 'var(--color-text)', whiteSpace: 'pre-wrap', lineHeight: 1.5, margin: 0 }}>{note.content}</p>}
          {note.photos?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {note.photos.map((url, i) => (
                <img key={i} src={url} alt="" style={{ width: '100%', borderRadius: 8, objectFit: 'cover', maxHeight: 180 }} />
              ))}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {author && <Avatar name={author.displayName} color={author.color} size="sm" />}
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                {note.createdAt?.toDate ? format(note.createdAt.toDate(), 'd MMM', { locale: fr }) : ''}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => setEditing(true)} style={{ padding: 6, color: 'var(--color-text-muted)', borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer' }}><Edit2 size={14} /></button>
              <button onClick={() => fileRef.current?.click()} style={{ padding: 6, color: 'var(--color-text-muted)', borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer' }}>
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Image size={14} />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
              <button onClick={() => onPin(note.id, !note.pinned)} style={{ padding: 6, color: note.pinned ? 'var(--color-accent)' : 'var(--color-text-muted)', borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer' }}>
                {note.pinned ? <PinOff size={14} /> : <Pin size={14} />}
              </button>
              <button onClick={() => onDelete(note.id)} style={{ padding: 6, color: 'var(--color-text-muted)', borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer' }}><Trash2 size={14} /></button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function AddNoteModal({ onAdd, onClose }) {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [color, setColor] = useState('default')
  const [loading, setLoading] = useState(false)
  const [photoUrl, setPhotoUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadPhoto(file, user.uid)
      setPhotoUrl(url)
    } catch {
      toast.error('Erreur upload')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() && !content.trim()) return toast.error('Note vide')
    setLoading(true)
    try {
      await onAdd({ title, content, color, photos: photoUrl ? [photoUrl] : [] })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', zIndex: 1000 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--color-surface)', borderRadius: '20px 20px 0 0', padding: 24, width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
        <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 16 }}>Nouvelle note</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Titre (optionnel)" autoFocus
            style={{ padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 15, fontWeight: 600, outline: 'none' }} />
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Écris ta note ici..."
            style={{ padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 14, outline: 'none', resize: 'none', minHeight: 120 }} />
          {photoUrl && <img src={photoUrl} alt="" style={{ width: '100%', borderRadius: 8, objectFit: 'cover', maxHeight: 160 }} />}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>Couleur</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {NOTE_COLORS.map(c => (
                  <button key={c.id} type="button" onClick={() => setColor(c.id)} style={{ width: 28, height: 28, borderRadius: '50%', background: c.bg, border: `2px solid ${color === c.id ? 'var(--color-accent)' : c.border}`, cursor: 'pointer' }} />
                ))}
              </div>
            </div>
            <button type="button" onClick={() => fileRef.current?.click()} style={{ padding: '8px 12px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-muted)' }}>
              {uploading ? <Loader2 size={16} /> : <Image size={16} />}
              Photo
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
          </div>
          <button type="submit" disabled={loading} style={{ background: 'var(--color-accent)', color: 'white', padding: 13, borderRadius: 'var(--radius)', fontWeight: 600, fontSize: 15, marginTop: 4, border: 'none', cursor: 'pointer' }}>
            {loading ? 'Ajout...' : 'Ajouter la note'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function NotesPage() {
  const { notes, addNote, updateNote, deleteNote } = useHousehold()
  const [showAdd, setShowAdd] = useState(false)
  const members = useHousehold().members

  const pinned = (notes || []).filter(n => n.pinned).sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0))
  const others = (notes || []).filter(n => !n.pinned).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))

  const handleAdd = async (data) => {
    await addNote({ ...data, pinned: false })
    toast.success('Note ajoutée !')
  }

  const handlePin = async (id, pinned) => {
    await updateNote(id, { pinned })
    toast.success(pinned ? 'Note épinglée' : 'Note désépinglée')
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette note ?')) return
    await deleteNote(id)
    toast.success('Note supprimée')
  }

  return (
    <AppLayout title="Notes" rightAction={
      <button onClick={() => setShowAdd(true)} style={{ background: 'var(--color-accent)', color: 'white', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
        <Plus size={20} />
      </button>
    }>
      {(notes || []).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-muted)' }}>
          <p style={{ fontSize: 48, marginBottom: 12 }}>📝</p>
          <p style={{ fontWeight: 600, marginBottom: 6 }}>Aucune note</p>
          <p style={{ fontSize: 13 }}>Appuie sur + pour ajouter une note partagée</p>
        </div>
      ) : (
        <>
          {pinned.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>📌 Épinglées</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {pinned.map(n => <NoteCard key={n.id} note={n} members={members} onDelete={handleDelete} onPin={handlePin} onUpdate={updateNote} />)}
              </div>
            </div>
          )}
          {others.length > 0 && (
            <div>
              {pinned.length > 0 && <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Autres</p>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {others.map(n => <NoteCard key={n.id} note={n} members={members} onDelete={handleDelete} onPin={handlePin} onUpdate={updateNote} />)}
              </div>
            </div>
          )}
        </>
      )}

      {showAdd && <AddNoteModal onAdd={handleAdd} onClose={() => setShowAdd(false)} />}
    </AppLayout>
  )
}
