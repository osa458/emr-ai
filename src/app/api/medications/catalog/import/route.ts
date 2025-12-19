import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { aidbox } from '@/lib/aidbox'

const ImportByNdcSchema = z.object({
  ndcCode: z.string().min(1),
})

function extractCatalogFieldsFromMedication(med: any) {
  const coding = med.code?.coding || []
  const ndcCoding = coding.find(
    (c: any) => c.system === 'http://hl7.org/fhir/sid/ndc'
  )
  const rxCoding = coding.find(
    (c: any) => c.system === 'http://www.nlm.nih.gov/research/umls/rxnorm'
  )

  const ndcCode = ndcCoding?.code || med.id
  const name =
    med.code?.text ||
    ndcCoding?.display ||
    rxCoding?.display ||
    'Medication'

  const form =
    med.form?.text ||
    med.form?.coding?.[0]?.display ||
    undefined

  const strength =
    med.ingredient?.[0]?.strength?.numerator?.unit ||
    med.ingredient?.[0]?.strength?.numerator?.value?.toString() ||
    undefined

  return {
    name,
    ndcCode,
    rxCui: rxCoding?.code || null,
    form: form || null,
    strength: strength || null,
    fhirMedicationId: med.id ? `Medication/${med.id}` : null,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = ImportByNdcSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { ndcCode } = parsed.data

    // Use Aidbox SDK
    const bundle = await aidbox.resource.list('Medication')
      .where('code', `http://hl7.org/fhir/sid/ndc|${ndcCode}` as any)
      .count(5)
    const entry = bundle.entry?.[0]
    const med = entry?.resource

    if (!med) {
      return NextResponse.json(
        {
          success: false,
          error: `No Medication found in Aidbox for NDC ${ndcCode}`,
        },
        { status: 404 }
      )
    }

    const catalogFields = extractCatalogFieldsFromMedication(med)

    const item = await prisma.medicationCatalog.upsert({
      where: { ndcCode: catalogFields.ndcCode },
      update: {
        name: catalogFields.name,
        rxCui: catalogFields.rxCui,
        form: catalogFields.form,
        strength: catalogFields.strength,
        fhirMedicationId: catalogFields.fhirMedicationId,
        active: true,
      },
      create: {
        name: catalogFields.name,
        ndcCode: catalogFields.ndcCode,
        rxCui: catalogFields.rxCui,
        form: catalogFields.form,
        strength: catalogFields.strength,
        fhirMedicationId: catalogFields.fhirMedicationId,
        active: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: item,
      message: 'Medication imported from Aidbox into catalog',
    })
  } catch (error: any) {
    console.error('POST /api/medications/catalog/import error', error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to import medication from Aidbox',
      },
      { status: 500 }
    )
  }
}




