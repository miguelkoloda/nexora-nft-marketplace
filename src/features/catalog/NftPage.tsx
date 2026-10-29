import { useState } from 'react'
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from '@tanstack/react-router'
import {
  ArrowLeft,
  ChevronRight,
  Heart,
  Linkedin,
  Mail,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Star,
  Twitter,
} from 'lucide-react'
import { ApiError, getSessionUserId } from '../../api/client'
import {
  useAddCartItem,
  useFavorites,
  useNft,
  useNfts,
  useToggleFavorite,
} from '../../api/hooks'
import { NftArtwork } from '../../components/nft/NftArtwork'
import { NftGrid } from '../../components/nft/NftGrid'

export function NftPage() {
  const { nftId } = useParams({ from: '/shell/nft/$nftId' })
  const navigate = useNavigate()
  const location = useLocation()
  const userId = getSessionUserId()
  const nftQuery = useNft(nftId)
  const nft = nftQuery.data
  const relatedQuery = useNfts(
    { category: nft?.category, page: 1, pageSize: 6 },
    Boolean(nft),
  )
  const favoritesQuery = useFavorites(userId)
  const favoriteMutation = useToggleFavorite(userId ?? 'guest')
  const addCartMutation = useAddCartItem(userId)
  const [quantity, setQuantity] = useState(1)
  const favorite =
    favoritesQuery.data?.some((item) => item.id === nftId) ?? false

  if (nftQuery.isPending) {
    return (
      <section
        className="detail-not-found detail-route-loading page-wrap"
        aria-busy="true"
      >
        <div className="detail-loading-skeleton" aria-label="Carregando NFT" />
      </section>
    )
  }

  if (
    nftQuery.isError &&
    nftQuery.error instanceof ApiError &&
    nftQuery.error.status === 404
  ) {
    return (
      <section className="detail-not-found page-wrap">
        <h1>NFT não encontrado</h1>
        <p>Este item não está disponível no catálogo.</p>
        <Link to="/">Voltar ao mercado</Link>
      </section>
    )
  }

  if (nftQuery.isError || !nft) {
    return (
      <section className="detail-not-found page-wrap" role="alert">
        <h1>Não foi possível carregar este NFT</h1>
        <p>
          {nftQuery.error instanceof Error
            ? nftQuery.error.message
            : 'Tente novamente.'}
        </p>
        <button type="button" onClick={() => void nftQuery.refetch()}>
          Tentar novamente
        </button>
      </section>
    )
  }

  const currentNft = nft
  const tokenId = currentNft.id.split('-').at(-1) ?? '042'
  const related = (relatedQuery.data?.items ?? [])
    .filter((item) => item.id !== currentNft.id)
    .slice(0, 5)
  const maxQuantity = Math.min(10, currentNft.availableQuantity)

  function toggleFavorite() {
    if (!userId) {
      void navigate({
        to: '/login',
        search: { returnTo: location.pathname },
      })
      return
    }
    favoriteMutation.mutate({ nft: currentNft, isFavorite: favorite })
  }

  async function addToCart() {
    try {
      await addCartMutation.mutateAsync({
        nftId: currentNft.id,
        quantity,
        edition: currentNft.edition,
      })
      await navigate({ to: '/cart' })
    } catch {
      // A falha permanece visível na tela e não navega para o carrinho.
    }
  }

  return (
    <div className="detail-page page-wrap">
      <nav className="breadcrumbs" aria-label="Trilha de navegação">
        <Link to="/">Início</Link>
        <ChevronRight size={11} />
        <Link to="/" hash="#catalogo">
          Mercado
        </Link>
      </nav>

      <div className="detail-mobile-controls">
        <Link to="/" aria-label="Voltar ao mercado">
          <ArrowLeft size={17} />
        </Link>
        <button
          type="button"
          aria-label={
            favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'
          }
          aria-pressed={favorite}
          className={favorite ? 'is-favorite' : ''}
          onClick={toggleFavorite}
          disabled={favoriteMutation.isPending}
        >
          <Heart size={17} />
        </button>
      </div>

      <section className="detail-layout">
        <div className="detail-gallery">
          <div className="gallery-thumbs" aria-label="Imagens do NFT">
            {[0, 1, 2, 3].map((image) => (
              <button
                type="button"
                key={image}
                className={image === 1 ? 'thumb-active' : ''}
                aria-label={`Ver imagem ${image + 1}`}
              >
                <NftArtwork nft={nft} decorative />
              </button>
            ))}
          </div>
          <div className="gallery-main">
            <NftArtwork
              nft={nft}
              className="detail-artwork"
              loading="eager"
              fetchPriority="high"
            />
            <button
              type="button"
              className="gallery-expand"
              aria-label="Ampliar imagem"
            >
              <Search size={20} />
            </button>
          </div>
        </div>

        <div className="detail-info">
          <div className="detail-title-row">
            <h1>{nft.name}</h1>
            <span className="detail-rating">
              <Star size={12} fill="currentColor" /> 4.8 <small>(19)</small>
            </span>
          </div>
          <div className="detail-price-line">
            <strong>{nft.price} ETH</strong>
            <span>
              {[0, 1, 2, 3, 4].map((star) => (
                <Star key={star} size={14} fill="currentColor" />
              ))}{' '}
              <small>19 avaliações de colecionadores</small>
            </span>
          </div>

          <section className="detail-about">
            <h2>Sobre este NFT:</h2>
            <p className="detail-description-desktop">
              Um colecionável digital finalizado à mão da coleção Kurio
              Editions, verificado na Ethereum, com arte desbloqueável e acesso
              para colecionadores.
            </p>
            <p className="detail-description-mobile">
              Um colecionável digital 1/50 finalizado à mão da coleção Kurio
              Editions, verificado na Ethereum.
            </p>
          </section>

          <div className="detail-editions">
            <strong>Edição:</strong>
            <div>
              {['1/1', '1/10', '1/50', 'ABERTA'].map((edition, index) => (
                <button
                  type="button"
                  className={index === 2 ? 'edition-active' : ''}
                  key={edition}
                >
                  {index === 0 ? (
                    <>
                      <span className="edition-desktop">{edition}</span>
                      <span className="edition-mobile">1/10</span>
                    </>
                  ) : (
                    edition
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="detail-metadata">
            <p>
              ID do token: <span>#{tokenId}</span>
            </p>
            <p>
              Coleção: <span>Kurio Apes</span>
            </p>
            <p>
              Atributos: <span>Óculos, Esmeralda, Raro</span>
            </p>
          </div>

          <div className="detail-purchase">
            <div className="purchase-topline">
              <div className="detail-quantity">
                <span>Qtd.</span>
                <div className="quantity-control">
                  <button
                    type="button"
                    aria-label="Diminuir quantidade"
                    onClick={() =>
                      setQuantity((value) => Math.max(1, value - 1))
                    }
                  >
                    <Minus size={13} />
                  </button>
                  <span>{quantity}</span>
                  <button
                    type="button"
                    aria-label="Aumentar quantidade"
                    onClick={() =>
                      setQuantity((value) => Math.min(maxQuantity, value + 1))
                    }
                    disabled={quantity >= maxQuantity}
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
              <strong className="detail-price">{nft.price} ETH</strong>
            </div>
            <div className="detail-purchase-actions">
              <button
                type="button"
                className="button button-primary"
                onClick={() => void addToCart()}
                disabled={addCartMutation.isPending}
              >
                <span className="detail-buy-desktop">COMPRAR</span>
                <span className="detail-buy-mobile">Comprar NFT</span>
              </button>
              <button
                type="button"
                className={`favorite-button${favorite ? ' is-favorite' : ''}`}
                aria-pressed={favorite}
                onClick={toggleFavorite}
                disabled={favoriteMutation.isPending}
              >
                <Heart size={15} /> Favoritar
              </button>
              <button
                type="button"
                className="detail-cart-button"
                aria-label="Adicionar ao carrinho"
                onClick={() => void addToCart()}
                disabled={addCartMutation.isPending}
              >
                <ShoppingCart size={17} />
              </button>
            </div>
            {addCartMutation.isError && (
              <p className="detail-action-error" role="alert">
                {addCartMutation.error instanceof Error
                  ? addCartMutation.error.message
                  : 'Não foi possível adicionar ao carrinho.'}
              </p>
            )}
            {favoriteMutation.isError && (
              <p className="detail-action-error" role="alert">
                {favoriteMutation.error instanceof Error
                  ? favoriteMutation.error.message
                  : 'Não foi possível atualizar os favoritos.'}
              </p>
            )}
          </div>

          <div className="desktop-favorite-row">
            <span>Compartilhar este NFT:</span>
            <button type="button" aria-label="Compartilhar no LinkedIn">
              <Linkedin size={15} />
            </button>
            <button type="button" aria-label="Compartilhar por e-mail">
              <Mail size={15} />
            </button>
            <button type="button" aria-label="Compartilhar no Twitter">
              <Twitter size={15} fill="currentColor" />
            </button>
          </div>
        </div>
      </section>

      <section className="detail-description-section">
        <div className="detail-copy">
          <div className="detail-tabs">
            <button className="tab-active" type="button">
              Detalhes do NFT
            </button>
            <button type="button">Avaliações de colecionadores (19)</button>
          </div>
          <p>
            {nft.name} é uma obra digital 1/50 finalizada à mão da coleção Kurio
            Editions. Cada atributo fica armazenado nos metadados do token e
            verificado na Ethereum. A obra explora identidade, movimento e luz
            em um mundo digital sem fronteiras.
          </p>
          <p>
            A propriedade inclui a arte em alta resolução, lançamentos
            exclusivos para colecionadores e um registro permanente de
            procedência registrado na rede. Nova arte recebe 5% de direitos
            autorais nas vendas secundárias.
          </p>
          <p>
            <strong>Rede:</strong>
            <br /> cunhado na Ethereum com procedência imutável e metadados
            armazenados no IPFS.
          </p>
          <p>
            <strong>Contrato:</strong>
            <br /> direitos autorais do criador: 5% nas vendas secundárias,
            pagos automaticamente pelos mercados compatíveis.
          </p>
          <p>
            <strong>Direitos autorais:</strong>
            <br /> 0x7A42...198B · Contrato inteligente ERC-721 verificado.
          </p>
        </div>
      </section>

      <section className="related-section">
        <div className="section-heading">
          <h2>Mais desta coleção</h2>
        </div>
        {relatedQuery.isPending ? (
          <div className="catalog-message" aria-busy="true">
            Carregando itens relacionados...
          </div>
        ) : relatedQuery.isError ? (
          <div className="catalog-message" role="alert">
            Não foi possível carregar itens desta coleção.
          </div>
        ) : related.length ? (
          <NftGrid items={related} compact />
        ) : (
          <div className="catalog-message">
            Não há outros itens desta coleção no momento.
          </div>
        )}
        <div
          className="detail-pagination"
          role="group"
          aria-label="Página 1 de 3"
        >
          <i className="selected" />
          <i />
          <i />
        </div>
      </section>
    </div>
  )
}
