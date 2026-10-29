import type { Nft } from '../../data/nfts'
import { NftCard } from './NftCard'

export function NftGrid({
  items,
  compact = false,
  priorityCount = 0,
  loading = false,
  previewNft,
}: {
  items: Nft[]
  compact?: boolean
  priorityCount?: number
  loading?: boolean
  previewNft?: Nft
}) {
  const visibleItems = loading && previewNft ? [previewNft] : items

  return (
    <div
      className={`nft-grid${compact ? ' nft-grid-compact' : ''}${loading ? ' catalog-loading' : ''}`}
      aria-label={loading ? 'Carregando NFTs' : undefined}
      aria-busy={loading || undefined}
    >
      {visibleItems.map((nft, index) => (
        <NftCard
          key={nft.id}
          nft={nft}
          compact={compact}
          priority={index < priorityCount}
          loadingPreview={loading && nft.id === previewNft?.id}
        />
      ))}
      {loading &&
        Array.from({ length: Math.max(6 - visibleItems.length, 0) }, (_, index) => (
          <div className="catalog-card-skeleton" key={`skeleton-${index}`} />
        ))}
    </div>
  )
}
