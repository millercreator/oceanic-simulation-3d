'use client'

import { ReactNode, useEffect, useState } from 'react'

interface ClientOnlyProps {
  children: ReactNode
}

/**
 * Component to ensure rendering only on the client side
 * This is important for Babylon.js components to avoid SSR issues
 */
export function ClientOnly({ children }: ClientOnlyProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return <div className="w-full h-screen flex items-center justify-center">Loading 3D environment...</div>
  }

  return <>{children}</>
}

/**
 * Options for dynamic import of Babylon.js components
 */
export const dynamicImportOptions = {
  ssr: false,
  loading: () => <div className="w-full h-screen flex items-center justify-center">Loading 3D environment...</div>
} 