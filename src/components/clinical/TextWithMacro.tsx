'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Wand2, ChevronDown, Check } from 'lucide-react'

interface MacroTemplate {
  id: string
  trigger: string
  name: string
  content: string
  category?: string
}

interface TextWithMacroProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  rows?: number
  macros?: MacroTemplate[]
  className?: string
  disabled?: boolean
}

// Default clinical macros (inspired by Beda EMR TextWithMacroFill)
const defaultMacros: MacroTemplate[] = [
  // Physical Exam
  { id: 'pe-gen', trigger: '..gen', name: 'General', content: 'Alert, oriented, NAD, well-appearing', category: 'Physical Exam' },
  { id: 'pe-heent', trigger: '..heent', name: 'HEENT', content: 'NC/AT, PERRL, EOMI, oropharynx clear, moist mucous membranes', category: 'Physical Exam' },
  { id: 'pe-neck', trigger: '..neck', name: 'Neck', content: 'Supple, no JVD, no lymphadenopathy, no thyromegaly', category: 'Physical Exam' },
  { id: 'pe-cv', trigger: '..cv', name: 'Cardiovascular', content: 'RRR, normal S1/S2, no murmurs/rubs/gallops, no peripheral edema', category: 'Physical Exam' },
  { id: 'pe-resp', trigger: '..resp', name: 'Respiratory', content: 'CTAB, no wheezes/rales/rhonchi, normal respiratory effort', category: 'Physical Exam' },
  { id: 'pe-abd', trigger: '..abd', name: 'Abdomen', content: 'Soft, non-tender, non-distended, normoactive bowel sounds, no hepatosplenomegaly', category: 'Physical Exam' },
  { id: 'pe-ext', trigger: '..ext', name: 'Extremities', content: 'Warm, well-perfused, no edema, 2+ pulses bilaterally', category: 'Physical Exam' },
  { id: 'pe-neuro', trigger: '..neuro', name: 'Neurological', content: 'A&Ox3, CN II-XII intact, strength 5/5 all extremities, sensation intact, reflexes 2+ symmetric', category: 'Physical Exam' },
  { id: 'pe-skin', trigger: '..skin', name: 'Skin', content: 'Warm, dry, no rashes or lesions', category: 'Physical Exam' },
  { id: 'pe-psych', trigger: '..psych', name: 'Psychiatric', content: 'Appropriate mood and affect, cooperative, good insight and judgment', category: 'Physical Exam' },
  
  // Review of Systems
  { id: 'ros-neg', trigger: '..rosneg', name: 'ROS Negative', content: 'Constitutional: Denies fever, chills, weight changes, fatigue\nHEENT: Denies headache, vision changes, hearing loss\nCardiovascular: Denies chest pain, palpitations, orthopnea, PND\nRespiratory: Denies cough, SOB, wheezing\nGI: Denies nausea, vomiting, diarrhea, constipation, abdominal pain\nGU: Denies dysuria, frequency, hematuria\nMusculoskeletal: Denies joint pain, swelling, stiffness\nNeurological: Denies headache, dizziness, weakness, numbness\nPsychiatric: Denies depression, anxiety', category: 'ROS' },
  
  // Assessment & Plan Templates
  { id: 'ap-chf', trigger: '..chf', name: 'CHF A/P', content: 'Acute on chronic systolic heart failure (HFrEF)\n- Likely precipitated by ***\n- Continue diuresis with IV Lasix\n- Daily weights, strict I/O, fluid restriction 1.5L\n- Continue GDMT (ACEi/ARB, beta-blocker, MRA)\n- BNP trend, BMP daily\n- Echo if not recent', category: 'A/P' },
  { id: 'ap-aki', trigger: '..aki', name: 'AKI A/P', content: 'Acute kidney injury\n- Likely *** etiology (prerenal vs intrinsic vs postrenal)\n- Baseline Cr: ***, Current: ***\n- Hold nephrotoxins, renally dose medications\n- IV fluids vs diuresis based on volume status\n- Urine studies if indicated\n- Renal ultrasound if obstruction suspected\n- Nephrology consult if not improving', category: 'A/P' },
  { id: 'ap-pna', trigger: '..pna', name: 'Pneumonia A/P', content: 'Community-acquired pneumonia\n- CURB-65 score: ***\n- Empiric antibiotics: ***\n- Supplemental O2 to maintain SpO2 > 92%\n- Incentive spirometry\n- Blood/sputum cultures if severe\n- Repeat CXR if not improving', category: 'A/P' },
  { id: 'ap-sepsis', trigger: '..sepsis', name: 'Sepsis A/P', content: 'Sepsis, likely *** source\n- qSOFA: ***, SOFA: ***\n- Lactate: *** (repeat in 6 hours if elevated)\n- Cultures obtained: blood x2, UA/Ucx, ***\n- Broad spectrum antibiotics initiated\n- IVF resuscitation (30 mL/kg if hypotensive or lactate ≥4)\n- Vasopressors if fluid refractory\n- Source control as indicated', category: 'A/P' },
  { id: 'ap-dm', trigger: '..dm', name: 'Diabetes A/P', content: 'Type 2 diabetes mellitus\n- Last HbA1c: *** on ***\n- Home regimen: ***\n- Inpatient: Basal-bolus insulin with sliding scale\n- Fingerstick glucose AC and HS\n- Hypoglycemia protocol\n- Resume home regimen at discharge with adjustments', category: 'A/P' },
  
  // Discharge
  { id: 'dc-fu', trigger: '..dcfu', name: 'DC Follow-up', content: 'Follow-up:\n- PCP: Dr. *** in *** days\n- Cardiology: Dr. *** in *** weeks\n- Labs: *** in *** days', category: 'Discharge' },
  { id: 'dc-warn', trigger: '..dcwarn', name: 'DC Warning Signs', content: 'Return precautions: Return to ED or call 911 if you experience:\n- Chest pain or shortness of breath\n- Fever > 101°F\n- Worsening swelling or weight gain > 3 lbs\n- Confusion or altered mental status\n- ***', category: 'Discharge' },
]

export function TextWithMacro({
  value,
  onChange,
  placeholder = 'Type here... (use .. for macros)',
  label,
  rows = 4,
  macros = defaultMacros,
  className = '',
  disabled = false
}: TextWithMacroProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredMacros, setFilteredMacros] = useState<MacroTemplate[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [triggerPosition, setTriggerPosition] = useState<number | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showQuickInsert, setShowQuickInsert] = useState(false)

  // Detect macro trigger (..)
  useEffect(() => {
    if (!value) {
      setShowSuggestions(false)
      return
    }

    const cursorPos = textareaRef.current?.selectionStart || value.length
    const textBeforeCursor = value.substring(0, cursorPos)
    const triggerMatch = textBeforeCursor.match(/\.\.(\w*)$/)

    if (triggerMatch) {
      const searchTerm = triggerMatch[1].toLowerCase()
      const filtered = macros.filter(m => 
        m.trigger.toLowerCase().includes(`.${searchTerm}`) ||
        m.name.toLowerCase().includes(searchTerm)
      )
      setFilteredMacros(filtered)
      setShowSuggestions(filtered.length > 0)
      setTriggerPosition(triggerMatch.index || 0)
      setSelectedIndex(0)
    } else {
      setShowSuggestions(false)
    }
  }, [value, macros])

  const insertMacro = (macro: MacroTemplate) => {
    if (triggerPosition !== null) {
      const before = value.substring(0, triggerPosition)
      const cursorPos = textareaRef.current?.selectionStart || value.length
      const after = value.substring(cursorPos)
      const newValue = before + macro.content + after
      onChange(newValue)
    } else {
      // Quick insert - append at cursor or end
      const cursorPos = textareaRef.current?.selectionStart || value.length
      const before = value.substring(0, cursorPos)
      const after = value.substring(cursorPos)
      const separator = before && !before.endsWith('\n') ? '\n' : ''
      onChange(before + separator + macro.content + after)
    }
    setShowSuggestions(false)
    setShowQuickInsert(false)
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, filteredMacros.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      if (filteredMacros[selectedIndex]) {
        insertMacro(filteredMacros[selectedIndex])
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  const categories = Array.from(new Set(macros.map(m => m.category).filter(Boolean))) as string[]

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium mb-1">{label}</label>
      )}
      
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          className="w-full p-3 border rounded-md text-sm resize-y focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        
        {/* Quick Insert Button */}
        <div className="absolute top-2 right-2 flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setShowQuickInsert(!showQuickInsert)}
          >
            <Wand2 className="h-3 w-3 mr-1" />
            Macros
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </div>

        {/* Macro Suggestions Dropdown (triggered by ..) */}
        {showSuggestions && (
          <div className="absolute z-50 mt-1 bg-white border rounded-md shadow-lg max-h-64 overflow-y-auto w-80">
            <div className="px-2 py-1 text-xs text-muted-foreground bg-slate-50 border-b">
              Press Tab or Enter to insert
            </div>
            {filteredMacros.map((macro, index) => (
              <button
                key={macro.id}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b last:border-b-0 ${
                  index === selectedIndex ? 'bg-blue-100' : ''
                }`}
                onClick={() => insertMacro(macro)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-blue-600 text-xs">{macro.trigger}</span>
                  <span className="font-medium">{macro.name}</span>
                  {macro.category && (
                    <Badge variant="outline" className="text-[10px] ml-auto">{macro.category}</Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate mt-0.5">
                  {macro.content.substring(0, 60)}...
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Quick Insert Panel */}
        {showQuickInsert && (
          <div className="absolute z-50 right-0 mt-1 bg-white border rounded-md shadow-lg w-96 max-h-96 overflow-y-auto">
            <div className="px-3 py-2 text-sm font-medium bg-slate-50 border-b">
              Quick Insert Macros
            </div>
            {categories.map(category => (
              <div key={category} className="border-b last:border-b-0">
                <div className="px-3 py-1 text-xs font-medium text-muted-foreground bg-slate-50">
                  {category}
                </div>
                <div className="p-2 flex flex-wrap gap-1">
                  {macros.filter(m => m.category === category).map(macro => (
                    <button
                      key={macro.id}
                      onClick={() => insertMacro(macro)}
                      className="px-2 py-1 text-xs border rounded hover:bg-blue-50 hover:border-blue-300"
                      title={macro.content}
                    >
                      {macro.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-xs text-muted-foreground mt-1">
        Type <code className="bg-slate-100 px-1 rounded">..</code> followed by keyword for quick macros
      </div>
    </div>
  )
}

// Export default macros for external use
export { defaultMacros }
export type { MacroTemplate }
