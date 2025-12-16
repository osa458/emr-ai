/**
 * Import FDA NDC medications into Aidbox as Medication resources
 * Usage: pnpm tsx scripts/import-medications.ts [count]
 * 
 * Example: pnpm tsx scripts/import-medications.ts 1000
 */

import * as fs from 'fs'
import * as path from 'path'

const BASE_URL = process.env.AIDBOX_BASE_URL || 'https://aoadhslfxc.edge.aidbox.app'
const CLIENT_ID = process.env.AIDBOX_CLIENT_ID || 'emr-api'
const CLIENT_SECRET = process.env.AIDBOX_CLIENT_SECRET || 'emr-secret-123'

function authHeaders() {
    const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
    return {
        'Authorization': `Basic ${basic}`,
        'Content-Type': 'application/fhir+json',
        'Accept': 'application/fhir+json',
    }
}

interface FDADrug {
    product_ndc: string
    generic_name: string
    brand_name: string
    labeler_name: string
    dosage_form: string
    route?: string[]
    active_ingredients?: Array<{ name: string; strength: string }>
    pharm_class?: string[]
    openfda?: {
        rxcui?: string[]
    }
}

function fdaDrugToMedication(drug: FDADrug): any {
    const id = drug.product_ndc.replace(/-/g, '')

    return {
        resourceType: 'Medication',
        id,
        code: {
            coding: [
                // NDC code
                {
                    system: 'http://hl7.org/fhir/sid/ndc',
                    code: drug.product_ndc,
                    display: drug.brand_name || drug.generic_name,
                },
                // RxNorm if available
                ...(drug.openfda?.rxcui?.map(rxcui => ({
                    system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
                    code: rxcui,
                })) || []),
            ],
            text: drug.brand_name || drug.generic_name,
        },
        status: 'active',
        manufacturer: drug.labeler_name ? { display: drug.labeler_name } : undefined,
        form: drug.dosage_form ? { text: drug.dosage_form } : undefined,
        ingredient: drug.active_ingredients?.map(ing => ({
            itemCodeableConcept: { text: ing.name },
            strength: { numerator: { value: parseFloat(ing.strength) || 1, unit: ing.strength } },
        })),
        extension: [
            // Store route
            ...(drug.route?.map(r => ({
                url: 'http://hl7.org/fhir/StructureDefinition/medication-route',
                valueString: r,
            })) || []),
            // Store pharm class
            ...(drug.pharm_class?.map(pc => ({
                url: 'http://emmai.local/fhir/StructureDefinition/pharm-class',
                valueString: pc,
            })) || []),
        ],
    }
}

async function importMedication(med: any): Promise<boolean> {
    try {
        const response = await fetch(`${BASE_URL}/Medication/${med.id}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify(med),
        })
        return response.ok
    } catch {
        return false
    }
}

async function main() {
    const maxCount = parseInt(process.argv[2] || '1000')
    const fdaFile = path.join(__dirname, '../data/medications/drug-ndc-0001-of-0001.json')

    if (!fs.existsSync(fdaFile)) {
        console.error('FDA NDC data not found. Download from:')
        console.error('https://download.open.fda.gov/drug/ndc/drug-ndc-0001-of-0001.json.zip')
        process.exit(1)
    }

    console.log('Loading FDA NDC data...')
    const raw = fs.readFileSync(fdaFile, 'utf-8')
    const data = JSON.parse(raw)
    const drugs: FDADrug[] = data.results.slice(0, maxCount)

    console.log(`Importing ${drugs.length} medications to Aidbox...`)

    let successCount = 0
    let errorCount = 0
    const batchSize = 50

    for (let i = 0; i < drugs.length; i += batchSize) {
        const batch = drugs.slice(i, i + batchSize)
        const results = await Promise.all(
            batch.map(drug => importMedication(fdaDrugToMedication(drug)))
        )

        successCount += results.filter(r => r).length
        errorCount += results.filter(r => !r).length

        process.stdout.write(`\r  Progress: ${i + batch.length}/${drugs.length} (${successCount} ok, ${errorCount} failed)`)
    }

    console.log(`\n\nImport complete: ${successCount} succeeded, ${errorCount} failed`)
    console.log(`\nSample drugs imported:`)
    drugs.slice(0, 5).forEach(d => {
        console.log(`  - ${d.brand_name || d.generic_name} (NDC: ${d.product_ndc})`)
    })
}

main().catch((err) => {
    console.error('Import failed:', err)
    process.exit(1)
})
