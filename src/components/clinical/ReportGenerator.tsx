'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileText, Download, Send, Printer, Copy, Check,
  Sparkles, Loader2, RefreshCw, Settings, ChevronDown
} from 'lucide-react'

export type ReportType = 
  | 'discharge-summary'
  | 'progress-note'
  | 'consultation'
  | 'procedure-note'
  | 'transfer-summary'
  | 'referral-letter'

export interface ReportTemplate {
  id: string
  type: ReportType
  name: string
  description: string
  sections: string[]
}

export interface ReportGeneratorProps {
  patientId: string
  encounterId?: string
  reportType?: ReportType
  onGenerate?: (report: string) => void
  onSend?: (report: string, recipients: string[]) => void
  onSave?: (report: string) => void
  className?: string
}

const reportTemplates: ReportTemplate[] = [
  {
    id: 'discharge',
    type: 'discharge-summary',
    name: 'Discharge Summary',
    description: 'Comprehensive summary for patient discharge',
    sections: ['Admission Diagnosis', 'Hospital Course', 'Procedures', 'Discharge Medications', 'Follow-up Instructions']
  },
  {
    id: 'progress',
    type: 'progress-note',
    name: 'Progress Note',
    description: 'Daily progress note in SOAP format',
    sections: ['Subjective', 'Objective', 'Assessment', 'Plan']
  },
  {
    id: 'consult',
    type: 'consultation',
    name: 'Consultation Note',
    description: 'Specialist consultation report',
    sections: ['Reason for Consult', 'History', 'Examination', 'Assessment', 'Recommendations']
  },
  {
    id: 'procedure',
    type: 'procedure-note',
    name: 'Procedure Note',
    description: 'Documentation of performed procedure',
    sections: ['Procedure', 'Indication', 'Technique', 'Findings', 'Complications', 'Disposition']
  },
  {
    id: 'transfer',
    type: 'transfer-summary',
    name: 'Transfer Summary',
    description: 'Summary for facility transfer',
    sections: ['Reason for Transfer', 'Active Problems', 'Current Medications', 'Pending Studies', 'Care Instructions']
  },
  {
    id: 'referral',
    type: 'referral-letter',
    name: 'Referral Letter',
    description: 'Referral to another provider',
    sections: ['Patient Information', 'Reason for Referral', 'Relevant History', 'Current Management', 'Questions/Concerns']
  }
]

// Mock AI-generated report content
const generateMockReport = (type: ReportType): string => {
  const reports: Record<ReportType, string> = {
    'discharge-summary': `DISCHARGE SUMMARY

PATIENT: John Smith
MRN: 123456
ADMISSION DATE: December 5, 2024
DISCHARGE DATE: December 10, 2024
ATTENDING: Dr. Sarah Williams

ADMISSION DIAGNOSIS:
1. Acute on chronic systolic heart failure (HFrEF)
2. Type 2 Diabetes Mellitus
3. Hypertension

HOSPITAL COURSE:
68-year-old male with history of heart failure (EF 35%) presented with worsening dyspnea and lower extremity edema. Initial BNP was elevated at 1,850 pg/mL. Patient was started on IV furosemide with good diuretic response. Over the 5-day admission, patient lost 5 kg of fluid weight with significant improvement in symptoms. Echocardiogram showed stable EF of 35% with moderate LV dilation.

PROCEDURES:
- Transthoracic echocardiogram (12/6/2024)
- Right heart catheterization (12/7/2024) - elevated filling pressures consistent with decompensated HF

DISCHARGE MEDICATIONS:
1. Furosemide 60 mg PO daily (increased from 40 mg)
2. Lisinopril 20 mg PO daily
3. Carvedilol 25 mg PO BID
4. Spironolactone 25 mg PO daily
5. Metformin 1000 mg PO BID
6. Atorvastatin 40 mg PO daily

FOLLOW-UP:
1. Cardiology clinic in 1 week - Dr. Patel
2. Primary care in 2 weeks - Dr. Johnson
3. Daily weights, call if gain >3 lbs

DISCHARGE CONDITION: Stable, improved`,

    'progress-note': `PROGRESS NOTE - Hospital Day 3

SUBJECTIVE:
Patient reports improved breathing overnight. Slept well without orthopnea. Denies chest pain or palpitations. Mild residual lower extremity swelling noted.

OBJECTIVE:
Vitals: BP 128/78, HR 72, RR 16, SpO2 96% on RA, Temp 98.2°F
Weight: 82 kg (down 3 kg from admission)
General: Alert, comfortable, no distress
CV: RRR, no murmurs, JVP ~8 cm
Lungs: Clear bilaterally, no crackles
Extremities: 1+ pitting edema (improved from 3+)

Labs: Na 138, K 4.2, Cr 1.4 (improved from 1.8), BNP 890 (down from 1850)

ASSESSMENT:
1. Acute on chronic systolic heart failure - improving with diuresis
2. AKI - resolving with optimization of hemodynamics
3. T2DM - stable on home regimen

PLAN:
1. Continue IV furosemide 40 mg BID, goal additional 1-2 L negative today
2. Check PM electrolytes
3. If continues to improve, plan discharge tomorrow
4. Dietary education, sodium restriction
5. Arrange cardiology follow-up`,

    'consultation': `CARDIOLOGY CONSULTATION

REASON FOR CONSULTATION:
Management of acute decompensated heart failure

HISTORY OF PRESENT ILLNESS:
68 yo M with known HFrEF (EF 35%) presenting with 1 week of progressive dyspnea and lower extremity swelling. Patient reports weight gain of ~10 lbs over past 2 weeks. Admits to dietary indiscretion. Denies chest pain, palpitations, syncope.

RELEVANT HISTORY:
- Heart failure diagnosed 2019, ischemic cardiomyopathy
- Prior MI 2018 with PCI to LAD
- Type 2 diabetes, hypertension, hyperlipidemia
- No history of arrhythmias

EXAMINATION:
Vitals: BP 142/88, HR 78, RR 18, SpO2 94% on 2L NC
JVP elevated ~12 cm
Lungs: Bilateral crackles at bases
CV: RRR, S3 gallop present, no murmurs
Extremities: 3+ pitting edema bilateral

ASSESSMENT:
Acute on chronic systolic heart failure, likely triggered by dietary non-compliance and possible medication non-adherence.

RECOMMENDATIONS:
1. IV furosemide diuresis with close monitoring of renal function
2. Echocardiogram to assess current LV function
3. Consider right heart catheterization if inadequate response
4. Optimize GDMT once euvolemic
5. Cardiac rehab referral at discharge
6. Will follow throughout hospitalization`,

    'procedure-note': `PROCEDURE NOTE

PROCEDURE: Right Heart Catheterization
DATE: December 7, 2024
OPERATOR: Dr. Raj Patel, Cardiology
ASSISTANT: Dr. Sarah Williams

INDICATION: 
Decompensated heart failure with inadequate response to initial diuresis

TECHNIQUE:
After informed consent, the right internal jugular vein was accessed under ultrasound guidance. A 7F sheath was placed. A Swan-Ganz catheter was advanced to the pulmonary artery.

FINDINGS:
- RA pressure: 15 mmHg (elevated)
- RV pressure: 52/12 mmHg
- PA pressure: 52/28 mmHg, mean 38 mmHg (elevated)
- PCWP: 28 mmHg (elevated)
- Cardiac output: 4.2 L/min (thermodilution)
- Cardiac index: 2.1 L/min/m²

IMPRESSION:
Elevated filling pressures consistent with decompensated heart failure. Low-normal cardiac index. No evidence of pulmonary hypertension out of proportion to left heart disease.

COMPLICATIONS: None

DISPOSITION:
Patient tolerated procedure well. Will continue aggressive diuresis with goal PCWP <18. Consider inotropic support if CI declines.`,

    'transfer-summary': `TRANSFER SUMMARY

PATIENT: John Smith
FROM: General Medicine, Room 512
TO: Cardiac Care Unit

REASON FOR TRANSFER:
Worsening hemodynamics requiring closer monitoring and potential inotropic support

ACTIVE PROBLEMS:
1. Acute decompensated heart failure
2. Cardiorenal syndrome
3. Type 2 Diabetes Mellitus

CURRENT STATUS:
Patient developed worsening renal function (Cr 2.1 from 1.4) with inadequate urine output despite increased diuretic doses. BP trending lower at 95/60. CI on recent RHC was borderline at 2.1.

CURRENT MEDICATIONS:
1. Furosemide 80 mg IV BID
2. Dobutamine pending initiation
3. Lisinopril held for hypotension
4. Carvedilol held
5. Insulin sliding scale

PENDING STUDIES:
- AM labs with renal panel
- Repeat echo scheduled

CARE INSTRUCTIONS:
- Continuous telemetry
- Strict I/O with Foley
- Daily weights
- Cardiology following (Dr. Patel)`,

    'referral-letter': `REFERRAL LETTER

TO: Heart Failure Clinic
FROM: Dr. Sarah Williams, Internal Medicine
DATE: December 10, 2024

RE: John Smith, DOB 05/15/1956

Dear Colleagues,

I am referring Mr. Smith for ongoing heart failure management following his recent hospitalization.

PATIENT INFORMATION:
68-year-old male with HFrEF (EF 35%) secondary to ischemic cardiomyopathy.

REASON FOR REFERRAL:
Recurrent heart failure exacerbations requiring frequent hospitalizations. Patient would benefit from specialized heart failure care and optimization of guideline-directed medical therapy.

RELEVANT HISTORY:
- 3 hospitalizations for heart failure in past 12 months
- Prior MI with PCI to LAD (2018)
- Comorbidities: T2DM, HTN, CKD stage 3

CURRENT MANAGEMENT:
- Furosemide 60 mg daily
- Lisinopril 20 mg daily  
- Carvedilol 25 mg BID
- Spironolactone 25 mg daily

QUESTIONS/CONCERNS:
1. Candidacy for SGLT2 inhibitor addition
2. Consideration for ICD if not already present
3. Advanced heart failure therapies evaluation if continues to decline

Thank you for seeing this patient. Please contact me with any questions.

Sincerely,
Dr. Sarah Williams`
  }
  
  return reports[type] || 'Report content not available'
}

export function ReportGenerator({
  patientId,
  encounterId,
  reportType: initialReportType,
  onGenerate,
  onSend,
  onSave,
  className = ''
}: ReportGeneratorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(
    initialReportType ? reportTemplates.find(t => t.type === initialReportType) || null : null
  )
  const [generatedReport, setGeneratedReport] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const handleGenerate = async () => {
    if (!selectedTemplate) return
    
    setIsGenerating(true)
    
    // Simulate AI generation delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const report = generateMockReport(selectedTemplate.type)
    setGeneratedReport(report)
    onGenerate?.(report)
    
    setIsGenerating(false)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedReport)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>${selectedTemplate?.name || 'Report'}</title></head>
          <body style="font-family: sans-serif; padding: 20px; white-space: pre-wrap;">
            ${generatedReport}
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Template Selection */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Clinical Report Generator
            </CardTitle>
            <Badge variant="outline" className="gap-1 text-purple-600 border-purple-200">
              <Sparkles className="h-3 w-3" />
              AI-Powered
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {reportTemplates.map(template => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className={`p-3 border rounded-lg text-left transition-all ${
                  selectedTemplate?.id === template.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="font-medium text-sm">{template.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{template.description}</div>
              </button>
            ))}
          </div>
          
          {selectedTemplate && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg">
              <div className="text-xs font-medium text-muted-foreground mb-2">Sections included:</div>
              <div className="flex flex-wrap gap-2">
                {selectedTemplate.sections.map(section => (
                  <Badge key={section} variant="secondary" className="text-xs">
                    {section}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-4 flex gap-2">
            <Button 
              onClick={handleGenerate} 
              disabled={!selectedTemplate || isGenerating}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating with AI...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => setShowSettings(!showSettings)}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated Report */}
      {generatedReport && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{selectedTemplate?.name}</CardTitle>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={handlePrint}>
                  <Printer className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleGenerate}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-white border rounded-lg p-4 font-mono text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
              {generatedReport}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-4">
            <Button variant="outline" onClick={() => onSave?.(generatedReport)}>
              <Download className="h-4 w-4 mr-2" />
              Save to Chart
            </Button>
            <Button onClick={() => onSend?.(generatedReport, [])}>
              <Send className="h-4 w-4 mr-2" />
              Send / Finalize
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
