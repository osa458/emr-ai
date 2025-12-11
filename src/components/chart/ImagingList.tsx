'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  ImageIcon,
  Calendar,
  FileText,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import type { DiagnosticReport } from '@medplum/fhirtypes'

interface ImagingListProps {
  imagingStudies: DiagnosticReport[]
  isLoading?: boolean
}

interface ImagingDisplay {
  id: string
  name: string
  modality: string
  bodyPart: string
  date: Date
  status: 'final' | 'preliminary' | 'registered' | 'cancelled'
  conclusion: string
  summaryCode: string
}

function parseImagingStudy(report: DiagnosticReport): ImagingDisplay {
  const name = report.code?.text || 
               report.code?.coding?.[0]?.display || 
               'Unknown Study'
  
  // Extract modality from category or code
  const modalityCode = report.code?.coding?.[0]?.display || name
  let modality = 'Other'
  if (modalityCode.includes('X-Ray') || modalityCode.includes('XR')) modality = 'X-Ray'
  else if (modalityCode.includes('CT')) modality = 'CT'
  else if (modalityCode.includes('MRI') || modalityCode.includes('MR')) modality = 'MRI'
  else if (modalityCode.includes('Ultrasound') || modalityCode.includes('US') || modalityCode.includes('Doppler') || modalityCode.includes('Echo')) modality = 'Ultrasound'
  else if (modalityCode.includes('Nuclear') || modalityCode.includes('PET')) modality = 'Nuclear'

  // Extract body part
  let bodyPart = 'Unknown'
  if (name.includes('Chest')) bodyPart = 'Chest'
  else if (name.includes('Abdomen')) bodyPart = 'Abdomen'
  else if (name.includes('Pelvis')) bodyPart = 'Pelvis'
  else if (name.includes('Brain') || name.includes('Head')) bodyPart = 'Head'
  else if (name.includes('Heart') || name.includes('Echo')) bodyPart = 'Heart'
  else if (name.includes('Kidney') || name.includes('Renal')) bodyPart = 'Kidney'
  else if (name.includes('Extremity') || name.includes('Leg')) bodyPart = 'Extremity'

  return {
    id: report.id || '',
    name,
    modality,
    bodyPart,
    date: new Date(report.effectiveDateTime || report.issued || ''),
    status: report.status as ImagingDisplay['status'],
    conclusion: report.conclusion || 'No conclusion available',
    summaryCode: report.conclusionCode?.[0]?.text || '',
  }
}

const modalityIcons: Record<string, string> = {
  'X-Ray': '📷',
  'CT': '🔬',
  'MRI': '🧲',
  'Ultrasound': '📡',
  'Nuclear': '☢️',
  'Other': '🏥',
}

const statusColors: Record<string, string> = {
  final: 'bg-green-100 text-green-800',
  preliminary: 'bg-amber-100 text-amber-800',
  registered: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-gray-100 text-gray-800',
}

export function ImagingList({ imagingStudies, isLoading }: ImagingListProps) {
  const [selectedStudy, setSelectedStudy] = useState<ImagingDisplay | null>(null)
  const [filterModality, setFilterModality] = useState<string>('all')

  const parsedStudies = imagingStudies
    .map(parseImagingStudy)
    .sort((a, b) => b.date.getTime() - a.date.getTime())

  const modalities = ['all', ...Array.from(new Set(parsedStudies.map(s => s.modality)))]
  
  const filteredStudies = filterModality === 'all' 
    ? parsedStudies 
    : parsedStudies.filter(s => s.modality === filterModality)

  const pendingCount = parsedStudies.filter(s => 
    s.status === 'registered' || s.status === 'preliminary'
  ).length

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Imaging Studies
            {pendingCount > 0 && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                {pendingCount} pending
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-1">
            {modalities.map(mod => (
              <Button
                key={mod}
                variant={filterModality === mod ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterModality(mod)}
              >
                {mod === 'all' ? 'All' : mod}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredStudies.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No imaging studies found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Study</TableHead>
                <TableHead>Modality</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudies.map((study) => (
                <TableRow key={study.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{modalityIcons[study.modality]}</span>
                      <div>
                        <div className="font-medium">{study.name}</div>
                        <div className="text-xs text-muted-foreground">{study.bodyPart}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{study.modality}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {study.date.toLocaleDateString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {study.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[study.status]}>
                      {study.status === 'final' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {study.status === 'preliminary' && <Clock className="h-3 w-3 mr-1" />}
                      {study.status === 'registered' && <AlertCircle className="h-3 w-3 mr-1" />}
                      {study.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="text-sm text-muted-foreground truncate">
                      {study.status === 'final' ? study.summaryCode || 'See report' : 'Pending'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedStudy(study)}
                          disabled={study.status === 'registered'}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <span>{modalityIcons[study.modality]}</span>
                            {study.name}
                          </DialogTitle>
                          <DialogDescription>
                            {study.date.toLocaleDateString()} at {study.date.toLocaleTimeString()}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div className="flex gap-2">
                            <Badge variant="outline">{study.modality}</Badge>
                            <Badge variant="outline">{study.bodyPart}</Badge>
                            <Badge className={statusColors[study.status]}>{study.status}</Badge>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Report Findings
                            </h4>
                            <div className="p-4 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                              {study.conclusion}
                            </div>
                          </div>

                          {study.summaryCode && (
                            <div>
                              <h4 className="font-medium mb-2">Impression</h4>
                              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                                {study.summaryCode}
                              </div>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Pending Studies Alert */}
        {pendingCount > 0 && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 text-amber-800">
              <Clock className="h-4 w-4" />
              <span className="font-medium">{pendingCount} Study/Studies Pending</span>
            </div>
            <div className="mt-1 text-sm text-amber-700">
              {parsedStudies
                .filter(s => s.status === 'registered' || s.status === 'preliminary')
                .map(s => s.name)
                .join(', ')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
