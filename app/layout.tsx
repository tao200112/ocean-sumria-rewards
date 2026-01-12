import React from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../index.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ocean Sumria Rewards',
  description: 'Rewards System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
        <script src="https://cdn.tailwindcss.com"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            tailwind.config = {
              darkMode: 'class',
              theme: {
                extend: {
                  fontFamily: {
                    sans: ['"Plus Jakarta Sans"', 'sans-serif'],
                  },
                  colors: {
                    ocean: {
                      950: '#050a18',
                      900: '#0a1128',
                      800: '#111b33',
                      700: '#1e2c4f',
                    },
                    gold: {
                      400: '#f2a60d',
                      500: '#d99000',
                    },
                    surface: {
                      dark: '#1e293b',
                      light: '#ffffff'
                    }
                  },
                  animation: {
                    'spin-slow': 'spin 8s linear infinite',
                  }
                },
              },
            }
          `
        }} />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
