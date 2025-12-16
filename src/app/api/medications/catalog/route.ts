import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'

const CatalogQuerySchema = z.object({
  search: z.string().optional(),
  active: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
})

const CatalogUpsertSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  ndcCode: z.string().min(1),
  rxCui: z.string().optional().nullable(),
  form: z.string().optional().nullable(),
  strength: z.string().optional().nullable(),
  fhirMedicationId: z.string().optional().nullable(),
  active: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parsed = CatalogQuerySchema.safeParse({
      search: searchParams.get('search') ?? undefined,
      active: searchParams.get('active') ?? undefined,
    })

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters' },
        { status: 400 }
      )
    }

    const { search, active } = parsed.data

    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { ndcCode: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (typeof active === 'boolean') {
      where.active = active
    }

    const items = await prisma.medicationCatalog.findMany({
      where,
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ success: true, data: items })
  } catch (error) {
    console.error('GET /api/medications/catalog error', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load medication catalog' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = CatalogUpsertSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const payload = parsed.data

    // Upsert by id when provided, otherwise by ndcCode to avoid duplicates
    const item = await prisma.medicationCatalog.upsert({
      where: payload.id
        ? { id: payload.id }
        : { ndcCode: payload.ndcCode },
      update: {
        name: payload.name,
        ndcCode: payload.ndcCode,
        rxCui: payload.rxCui || null,
        form: payload.form || null,
        strength: payload.strength || null,
        fhirMedicationId: payload.fhirMedicationId || null,
        active: typeof payload.active === 'boolean' ? payload.active : true,
      },
      create: {
        name: payload.name,
        ndcCode: payload.ndcCode,
        rxCui: payload.rxCui || null,
        form: payload.form || null,
        strength: payload.strength || null,
        fhirMedicationId: payload.fhirMedicationId || null,
        active: typeof payload.active === 'boolean' ? payload.active : true,
      },
    })

    return NextResponse.json({ success: true, data: item })
  } catch (error) {
    console.error('POST /api/medications/catalog error', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save medication catalog entry' },
      { status: 500 }
    )
  }
}


