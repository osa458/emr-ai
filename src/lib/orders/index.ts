/**
 * Clinical Orders Index
 * Exports all specialty orders and search functionality
 */

export * from './clinical-orders'
export * from './specialty-orders'

import { ALL_CLINICAL_ORDERS, type ClinicalOrder, searchOrders } from './clinical-orders'
import { ADDITIONAL_SPECIALTY_ORDERS } from './specialty-orders'

// Combined master list of all clinical orders
export const MASTER_ORDER_LIST: ClinicalOrder[] = [
    ...ALL_CLINICAL_ORDERS,
    ...ADDITIONAL_SPECIALTY_ORDERS,
]

// All specialties available
export const SPECIALTIES = [
    'Cardiology',
    'Neurology',
    'Pulmonology',
    'Gastroenterology',
    'Endocrinology',
    'Rheumatology',
    'Nephrology',
    'Hematology',
    'Oncology',
    'Infectious Disease',
    'Vascular',
] as const

// All order categories
export const ORDER_CATEGORIES = [
    'Labs',
    'Imaging',
    'Procedures',
    'Consults',
] as const

// Search all orders
export function searchAllOrders(query: string, limit = 50): ClinicalOrder[] {
    if (!query || query.length < 2) return []

    const q = query.toLowerCase()
    return MASTER_ORDER_LIST
        .filter(o =>
            o.name.toLowerCase().includes(q) ||
            o.code.toLowerCase().includes(q) ||
            o.specialty.toLowerCase().includes(q) ||
            o.category.toLowerCase().includes(q)
        )
        .slice(0, limit)
}

// Get orders by specialty
export function getOrdersBySpecialtyFromMaster(specialty: string): ClinicalOrder[] {
    return MASTER_ORDER_LIST.filter(o =>
        o.specialty.toLowerCase() === specialty.toLowerCase()
    )
}

// Get orders by category
export function getOrdersByCategory(category: string): ClinicalOrder[] {
    return MASTER_ORDER_LIST.filter(o =>
        o.category.toLowerCase() === category.toLowerCase()
    )
}

// Get orders by type
export function getOrdersByType(type: ClinicalOrder['type']): ClinicalOrder[] {
    return MASTER_ORDER_LIST.filter(o => o.type === type)
}

// Get order count summary
export function getOrderSummary() {
    const bySpecialty: Record<string, number> = {}
    const byCategory: Record<string, number> = {}

    MASTER_ORDER_LIST.forEach(o => {
        bySpecialty[o.specialty] = (bySpecialty[o.specialty] || 0) + 1
        byCategory[o.category] = (byCategory[o.category] || 0) + 1
    })

    return {
        total: MASTER_ORDER_LIST.length,
        bySpecialty,
        byCategory,
    }
}
