import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'

const schema = z.object({
  vehicle_type: z.enum(['cargo_van', 'small_truck', 'large_truck']),
  vehicle_capacity: z.number().min(1, 'Enter vehicle capacity'),
  service_radius: z.number().min(1, 'Enter service radius'),
  home_base_address: z.string().min(5, 'Enter your home base address'),
})
type FormData = z.infer<typeof schema>

const VEHICLE_OPTIONS = [
  { value: 'cargo_van', label: 'Cargo Van' },
  { value: 'small_truck', label: 'Small Truck' },
  { value: 'large_truck', label: 'Large Truck' },
]

export default function MoverApplicationPage() {
  const { profile } = useAuthStore()
  const navigate = useNavigate()
  const [licenceFile, setLicenceFile] = useState<File | null>(null)
  const [regFile, setRegFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { vehicle_type: 'cargo_van', vehicle_capacity: 10, service_radius: 50 },
  })

  const uploadDoc = async (file: File, name: string) => {
    const path = `${profile!.id}/${name}_${Date.now()}.${file.name.split('.').pop()}`
    const { data, error } = await supabase.storage.from('mover-documents').upload(path, file)
    if (error) throw error
    return data.path
  }

  const onSubmit = async (data: FormData) => {
    if (!licenceFile || !regFile) { setFileError('Upload both documents to continue.'); return }
    if (!profile) return
    setSubmitting(true)
    setFileError('')
    try {
      const [licencePath, regPath] = await Promise.all([
        uploadDoc(licenceFile, 'licence'),
        uploadDoc(regFile, 'registration'),
      ])
      const { error } = await supabase.from('mover_profiles').upsert({
        id: profile.id,
        ...data,
        licence_url: licencePath,
        registration_url: regPath,
        status: 'pending',
      })
      if (error) throw error
      navigate('/mover/pending')
    } catch (err) {
      setFileError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
    }
    setSubmitting(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Mover Application</h1>
        <p className="text-sm text-gray-500 mt-1">Complete your profile to start accepting jobs.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <Select
          label="Vehicle type"
          options={VEHICLE_OPTIONS}
          error={errors.vehicle_type?.message}
          {...register('vehicle_type')}
        />
        <Input
          label="Vehicle capacity (m³)"
          type="number"
          min={1}
          step={0.1}
          error={errors.vehicle_capacity?.message}
          {...register('vehicle_capacity', { valueAsNumber: true })}
        />
        <Input
          label="Service radius (km)"
          type="number"
          min={1}
          error={errors.service_radius?.message}
          {...register('service_radius', { valueAsNumber: true })}
        />
        <Input
          label="Home base address"
          placeholder="123 Depot St, Sydney NSW"
          error={errors.home_base_address?.message}
          {...register('home_base_address')}
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Driver's licence (PDF or image)</label>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setLicenceFile(e.target.files?.[0] ?? null)}
            className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Vehicle registration (PDF or image)</label>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setRegFile(e.target.files?.[0] ?? null)}
            className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
          />
        </div>

        {fileError && <p className="text-sm text-red-600">{fileError}</p>}
        <Button type="submit" fullWidth loading={submitting}>Submit Application</Button>
      </form>
    </div>
  )
}
