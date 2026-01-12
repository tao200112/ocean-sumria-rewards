'use client'
import { AppProvider } from '@/services/store'
import { AuthProvider } from '@/components/auth/AuthProvider'

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AppProvider>
            <AuthProvider>
                {children}
            </AuthProvider>
        </AppProvider>
    )
}
