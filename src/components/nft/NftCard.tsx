import { Link } from '@tanstack/react-router'
import type { Nft } from '../../data/nfts'
import { NftArtwork } from './NftArtwork'

export function NftCard({
  nft,
  compact = false,
  priority = false,
  loadingPreview = false,
}: {
  nft: Nft
  compact?: boolean
  priority?: boolean
  loadingPreview?: boolean
}) {
  return (
    <article
      className={`nft-card${compact ? ' nft-card-compact' : ''}${loadingPreview ? ' nft-card-loading-preview' : ''}`}
    >
      <Link
        to="/nft/$nftId"
        params={{ nftId: nft.id }}
        className="nft-image-link"
        aria-label={`Ver ${nft.name}`}
      >
        <NftArtwork
          nft={nft}
          className="nft-image"
          decorative={loadingPreview}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
        />
      </Link>
      {loadingPreview ? (
        <div className="catalog-preview-lines" aria-hidden="true">
          <i />
          <i />
        </div>
      ) : (
        <div className="nft-card-info">
          <div>
            <span className="eyebrow">{nft.collection}</span>
            <Link
              to="/nft/$nftId"
              params={{ nftId: nft.id }}
              className="nft-name"
            >
              {nft.name}
            </Link>
          </div>
          <div className="nft-price">
            <span>{nft.price}</span>
            <small>ETH</small>
          </div>
        </div>
      )}
      {!loadingPreview && !compact && (
        <div className="nft-card-meta">
          <span>EDIÇÃO {nft.edition}</span>
          <span>◈ Ethereum</span>
        </div>
      )}
    </article>
  )
}
