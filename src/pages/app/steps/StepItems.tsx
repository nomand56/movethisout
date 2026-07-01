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
import { useTranslation } from 'react-i18next'

interface Props { onBack: () => void; onNext: () => void }

const EMPTY: Omit<DraftJobItem, 'id'> = { name: '', size: 'medium', quantity: 1, photo: null, photo_url: null }

export default function StepItems({ onBack, onNext }: Props) {
  const { t } = useTranslation()
  const { profile } = useAuthStore()
  const store = useJobCreationStore()
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Omit<DraftJobItem, 'id'>>(EMPTY)
  const [uploading, setUploading] = useState(false)
  const [formError, setFormError] = useState('')

  const SIZE_OPTIONS = [
    { value: 'small', label: t('steps.items.size_small') },
    { value: 'medium', label: t('steps.items.size_medium') },
    { value: 'large', label: t('steps.items.size_large') },
    { value: 'extra_large', label: t('steps.items.size_extra_large') },
  ]

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
    if (!draft.name.trim()) { setFormError(t('steps.items.name_error')); return }
    if (draft.quantity < 1) { setFormError(t('steps.items.quantity_error')); return }
    setFormError('')
    if (editId) {
      store.updateItem(editId, draft)
    } else {
      store.addItem(draft)
    }
    setShowModal(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">{t('steps.items.title')}</h2>
        <Button size="sm" variant="secondary" onClick={openAdd}><Plus size={16} className="mr-1" />{t('steps.items.add_item')}</Button>
      </div>

      {store.items.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
          <p className="text-gray-500 text-sm">{t('steps.items.empty_state')}</p>
          <button onClick={openAdd} className="text-brand-500 text-sm font-medium mt-1 hover:underline">{t('steps.items.add_first_item')}</button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {store.items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
            {item.photo_url && <img src={item.photo_url} alt={item.name} className="h-12 w-12 rounded-lg object-cover flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{item.name}</p>
              <p className="text-xs text-gray-500 capitalize">{item.size.replace('_', ' ')} × {item.quantity}</p>
            </div>
            <button onClick={() => openEdit(item)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">{t('steps.items.edit')}</button>
            <button onClick={() => store.removeItem(item.id)} className="p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {store.items.length > 0 && (
        <div className="text-sm text-gray-500 text-right">{store.items.reduce((s, i) => s + i.quantity, 0)} {t('steps.items.total_suffix')}</div>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" fullWidth onClick={onBack}>{t('steps.items.back')}</Button>
        <Button fullWidth disabled={store.items.length === 0} onClick={onNext}>{t('steps.items.continue')}</Button>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? t('steps.items.modal_title_edit') : t('steps.items.modal_title_add')}>
        <div className="flex flex-col gap-4">
          <Input
            label={t('steps.items.name_label')}
            placeholder={t('steps.items.name_placeholder')}
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />
          <Select
            label={t('steps.items.size_label')}
            options={SIZE_OPTIONS}
            value={draft.size}
            onChange={(e) => setDraft((d) => ({ ...d, size: e.target.value as ItemSize }))}
          />
          <Input
            label={t('steps.items.quantity_label')}
            type="number"
            min={1}
            value={draft.quantity}
            onChange={(e) => setDraft((d) => ({ ...d, quantity: parseInt(e.target.value) || 1 }))}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('steps.items.photo_label')}</label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null)}
              className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
            />
            {draft.photo_url && <img src={draft.photo_url} alt="preview" className="h-20 w-20 object-cover rounded-lg mt-2" />}
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <Button fullWidth loading={uploading} onClick={saveItem}>{t('steps.items.save')}</Button>
        </div>
      </Modal>
    </div>
  )
}
