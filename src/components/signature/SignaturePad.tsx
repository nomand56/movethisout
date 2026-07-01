import { useRef } from 'react'
import ReactSignatureCanvas from 'react-signature-canvas'
import Button from '../ui/Button'

interface Props {
  onSave: (dataUrl: string) => void
}

export default function SignaturePad({ onSave }: Props) {
  const sigRef = useRef<ReactSignatureCanvas | null>(null)

  const handleSave = () => {
    if (!sigRef.current || sigRef.current.isEmpty()) return
    onSave(sigRef.current.getTrimmedCanvas().toDataURL('image/png'))
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Requester signature</p>
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-900 touch-none">
        <ReactSignatureCanvas
          ref={sigRef}
          canvasProps={{ width: 340, height: 180, className: 'w-full' }}
          backgroundColor="transparent"
        />
      </div>
      <div className="flex gap-3">
        <Button variant="secondary" size="sm" onClick={() => sigRef.current?.clear()}>Clear</Button>
        <Button size="sm" onClick={handleSave}>Save Signature</Button>
      </div>
    </div>
  )
}
