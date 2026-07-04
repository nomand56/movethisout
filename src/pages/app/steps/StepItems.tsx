import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useJobCreationStore } from '../../../store/jobCreationStore'
import type { DraftJobItem, ItemSize } from '../../../types'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import Select from '../../../components/ui/Select'
import Modal from '../../../components/ui/Modal'
import { supabase } from '../../../lib/supabase'
import { useAuthStore } from '../../../store/authStore'

interface Props { onBack: () => void; onNext: () => void }

const EMPTY: Omit<DraftJobItem, 'id'> = { name: '', size: 'medium', quantity: 1, photo: null, photo_url: null }

const SIZE_OPTIONS = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'extra_large', label: 'Extra large' },
]

export default function StepItems({ onBack, onNext }: Props) {
  const { profile } = useAuthStore()
  const store = useJobCreationStore()
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Omit<DraftJobItem, 'id'>>(EMPTY)
  const [uploading, setUploading] = useState(false)
  const [formError, setFormError] = useState('')

  const openAdd = () => { setDraft(EMPTY); setEditId(null); setShowModal(true) }
  const openEdit = (item: DraftJobItem) => { setDraft(item); setEditId(item.id); setShowModal(true) }

  const handlePhotoChange = async (file: File | null) => {
    if (!file || !profile) return
    setUploading(true)
    const path = `${profile.id}/${Date.now()}_${file.name}`
    const { data } = await supabase.storage.from('item-photos').upload(path, file)
    setUploading(false)
    if (data) {
      const { data: url } = supabase.storage.from('item-photos').getPublicUrl(data.path)
      setDraft((d) => ({ ...d, photo: file, photo_url: url.publicUrl }))
    }
  }

  const saveItem = () => {
    if (!draft.name.trim()) { setFormError('Enter an item name'); return }
    if (draft.quantity < 1) { setFormError('Quantity must be at least 1'); return }
    setFormError('')
    if (editId) store.updateItem(editId, draft)
    else store.addItem(draft)
    setShowModal(false)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl uppercase">What&apos;s moving?</h2>
        <Button size="sm" variant="secondary" onClick={openAdd}><Plus size={16} className="mr-1" />Add</Button>
      </div>

      {store.items.length === 0 && (
        <div className="card-yard p-8 text-center bg-concrete">
          <p className="text-gray-600 text-sm mb-2">Add at least one item — couch, dresser, boxes…</p>
          <button onClick={openAdd} className="text-haul font-bold text-sm hover:underline">Add first item ▸</button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {store.items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 card-yard p-3">
            {item.photo_url && <img src={item.photo_url} alt={item.name} className="h-12 w-12 object-cover flex-shrink-0 border-2 border-jet" />}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-jet truncate">{item.name}</p>
              <p className="text-xs text-gray-500 capitalize">{item.size.replace('_', ' ')} × {item.quantity}</p>
            </div>
            <button onClick={() => openEdit(item)} className="text-xs font-bold text-haul uppercase">Edit</button>
            <button onClick={() => store.removeItem(item.id)} className="p-1 text-red-600">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {store.items.length > 0 && (
        <p className="text-sm text-gray-500 text-right font-condensed font-bold uppercase">
          {store.items.reduce((s, i) => s + i.quantity, 0)} items total
        </p>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" fullWidth onClick={onBack}>Back</Button>
        <Button fullWidth disabled={store.items.length === 0} onClick={onNext}>Continue ▸</Button>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Edit item' : 'Add item'}>
        <div className="flex flex-col gap-4">
          <Input label="Item name" placeholder="e.g. 3-seat sofa" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
          <Select label="Size" options={SIZE_OPTIONS} value={draft.size} onChange={(e) => setDraft((d) => ({ ...d, size: e.target.value as ItemSize }))} />
          <Input label="Quantity" type="number" min={1} value={draft.quantity} onChange={(e) => setDraft((d) => ({ ...d, quantity: parseInt(e.target.value) || 1 }))} />
          {profile && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-condensed font-bold uppercase tracking-wider text-jet">Photo (optional)</label>
              <input type="file" accept="image/*" capture="environment" onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null)}
                className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:border-3 file:border-jet file:bg-caution file:font-bold file:uppercase file:text-xs" />
              {draft.photo_url && <img src={draft.photo_url} alt="preview" className="h-20 w-20 object-cover border-2 border-jet mt-2" />}
            </div>
          )}
          {formError && <p className="text-sm text-red-600 font-medium">{formError}</p>}
          <Button fullWidth loading={uploading} onClick={saveItem}>Save item</Button>
        </div>
      </Modal>
    </div>
  )
}
