/**
 * Import LOINC codes from NLM Clinical Tables API
 * This script downloads LOINC lab codes and saves them for use in the orders system
 * 
 * Usage: pnpm tsx scripts/import-loinc.ts
 */

import * as fs from 'fs'
import * as path from 'path'

const NLM_API = 'https://clinicaltables.nlm.nih.gov/api/loinc_items/v3/search'

interface LoincCode {
    code: string
    name: string
    component: string
    system: string
    class: string
    classType: string
    category: string
    specialty: string
}

// Map LOINC classes to our categories
function mapClassToCategory(loincClass: string): string {
    const classLower = loincClass.toLowerCase()
    if (classLower.includes('chem') || classLower.includes('ua') || classLower.includes('drug')) return 'Labs'
    if (classLower.includes('hem') || classLower.includes('coag')) return 'Labs'
    if (classLower.includes('micro') || classLower.includes('sero')) return 'Labs'
    if (classLower.includes('rad') || classLower.includes('path')) return 'Imaging'
    if (classLower.includes('vital') || classLower.includes('survey')) return 'Vital Signs'
    return 'Labs'
}

// Map LOINC class to specialty
function mapClassToSpecialty(loincClass: string, component: string): string {
    const classLower = loincClass.toLowerCase()
    const compLower = component.toLowerCase()

    // Cardiology
    if (compLower.includes('troponin') || compLower.includes('bnp') || compLower.includes('cholesterol')) return 'Cardiology'
    // Endocrine
    if (compLower.includes('tsh') || compLower.includes('thyroid') || compLower.includes('cortisol') || compLower.includes('insulin')) return 'Endocrinology'
    // Hematology
    if (classLower.includes('hem') || compLower.includes('hemoglobin') || compLower.includes('platelet')) return 'Hematology'
    // Nephrology
    if (compLower.includes('creatinine') || compLower.includes('bun') || compLower.includes('gfr')) return 'Nephrology'
    // Gastroenterology
    if (compLower.includes('bilirubin') || compLower.includes('ast') || compLower.includes('alt') || compLower.includes('lipase')) return 'Gastroenterology'
    // Infectious Disease
    if (classLower.includes('micro') || compLower.includes('culture') || compLower.includes('pcr')) return 'Infectious Disease'
    // Rheumatology
    if (compLower.includes('ana') || compLower.includes('rheumatoid') || compLower.includes('complement')) return 'Rheumatology'
    // Pulmonology
    if (compLower.includes('oxygen') || compLower.includes('pco2') || compLower.includes('po2')) return 'Pulmonology'

    return 'General'
}

async function fetchLoincCodes(searchTerm: string, maxList = 500): Promise<LoincCode[]> {
    const url = `${NLM_API}?terms=${encodeURIComponent(searchTerm)}&maxList=${maxList}&df=LOINC_NUM,LONG_COMMON_NAME,COMPONENT,SYSTEM,CLASS,CLASSTYPE`

    try {
        const res = await fetch(url)
        const data = await res.json()

        // data[3] contains the array of arrays with code info
        const results = data[3] || []

        return results.map((item: string[]) => {
            const [code, name, component, system, loincClass, classType] = item
            return {
                code,
                name: name || component || 'Unknown',
                component: component || '',
                system: system || '',
                class: loincClass || '',
                classType: classType || '',
                category: mapClassToCategory(loincClass || ''),
                specialty: mapClassToSpecialty(loincClass || '', component || ''),
            }
        })
    } catch (err) {
        console.error(`Error fetching ${searchTerm}:`, err)
        return []
    }
}

async function main() {
    console.log('Fetching LOINC codes from NLM Clinical Tables API...\n')

    // Search terms to get comprehensive coverage
    const searchTerms = [
        // Common Labs
        '', // Empty string gets most common
        'glucose',
        'creatinine',
        'sodium',
        'potassium',
        'hemoglobin',
        'platelet',
        'troponin',
        'bnp',
        'tsh',
        'hba1c',
        // Specialty Labs
        'cholesterol',
        'triglyceride',
        'bilirubin',
        'albumin',
        'protein',
        'calcium',
        'magnesium',
        'phosphorus',
        'iron',
        'ferritin',
        // Coagulation
        'pt',
        'ptt',
        'inr',
        'fibrinogen',
        'd-dimer',
        // Inflammatory
        'crp',
        'esr',
        'procalcitonin',
        // Endocrine
        'cortisol',
        'acth',
        'prolactin',
        'fsh',
        'lh',
        // Rheumatology
        'ana',
        'rheumatoid',
        'anti-ccp',
        'complement',
        'uric acid',
        // Infectious
        'culture',
        'covid',
        'influenza',
        'rsv',
        // Urinalysis
        'urinalysis',
        'urine',
        // Blood Gas
        'blood gas',
        'ph arterial',
        'pco2',
        'po2',
        // Tumor Markers
        'psa',
        'cea',
        'afp',
        'ca 125',
        'ca 19-9',
    ]

    const allCodes: Map<string, LoincCode> = new Map()

    for (const term of searchTerms) {
        console.log(`Fetching: "${term || 'common labs'}"...`)
        const codes = await fetchLoincCodes(term, 200)
        codes.forEach(code => {
            if (!allCodes.has(code.code)) {
                allCodes.set(code.code, code)
            }
        })
        // Small delay to be nice to the API
        await new Promise(r => setTimeout(r, 100))
    }

    console.log(`\nTotal unique LOINC codes: ${allCodes.size}`)

    // Convert to array and sort by specialty
    const codesArray = Array.from(allCodes.values())

    // Group by specialty for summary
    const bySpecialty: Record<string, number> = {}
    codesArray.forEach(c => {
        bySpecialty[c.specialty] = (bySpecialty[c.specialty] || 0) + 1
    })

    console.log('\nCodes by Specialty:')
    Object.entries(bySpecialty).sort((a, b) => b[1] - a[1]).forEach(([spec, count]) => {
        console.log(`  ${spec}: ${count}`)
    })

    // Save to JSON file
    const outputPath = path.join(__dirname, '../data/loinc/loinc-codes.json')
    fs.writeFileSync(outputPath, JSON.stringify(codesArray, null, 2))
    console.log(`\nSaved to ${outputPath}`)

    // Also generate TypeScript file
    const tsPath = path.join(__dirname, '../src/lib/orders/loinc-database.ts')
    const tsContent = `/**
 * LOINC Codes Database
 * Auto-generated from NLM Clinical Tables API
 * Total: ${codesArray.length} codes
 */

export interface LoincCode {
  code: string
  name: string
  component: string
  system: string
  class: string
  category: string
  specialty: string
}

export const LOINC_DATABASE: LoincCode[] = ${JSON.stringify(codesArray.slice(0, 2000), null, 2)}

export function searchLoinc(query: string, limit = 50): LoincCode[] {
  const q = query.toLowerCase()
  return LOINC_DATABASE
    .filter(c => 
      c.name.toLowerCase().includes(q) ||
      c.code.includes(q) ||
      c.component.toLowerCase().includes(q)
    )
    .slice(0, limit)
}
`
    fs.writeFileSync(tsPath, tsContent)
    console.log(`Generated TypeScript file: ${tsPath}`)
}

main().catch(console.error)
