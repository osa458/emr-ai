'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Printer, Download, FileText, Settings } from 'lucide-react'
import {
  printPatientSummary,
  downloadPatientSummary,
  type PatientSummaryData,
  type ExportOptions,
} from '@/lib/pdf-export'

interface ExportPanelProps {
  patientData: PatientSummaryData
}

export function ExportPanel({ patientData }: ExportPanelProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [options, setOptions] = useState<ExportOptions>({
    includeProblems: true,
    includeAllergies: true,
    includeMedications: true,
    includeVitals: true,
    includeLabs: true,
    includeNotes: false,
    format: 'summary',
  })

  const handlePrint = () => {
    printPatientSummary(patientData, options)
  }

  const handleDownload = () => {
    downloadPatientSummary(patientData, options)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-5 w-5" />
          Export Patient Record
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={handlePrint} className="flex-1">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button onClick={handleDownload} variant="outline" className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Export Options
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Export Options</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Export Format</Label>
                <Select
                  value={options.format}
                  onValueChange={(v) =>
                    setOptions({ ...options, format: v as ExportOptions['format'] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summary">Clinical Summary</SelectItem>
                    <SelectItem value="full">Full Record</SelectItem>
                    <SelectItem value="discharge">Discharge Summary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Include Sections</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={options.includeProblems}
                      onCheckedChange={(c) =>
                        setOptions({ ...options, includeProblems: !!c })
                      }
                    />
                    <Label htmlFor="problems" className="font-normal">
                      Problem List
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={options.includeAllergies}
                      onCheckedChange={(c) =>
                        setOptions({ ...options, includeAllergies: !!c })
                      }
                    />
                    <Label htmlFor="allergies" className="font-normal">
                      Allergies
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={options.includeMedications}
                      onCheckedChange={(c) =>
                        setOptions({ ...options, includeMedications: !!c })
                      }
                    />
                    <Label htmlFor="medications" className="font-normal">
                      Medications
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={options.includeVitals}
                      onCheckedChange={(c) =>
                        setOptions({ ...options, includeVitals: !!c })
                      }
                    />
                    <Label htmlFor="vitals" className="font-normal">
                      Vital Signs
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={options.includeLabs}
                      onCheckedChange={(c) =>
                        setOptions({ ...options, includeLabs: !!c })
                      }
                    />
                    <Label htmlFor="labs" className="font-normal">
                      Lab Results
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={options.includeNotes}
                      onCheckedChange={(c) =>
                        setOptions({ ...options, includeNotes: !!c })
                      }
                    />
                    <Label htmlFor="notes" className="font-normal">
                      Clinical Notes
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  handlePrint()
                  setIsDialogOpen(false)
                }}
              >
                <Printer className="h-4 w-4 mr-2" />
                Print with Options
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

export default ExportPanel
