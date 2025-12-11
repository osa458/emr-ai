import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAuditLog, type AuditAction } from '@/lib/audit'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can view audit logs
    const userRole = (session.user as unknown as { role: string }).role
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || undefined
    const action = searchParams.get('action') as AuditAction | undefined
    const resource = searchParams.get('resource') || undefined
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!)
      : 100

    const logs = getAuditLog({
      userId,
      action,
      resource,
      limit,
    })

    return NextResponse.json({
      success: true,
      data: logs,
      count: logs.length,
    })
  } catch (error) {
    console.error('Audit log error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve audit logs' },
      { status: 500 }
    )
  }
}
