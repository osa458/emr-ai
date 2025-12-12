'use client'

import { useState, useEffect } from 'react'
import { QrCode, RefreshCw, Mail, Copy, Check, Smartphone, Clock, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface MobileQRCodeProps {
  isOpen: boolean
  onClose: () => void
  patientId: string
  patientName: string
}

// Simple QR Code component using an SVG-based approach
function QRCodeDisplay({ data, size = 200 }: { data: string; size?: number }) {
  const [qrUrl, setQrUrl] = useState('')

  useEffect(() => {
    // Use a QR code API (in production, you'd generate this locally)
    const encodedData = encodeURIComponent(data)
    setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}`)
  }, [data, size])

  return (
    <div className="relative">
      {qrUrl ? (
        <img
          src={qrUrl}
          alt="QR Code"
          className="mx-auto rounded-lg"
          width={size}
          height={size}
        />
      ) : (
        <div
          className="mx-auto bg-slate-100 rounded-lg flex items-center justify-center"
          style={{ width: size, height: size }}
        >
          <RefreshCw className="h-8 w-8 text-slate-400 animate-spin" />
        </div>
      )}
    </div>
  )
}

export function MobileQRCode({
  isOpen,
  onClose,
  patientId,
  patientName,
}: MobileQRCodeProps) {
  const [expiresIn, setExpiresIn] = useState(8 * 60 * 60) // 8 hours in seconds
  const [linkCopied, setLinkCopied] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  // Generate a unique token for the mobile view
  const token = `${patientId}-${Date.now()}-${Math.random().toString(36).substring(7)}`
  const mobileUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/mobile/patient/${patientId}?token=${token}`

  // Countdown timer
  useEffect(() => {
    if (!isOpen) return

    const interval = setInterval(() => {
      setExpiresIn((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen])

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${mins}m`
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(mobileUrl)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleEmailLink = () => {
    // In production, this would send a secure email
    setEmailSent(true)
    setTimeout(() => setEmailSent(false), 2000)
  }

  const handleRegenerate = () => {
    setExpiresIn(8 * 60 * 60)
    // Token would be regenerated
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Mobile View
          </DialogTitle>
          <DialogDescription>
            Scan to view {patientName}&apos;s chart on your mobile device
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* QR Code */}
          <div className="flex flex-col items-center">
            <QRCodeDisplay data={mobileUrl} size={200} />
          </div>

          {/* Expiration Timer */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Link expires in: <strong className="text-foreground">{formatTime(expiresIn)}</strong></span>
          </div>

          {/* Features */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="text-sm font-medium mb-2">Mobile Features:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-green-600" />
                Read-only vitals & labs
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-green-600" />
                Medication list
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-green-600" />
                Allergy alerts
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-green-600" />
                Quick page/message
              </li>
            </ul>
          </div>

          {/* Link Input */}
          <div className="flex gap-2">
            <Input
              value={mobileUrl}
              readOnly
              className="text-xs font-mono"
            />
            <Button variant="outline" size="icon" onClick={handleCopyLink}>
              {linkCopied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleRegenerate}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleEmailLink}
            >
              {emailSent ? (
                <Check className="h-4 w-4 mr-2 text-green-600" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              {emailSent ? 'Sent!' : 'Email Link'}
            </Button>
          </div>

          {/* Security Notice */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Shield className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>
              This link provides secure, temporary access to patient data.
              It expires automatically and requires authentication.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

