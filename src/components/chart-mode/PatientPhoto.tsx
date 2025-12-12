'use client'

import { useState, useRef } from 'react'
import { Camera, Upload, User, Sparkles, X, Check, RotateCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface PatientPhotoProps {
  patientId: string
  patientName: string
  patientAge: number
  patientGender: string
  currentPhoto?: string
  onPhotoChange: (photoUrl: string) => void
  size?: 'sm' | 'md' | 'lg'
  editable?: boolean
}

// Generate a deterministic avatar based on patient info
function generateAvatarUrl(name: string, gender: string, age: number): string {
  // Use DiceBear API for avatar generation
  const seed = `${name}-${gender}-${age}`
  const style = gender.toLowerCase() === 'male' ? 'adventurer' : 'adventurer-neutral'
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9`
}

export function PatientPhoto({
  patientId,
  patientName,
  patientAge,
  patientGender,
  currentPhoto,
  onPhotoChange,
  size = 'md',
  editable = true,
}: PatientPhotoProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const sizeClasses = {
    sm: 'h-10 w-10',
    md: 'h-14 w-14',
    lg: 'h-20 w-20',
  }

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setCapturedImage(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsCameraActive(true)
      }
    } catch (err) {
      console.error('Failed to access camera:', err)
      alert('Could not access camera. Please check permissions.')
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    setIsCameraActive(false)
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        const imageData = canvas.toDataURL('image/jpeg', 0.8)
        setCapturedImage(imageData)
        stopCamera()
      }
    }
  }

  const generateAIAvatar = async () => {
    setIsGenerating(true)
    // Simulate AI avatar generation
    await new Promise((resolve) => setTimeout(resolve, 1500))
    const avatarUrl = generateAvatarUrl(patientName, patientGender, patientAge)
    setCapturedImage(avatarUrl)
    setIsGenerating(false)
  }

  const confirmPhoto = () => {
    if (capturedImage) {
      onPhotoChange(capturedImage)
      setIsModalOpen(false)
      setCapturedImage(null)
    }
  }

  const cancelPhoto = () => {
    setCapturedImage(null)
    stopCamera()
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setCapturedImage(null)
    stopCamera()
  }

  return (
    <>
      {/* Photo Display */}
      <div className="relative group">
        {currentPhoto ? (
          <img
            src={currentPhoto}
            alt={patientName}
            className={cn(
              'rounded-full object-cover',
              sizeClasses[size]
            )}
          />
        ) : (
          <div
            className={cn(
              'rounded-full bg-slate-200 flex items-center justify-center',
              sizeClasses[size]
            )}
          >
            <User className={cn('text-slate-400', iconSizes[size])} />
          </div>
        )}

        {/* Edit Overlay */}
        {editable && (
          <button
            onClick={() => setIsModalOpen(true)}
            className={cn(
              'absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer'
            )}
          >
            <Camera className="h-4 w-4 text-white" />
          </button>
        )}
      </div>

      {/* Photo Modal */}
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Patient Photo</DialogTitle>
            <DialogDescription>
              Upload, capture, or generate a photo for {patientName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Preview/Capture Area */}
            <div className="relative aspect-square bg-slate-100 rounded-lg overflow-hidden">
              {capturedImage ? (
                <img
                  src={capturedImage}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : isCameraActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <User className="h-16 w-16 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No photo</p>
                  </div>
                </div>
              )}

              {/* Camera capture button */}
              {isCameraActive && !capturedImage && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  <Button
                    onClick={capturePhoto}
                    className="rounded-full h-14 w-14 p-0"
                  >
                    <div className="h-12 w-12 rounded-full bg-white" />
                  </Button>
                </div>
              )}
            </div>

            {/* Hidden elements */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Action Buttons */}
            {capturedImage ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={cancelPhoto}
                >
                  <RotateCw className="h-4 w-4 mr-2" />
                  Retake
                </Button>
                <Button className="flex-1" onClick={confirmPhoto}>
                  <Check className="h-4 w-4 mr-2" />
                  Use Photo
                </Button>
              </div>
            ) : isCameraActive ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={stopCamera}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-1 h-auto py-3"
                >
                  <Upload className="h-5 w-5" />
                  <span className="text-xs">Upload</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={startCamera}
                  className="flex flex-col items-center gap-1 h-auto py-3"
                >
                  <Camera className="h-5 w-5" />
                  <span className="text-xs">Camera</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={generateAIAvatar}
                  disabled={isGenerating}
                  className="flex flex-col items-center gap-1 h-auto py-3"
                >
                  {isGenerating ? (
                    <RotateCw className="h-5 w-5 animate-spin" />
                  ) : (
                    <Sparkles className="h-5 w-5" />
                  )}
                  <span className="text-xs">AI Avatar</span>
                </Button>
              </div>
            )}

            {/* Info text */}
            <p className="text-xs text-muted-foreground text-center">
              Photos are stored securely and used only for patient identification
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

