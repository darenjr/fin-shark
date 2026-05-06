'use client'

import { useState } from 'react'
import AssetAllocationChart from '@/components/AssetAllocationChart'
import AssetTable from '@/components/AssetTable'
import type { Asset } from '@/types'

interface Props {
  initial: Asset[]
}

export default function AssetsView({ initial }: Props) {
  const [assets, setAssets] = useState<Asset[]>(initial)

  return (
    <div className="space-y-6">
      <AssetAllocationChart assets={assets} />
      <AssetTable assets={assets} setAssets={setAssets} />
    </div>
  )
}
