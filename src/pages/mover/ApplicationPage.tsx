import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useGoogleMapsLoader } from '../../hooks/useGoogleMapsLoader'
import AddressAutocomplete from '../../components/maps/AddressAutocomplete'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'

const schema = z
  .object({
    vehicle_type: z.enum(['cargo_van', 'small_truck', 'large_truck']),
    vehicle_capacity: z.number().min(1, 'Enter vehicle capacity'),
    service_radius: z.number().min(1, 'Enter service radius'),
    home_base_address: z.string().min(5, 'Enter your home base address'),
    home_base_lat: z.number().optional(),
    home_base_lng: z.number().optional(),
  })
  .refine((d) => d.home_base_lat != null && d.home_base_lng != null, {
    message: 'Select an address from the Google suggestions',
    path: ['home_base_address'],
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
  const { isLoaded } = useGoogleMapsLoader()
  const [licenceFile, setLicenceFile] = useState<File | null>(null)
  const [regFile, setRegFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { vehicle_type: 'cargo_van', vehicle_capacity: 10, service_radius: 50 },
  })

  const homeBaseAddress = watch('home_base_address')

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
        vehicle_type: data.vehicle_type,
        vehicle_capacity: data.vehicle_capacity,
        service_radius: data.service_radius,
        home_base_address: data.home_base_address,
        licence_url: licencePath,
        registration_url: regPath,
        status: 'pending',
      })
      if (error) throw error
      await supabase.functions.invoke('notify-mover-application')
      navigate('/mover/pending')
    } catch (err) {
      setFileError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
    }
    setSubmitting(false)
  }

  if (!isLoaded) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl uppercase text-jet">Mover application</h1>
        <p className="text-sm text-gray-600 mt-1">Complete your profile to start accepting jobs.</p>
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
        <AddressAutocomplete
          label="Home base address"
          placeholder="123 Depot St, Newark NJ"
          defaultValue={homeBaseAddress}
          error={errors.home_base_address?.message}
          onPlaceSelected={({ address, lat, lng }) => {
            setValue('home_base_address', address, { shouldValidate: true })
            setValue('home_base_lat', lat, { shouldValidate: true })
            setValue('home_base_lng', lng, { shouldValidate: true })
          }}
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-condensed font-bold uppercase tracking-wider text-jet">Driver&apos;s licence (PDF or image)</label>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setLicenceFile(e.target.files?.[0] ?? null)}
            className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:border-3 file:border-jet file:bg-caution file:font-bold file:uppercase file:text-xs"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-condensed font-bold uppercase tracking-wider text-jet">Vehicle registration (PDF or image)</label>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setRegFile(e.target.files?.[0] ?? null)}
            className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:border-3 file:border-jet file:bg-caution file:font-bold file:uppercase file:text-xs"
          />
        </div>

        {fileError && <p className="text-sm text-red-600 font-medium">{fileError}</p>}
        <Button type="submit" fullWidth loading={submitting}>Submit application ▸</Button>
      </form>
    </div>
  )
}
