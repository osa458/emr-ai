/**
 * Clinical Orders Search API
 * GET /api/orders/search
 * 
 * Search for lab tests, imaging, procedures by name, code, or specialty
 */

import { NextRequest, NextResponse } from 'next/server'
import { searchAllOrders, getOrdersBySpecialtyFromMaster, SPECIALTIES, getOrderSummary } from '@/lib/orders'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const query = searchParams.get('q') || searchParams.get('query') || ''
        const specialty = searchParams.get('specialty')
        const limit = parseInt(searchParams.get('limit') || '50')

        // If specialty is provided, filter by specialty
        if (specialty) {
            const orders = getOrdersBySpecialtyFromMaster(specialty)
            return NextResponse.json({
                success: true,
                count: orders.length,
                specialty,
                orders,
            })
        }

        // If query is provided, search all orders
        if (query && query.length >= 2) {
            const orders = searchAllOrders(query, limit)
            return NextResponse.json({
                success: true,
                count: orders.length,
                query,
                orders,
            })
        }

        // Return summary if no query
        const summary = getOrderSummary()
        return NextResponse.json({
            success: true,
            message: 'Provide ?q=search or ?specialty=Cardiology',
            ...summary,
            specialties: SPECIALTIES,
        })
    } catch (error) {
        console.error('Order search error:', error)
        return NextResponse.json(
            { success: false, error: 'Search failed' },
            { status: 500 }
        )
    }
}
