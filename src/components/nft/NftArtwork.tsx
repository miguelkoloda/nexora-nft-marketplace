import type { Nft } from '../../data/nfts'

const artworkAssets: Record<string, { primary: string; fallback: string }> = {
  golden: {
    primary: '/artwork/emerald-ape.webp',
    fallback: '/artwork/emerald-ape.png',
  },
  cloud: {
    primary: '/artwork/sage-nomad.png',
    fallback: '/artwork/sage-nomad.png',
  },
  safari: {
    primary: '/artwork/neon-vessel.png',
    fallback: '/artwork/neon-vessel.png',
  },
  urban: {
    primary: '/artwork/neon-vessel.png',
    fallback: '/artwork/neon-vessel.png',
  },
  sunset: {
    primary: '/artwork/golden-beat.png',
    fallback: '/artwork/golden-beat.png',
  },
  jungle: {
    primary: '/artwork/emerald-ape.webp',
    fallback: '/artwork/emerald-ape.png',
  },
}

export function NftArtwork({
  nft,
  className = '',
  decorative = false,
  loading,
  fetchPriority,
}: {
  nft: Nft
  className?: string
  decorative?: boolean
  loading?: 'eager' | 'lazy'
  fetchPriority?: 'high' | 'low' | 'auto'
}) {
  const artwork = artworkAssets[nft.artwork] ?? artworkAssets.golden

  return (
    <img
      className={className}
      src={artwork.primary}
      alt={decorative ? '' : `${nft.name}, arte digital colecionável`}
      aria-hidden={decorative || undefined}
      loading={loading ?? (decorative ? 'lazy' : 'eager')}
      fetchPriority={fetchPriority}
      decoding="async"
      onError={(event) => {
        const image = event.currentTarget
        if (image.dataset.fallbackApplied) return
        image.dataset.fallbackApplied = 'true'
        image.src = artwork.fallback
      }}
    />
  )
}
