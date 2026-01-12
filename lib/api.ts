import { NextResponse } from 'next/server'

export type ApiResponse<T = any> = {
    ok: boolean
    data?: T
    error?: string
}

export function jsonResponse<T>(status: number, data?: T, error?: string) {
    const body: ApiResponse<T> = {
        ok: status >= 200 && status < 300,
    }
    if (data !== undefined) body.data = data
    if (error !== undefined) body.error = error

    return NextResponse.json(body, { status })
}
