import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'

export const runtime = 'nodejs'

const CreateConnectionSchema = z.object({
  vendor: z.enum(['epic', 'eclinicalworks']),
  tenantSlug: z.string().min(1).default('default'),
  issuer: z.string().url().optional(),
  fhirBaseUrl: z.string().url(),
  clientId: z.string().min(1),
  clientSecret: z.string().min(1).optional(),
  scopes: z.string().min(1).optional(),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as any)?.id as string | undefined
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Missing user id in session' }, { status: 400 })
  }

  const items = await prisma.ehrConnection.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      tenant: true,
      userTokens: {
        where: { userId },
        select: { id: true, expiresAt: true },
      },
    },
  })

  const now = Date.now()
  const data = items.map((c) => {
    const token = c.userTokens[0]
    const connected = !!token && (!token.expiresAt || token.expiresAt.getTime() > now)
    const { userTokens, ...rest } = c
    return { ...rest, connected }
  })

  return NextResponse.json({ success: true, data })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const json = await request.json()
    const input = CreateConnectionSchema.parse(json)

    const tenant = await prisma.tenant.upsert({
      where: { slug: input.tenantSlug },
      update: {},
      create: { slug: input.tenantSlug, name: input.tenantSlug },
    })

    const vendor = input.vendor === 'epic' ? 'EPIC' : 'ECLINICALWORKS'

    const created = await prisma.ehrConnection.create({
      data: {
        tenantId: tenant.id,
        vendor,
        issuer: input.issuer || null,
        fhirBaseUrl: input.fhirBaseUrl,
        clientId: input.clientId,
        clientSecret: input.clientSecret || null,
        scopes: input.scopes || null,
      },
      include: { tenant: true },
    })

    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to create connection' }, { status: 400 })
  }
}
