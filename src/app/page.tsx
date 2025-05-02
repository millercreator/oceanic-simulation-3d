'use client'

import dynamic from 'next/dynamic'
import { ClientOnly } from '../utils/clientOnly'

// Dynamically import OceanSimulation with no SSR
const OceanSimulation = dynamic(
  () => import('../components/OceanSimulation'),
  { ssr: false }
)

export default function Home() {
  return (
    <main className="w-full h-screen overflow-hidden">
      <ClientOnly>
        <OceanSimulation />
      </ClientOnly>
    </main>
  );
}
