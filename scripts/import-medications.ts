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
    const displayName = drug.brand_name || drug.generic_name || 'Unknown Medication'

    const coding: any[] = [
        {
            system: 'http://hl7.org/fhir/sid/ndc',
            code: drug.product_ndc,
            display: displayName,
        },
    ]

    // Add RxNorm if available
    if (drug.openfda?.rxcui) {
        drug.openfda.rxcui.forEach(rxcui => {
            coding.push({
                system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
                code: rxcui,
            })
        })
    }

    const medication: any = {
        resourceType: 'Medication',
        id,
        code: {
            coding,
            text: displayName,
        },
        status: 'active',
    }

    // Only add manufacturer if present
    if (drug.labeler_name) {
        medication.manufacturer = { display: drug.labeler_name }
    }

    // Only add form if present
    if (drug.dosage_form) {
        medication.form = { text: drug.dosage_form }
    }

    // Only add ingredients if present and valid
    if (drug.active_ingredients && drug.active_ingredients.length > 0) {
        medication.ingredient = drug.active_ingredients
            .filter(ing => ing && ing.name) // Filter out invalid ingredients
            .map(ing => ({
                itemCodeableConcept: { text: ing.name },
                strength: {
                    numerator: {
                        value: parseFloat((ing.strength || '1').replace(/[^0-9.]/g, '')) || 1,
                        unit: ing.strength || '1',
                    },
                    denominator: {
                        value: 1,
                        unit: '1',
                    },
                },
            }))
    }

    return medication
}

let lastError = ''

async function importMedication(med: any): Promise<boolean> {
    try {
        const response = await fetch(`${BASE_URL}/Medication/${med.id}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify(med),
        })
        if (!response.ok) {
            const text = await response.text()
            lastError = `Status: ${response.status} - ${text.substring(0, 1000)}`
        }
        return response.ok
    } catch (err) {
        lastError = `Exception: ${String(err)}`
        return false
    }
}

async function importBundle(medications: any[]): Promise<{ success: number; failed: number }> {
    const bundle = {
        resourceType: 'Bundle',
        type: 'transaction',
        entry: medications.map(med => ({
            resource: med,
            request: {
                method: 'PUT',
                url: `Medication/${med.id}`,
            },
        })),
    }

    try {
        const response = await fetch(`${BASE_URL}/`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(bundle),
        })

        if (response.ok) {
            return { success: medications.length, failed: 0 }
        } else {
            const text = await response.text()
            lastError = text.substring(0, 300)
            // On bundle failure, try individual imports as fallback
            return { success: 0, failed: medications.length }
        }
    } catch (err) {
        lastError = String(err)
        return { success: 0, failed: medications.length }
    }
}

async function main() {
    const maxCount = parseInt(process.argv[2] || '1000')
    const useBundles = process.argv.includes('--bundle')
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
    console.log(`Mode: ${useBundles ? 'Bundle transactions' : 'Individual PUTs'}`)

    let successCount = 0
    let errorCount = 0
    const batchSize = useBundles ? 100 : 50

    for (let i = 0; i < drugs.length; i += batchSize) {
        const batch = drugs.slice(i, i + batchSize)
        const medications = batch.map(drug => fdaDrugToMedication(drug))

        if (useBundles) {
            const result = await importBundle(medications)
            successCount += result.success
            errorCount += result.failed
        } else {
            const results = await Promise.all(
                medications.map(med => importMedication(med))
            )
            successCount += results.filter(r => r).length
            errorCount += results.filter(r => !r).length
        }

        process.stdout.write(`\r  Progress: ${i + batch.length}/${drugs.length} (${successCount} ok, ${errorCount} failed)`)

        // Show last error every 500 meds
        if (errorCount > 0 && (i + batch.length) % 500 === 0 && lastError) {
            console.log(`\n  Last error: ${lastError}`)
        }
    }

    console.log(`\n\nImport complete: ${successCount} succeeded, ${errorCount} failed`)

    if (errorCount > 0 && lastError) {
        console.log(`\nLast error encountered:`)
        console.log(lastError)
    }

    console.log(`\nSample drugs imported:`)
    drugs.slice(0, 5).forEach(d => {
        console.log(`  - ${d.brand_name || d.generic_name} (NDC: ${d.product_ndc})`)
    })
}

main().catch((err) => {
    console.error('Import failed:', err)
    process.exit(1)
})
