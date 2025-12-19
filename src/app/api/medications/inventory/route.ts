import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'

const InventoryQuerySchema = z.object({
  search: z.string().optional(),
  location: z.string().optional(),
  lowStockOnly: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
})

const InventoryAdjustSchema = z.object({
  inventoryId: z.string(),
  quantityDelta: z.number().int(),
  reason: z.string().optional(),
})

const InventoryCreateSchema = z.object({
  catalogId: z.string(),
  location: z.string().min(1),
  lotNumber: z.string().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  quantityOnHand: z.number().int().default(0),
  reorderLevel: z.number().int().default(0),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parsed = InventoryQuerySchema.safeParse({
      search: searchParams.get('search') ?? undefined,
      location: searchParams.get('location') ?? undefined,
      lowStockOnly: searchParams.get('lowStockOnly') ?? undefined,
    })

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters' },
        { status: 400 }
      )
    }

    const { search, location, lowStockOnly } = parsed.data

    const where: any = {}
    if (location) {
      where.location = location
    }

    if (typeof lowStockOnly === 'boolean' && lowStockOnly) {
      where.AND = [
        { reorderLevel: { gt: 0 } },
        { quantityOnHand: { lt: prisma.medicationInventory.fields.reorderLevel } as any },
      ]
    }

    const items = await prisma.medicationInventory.findMany({
      where,
      include: {
        catalog: true,
      },
      orderBy: [
        { location: 'asc' },
        { catalog: { name: 'asc' } },
      ],
    })

    const filtered = search
      ? items.filter((item) => {
          const haystack = `${item.catalog.name} ${item.catalog.ndcCode}`.toLowerCase()
          return haystack.includes(search.toLowerCase())
        })
      : items

    return NextResponse.json({ success: true, data: filtered })
  } catch (error) {
    console.error('GET /api/medications/inventory error', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load medication inventory' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = InventoryCreateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const payload = parsed.data

    const item = await prisma.$transaction(async (tx) => {
      const created = await tx.medicationInventory.create({
        data: {
          catalogId: payload.catalogId,
          location: payload.location,
          lotNumber: payload.lotNumber || null,
          expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : null,
          quantityOnHand: payload.quantityOnHand,
          reorderLevel: payload.reorderLevel,
        },
      })

      if (payload.quantityOnHand !== 0) {
        await tx.medicationTransaction.create({
          data: {
            inventoryId: created.id,
            type: payload.quantityOnHand > 0 ? 'RECEIPT' : 'ADJUST',
            quantityDelta: payload.quantityOnHand,
            reason: 'Initial stock',
          },
        })
      }

      return tx.medicationInventory.findUnique({
        where: { id: created.id },
        include: { catalog: true },
      })
    })

    return NextResponse.json({ success: true, data: item })
  } catch (error) {
    console.error('POST /api/medications/inventory error', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create inventory item' },
      { status: 500 }
    )
  }
}

// PATCH is used for adjustments (receive, dispense, manual correction)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = InventoryAdjustSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { inventoryId, quantityDelta, reason } = parsed.data

    const item = await prisma.$transaction(async (tx) => {
      const existing = await tx.medicationInventory.findUnique({
        where: { id: inventoryId },
      })
      if (!existing) {
        throw new Error('Inventory item not found')
      }

      const newQty = existing.quantityOnHand + quantityDelta
      if (newQty < 0) {
        throw new Error('Quantity cannot be negative')
      }

      const updated = await tx.medicationInventory.update({
        where: { id: inventoryId },
        data: {
          quantityOnHand: newQty,
        },
      })

      await tx.medicationTransaction.create({
        data: {
          inventoryId,
          type: quantityDelta > 0 ? 'RECEIPT' : 'DISPENSE',
          quantityDelta,
          reason: reason || null,
        },
      })

      return tx.medicationInventory.findUnique({
        where: { id: updated.id },
        include: { catalog: true },
      })
    })

    return NextResponse.json({ success: true, data: item })
  } catch (error: any) {
    console.error('PATCH /api/medications/inventory error', error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to adjust inventory',
      },
      { status: 400 }
    )
  }
}




