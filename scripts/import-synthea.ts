/**
 * Import Synthea FHIR bundles into Aidbox
 * Usage: pnpm tsx scripts/import-synthea.ts [count]
 * 
 * Example: pnpm tsx scripts/import-synthea.ts 10  # Import 10 patients
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

async function importBundle(bundleJson: any): Promise<{ success: boolean; patientName?: string; error?: string }> {
    try {
        // Synthea bundles use method POST with relative URLs. 
        // Convert to PUT to avoid duplicate resources
        const bundle = {
            ...bundleJson,
            entry: bundleJson.entry?.map((entry: any) => ({
                ...entry,
                request: {
                    method: 'PUT',
                    url: `${entry.resource.resourceType}/${entry.resource.id}`,
                },
            })),
        }

        const response = await fetch(BASE_URL, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(bundle),
        })

        if (!response.ok) {
            const error = await response.text()
            return { success: false, error: error.substring(0, 200) }
        }

        // Extract patient name from bundle
        const patientEntry = bundleJson.entry?.find((e: any) => e.resource.resourceType === 'Patient')
        const name = patientEntry?.resource.name?.[0]
        const patientName = name ? `${name.given?.[0] || ''} ${name.family || ''}` : 'Unknown'

        return { success: true, patientName }
    } catch (err) {
        return { success: false, error: String(err) }
    }
}

async function main() {
    const maxCount = parseInt(process.argv[2] || '10')
    const syntheaDir = path.join(__dirname, '../data/synthea/fhir')

    if (!fs.existsSync(syntheaDir)) {
        console.error('Synthea data not found. Please run:')
        console.error('  mkdir -p data/synthea && cd data/synthea')
        console.error('  curl -L -O https://synthetichealth.github.io/synthea-sample-data/downloads/synthea_sample_data_fhir_r4_sep2019.zip')
        console.error('  unzip synthea_sample_data_fhir_r4_sep2019.zip')
        process.exit(1)
    }

    const files = fs.readdirSync(syntheaDir)
        .filter(f => f.endsWith('.json'))
        .slice(0, maxCount)

    console.log(`Importing ${files.length} Synthea patients to Aidbox...`)

    let successCount = 0
    let errorCount = 0

    for (const file of files) {
        const content = fs.readFileSync(path.join(syntheaDir, file), 'utf-8')
        const bundle = JSON.parse(content)

        const result = await importBundle(bundle)

        if (result.success) {
            successCount++
            console.log(`✓ ${result.patientName}`)
        } else {
            errorCount++
            console.error(`✗ ${file}: ${result.error}`)
        }
    }

    console.log(`\nImport complete: ${successCount} succeeded, ${errorCount} failed`)

    // Show resource counts
    const sampleBundle = JSON.parse(fs.readFileSync(path.join(syntheaDir, files[0]), 'utf-8'))
    const resourceTypes = new Map<string, number>()
    for (const entry of sampleBundle.entry || []) {
        const type = entry.resource.resourceType
        resourceTypes.set(type, (resourceTypes.get(type) || 0) + 1)
    }

    console.log('\nResource types in each patient bundle:')
    for (const [type, count] of Array.from(resourceTypes.entries())) {
        console.log(`  ${type}: ${count}`)
    }
}

main().catch((err) => {
    console.error('Import failed:', err)
    process.exit(1)
})
