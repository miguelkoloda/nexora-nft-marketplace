import { useState } from 'react'
import { ArrowLeft, Minus, Plus, Trash2 } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { ApiError } from '../../api/client'
import {
  useApplyCoupon,
  useCart,
  useCheckoutQuote,
  useRemoveCartItem,
  useRemoveCoupon,
  useUpdateCartItem,
} from '../../api/hooks'
import type { CartItem, Quote } from '../../domain/types'
import { multiplyEther } from '../../lib/ether'
import { nfts } from '../../data/nfts'
import { Button } from '../../components/ui/Button'
import { NftGrid } from '../../components/nft/NftGrid'
import { NftArtwork } from '../../components/nft/NftArtwork'

function formatError(error: unknown): string {
  if (error instanceof ApiError) {
    const fields = Object.values(error.fields ?? {})
    return fields.length ? fields.join(' ') : error.message
  }
  return error instanceof Error
    ? error.message
    : 'Não foi possível concluir a operação.'
}

function ItemRows({
  items,
  mobile = false,
  busy,
  onQuantity,
  onRemove,
}: {
  items: CartItem[]
  mobile?: boolean
  busy: boolean
  onQuantity: (item: CartItem, quantity: number) => void
  onRemove: (item: CartItem) => void
}) {
  return items.map((item) => {
    const { nft, quantity } = item
    const tokenId = nft.id.split('-').at(-1) ?? nft.id
    const lineTotal = multiplyEther(nft.price, quantity)
    const maxQuantity = nft.availableQuantity

    return (
      <article
        className={`cart-item${mobile ? ' cart-item-mobile' : ''}`}
        key={nft.id}
      >
        <Link
          to="/nft/$nftId"
          params={{ nftId: nft.id }}
          className="cart-thumb"
          aria-label={`Ver ${nft.name}`}
        >
          <NftArtwork nft={nft} className="cart-artwork" decorative />
        </Link>
        <div className="cart-item-info">
          <Link
            to="/nft/$nftId"
            params={{ nftId: nft.id }}
            className="nft-name"
          >
            {nft.name}
          </Link>
          <small className="cart-edition-desktop">
            ID do token: #{tokenId}
          </small>
          <small className="cart-edition-mobile">Edição: {item.edition}</small>
          {mobile && (
            <strong className="cart-mobile-price">{lineTotal} ETH</strong>
          )}
        </div>
        <strong className="cart-unit-price">
          {nft.price} <small>ETH</small>
        </strong>
        <div className="cart-quantity">
          <button
            type="button"
            aria-label={`Diminuir quantidade de ${nft.name}`}
            disabled={busy || quantity <= 1}
            onClick={() => onQuantity(item, quantity - 1)}
          >
            <Minus size={14} />
          </button>
          <span>{quantity}</span>
          <button
            type="button"
            aria-label={`Aumentar quantidade de ${nft.name}`}
            disabled={busy || quantity >= maxQuantity}
            onClick={() => onQuantity(item, quantity + 1)}
          >
            <Plus size={14} />
          </button>
        </div>
        <strong className="cart-line-total">
          {lineTotal} <small>ETH</small>
        </strong>
        <button
          type="button"
          className="cart-remove"
          aria-label={`Remover ${nft.name}`}
          disabled={busy}
          onClick={() => onRemove(item)}
        >
          <Trash2 size={18} />
        </button>
      </article>
    )
  })
}

function CartSummary({
  quote,
  couponCode,
  couponDraft,
  couponError,
  couponPending,
  quoteLoading,
  quoteError,
  onCouponDraft,
  onApplyCoupon,
  onRemoveCoupon,
  onRetryQuote,
  mobile = false,
}: {
  quote?: Quote
  couponCode: string | null
  couponDraft: string
  couponError: string
  couponPending: boolean
  quoteLoading: boolean
  quoteError: string
  onCouponDraft: (value: string) => void
  onApplyCoupon: () => void
  onRemoveCoupon: () => void
  onRetryQuote: () => void
  mobile?: boolean
}) {
  return (
    <aside
      className={
        mobile ? 'cart-mobile-summary' : 'order-summary cart-desktop-summary'
      }
      aria-label={mobile ? 'Resumo do carrinho' : undefined}
    >
      {!mobile && <h2>Resumo da carteira</h2>}
      {!mobile && (
        <label className="coupon-label" htmlFor="desktop-coupon">
          Código promocional
        </label>
      )}
      <form
        className="coupon-entry"
        onSubmit={(event) => {
          event.preventDefault()
          onApplyCoupon()
        }}
      >
        <input
          id={mobile ? 'mobile-coupon' : 'desktop-coupon'}
          placeholder="Digite o código promocional..."
          aria-label="Código promocional"
          value={couponDraft}
          onChange={(event) => onCouponDraft(event.target.value)}
          disabled={couponPending}
        />
        <button type="submit" disabled={couponPending || !couponDraft.trim()}>
          {couponPending ? 'Aguarde...' : 'Aplicar'}
        </button>
      </form>
      {couponError && (
        <p className="cart-feedback-error" role="alert">
          {couponError}
        </p>
      )}
      {couponCode && (
        <p className="cart-coupon-applied" role="status">
          Cupom {couponCode} aplicado.
          <button
            type="button"
            onClick={onRemoveCoupon}
            disabled={couponPending}
          >
            Remover
          </button>
        </p>
      )}
      {quoteLoading ? (
        <p className="cart-quote-loading" aria-live="polite">
          Atualizando valores...
        </p>
      ) : quoteError ? (
        <div className="cart-feedback-error" role="alert">
          <p>{quoteError}</p>
          <button type="button" onClick={onRetryQuote}>
            Atualizar valores
          </button>
        </div>
      ) : quote ? (
        <div className="summary-lines" aria-live="polite">
          <div>
            <span>Subtotal</span>
            <strong>{quote.subtotal} ETH</strong>
          </div>
          <div>
            <span>Desconto do lançamento</span>
            <strong>(-) {quote.discount} ETH</strong>
          </div>
          <div className="network-fee">
            <span>Taxa de rede</span>
            <strong>{quote.networkFee} ETH</strong>
            <small>Taxa estimada</small>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <strong>{quote.total} ETH</strong>
          </div>
        </div>
      ) : (
        <p className="cart-quote-loading">
          A cotação estará disponível após carregar os itens.
        </p>
      )}
      <Button asChild className="summary-action">
        <Link to="/checkout">Conectar e finalizar</Link>
      </Button>
      {!mobile && (
        <Link to="/" className="cart-continue">
          Continuar explorando
        </Link>
      )}
    </aside>
  )
}

export function CartPage() {
  const cartQuery = useCart()
  const items = cartQuery.data?.items ?? []
  const quoteQuery = useCheckoutQuote(undefined, items.length > 0)
  const updateItem = useUpdateCartItem()
  const removeItem = useRemoveCartItem()
  const applyCoupon = useApplyCoupon()
  const removeCoupon = useRemoveCoupon()
  const [couponDraft, setCouponDraft] = useState('')
  const operationError = updateItem.error ?? removeItem.error
  const couponError = applyCoupon.error ?? removeCoupon.error
  const busy = updateItem.isPending || removeItem.isPending
  const couponPending = applyCoupon.isPending || removeCoupon.isPending

  function updateQuantity(item: CartItem, quantity: number) {
    updateItem.mutate({ nftId: item.nftId, quantity })
  }

  function removeCartItem(item: CartItem) {
    removeItem.mutate(item.nftId)
  }

  async function applyCartCoupon() {
    try {
      await applyCoupon.mutateAsync(couponDraft)
      setCouponDraft('')
    } catch {
      // The API error is rendered beside the promotional code field.
    }
  }

  async function clearCoupon() {
    try {
      await removeCoupon.mutateAsync()
    } catch {
      // The API error remains visible and the existing coupon stays in the cart.
    }
  }

  const quoteError = quoteQuery.error ? formatError(quoteQuery.error) : ''
  const quote = quoteQuery.isFetching ? undefined : quoteQuery.data

  return (
    <div className="page-wrap cart-page">
      <div className="breadcrumbs cart-breadcrumbs">
        <Link to="/">Início</Link>
        <span>/</span>
        <Link to="/">Mercado</Link>
        <span>/</span>
        <span>Carrinho</span>
      </div>
      <div className="cart-mobile-heading">
        <Link to="/" aria-label="Voltar ao mercado">
          <ArrowLeft size={19} />
        </Link>
        <h1>Carrinho de NFTs</h1>
        <span aria-hidden="true" />
      </div>

      {cartQuery.isPending || cartQuery.isFetching ? (
        <section className="cart-feedback" aria-busy="true">
          Carregando carrinho...
        </section>
      ) : cartQuery.isError ? (
        <section className="cart-feedback" role="alert">
          <p>{formatError(cartQuery.error)}</p>
          <button type="button" onClick={() => void cartQuery.refetch()}>
            Tentar novamente
          </button>
        </section>
      ) : items.length === 0 ? (
        <section className="cart-empty" role="status">
          <h2>Seu carrinho está vazio</h2>
          <p>Explore o mercado e adicione NFTs para continuar.</p>
          <Button asChild>
            <Link to="/" hash="#catalogo">
              Explorar NFTs
            </Link>
          </Button>
        </section>
      ) : (
        <>
          <div className="cart-layout">
            <section className="cart-items" aria-label="NFTs no carrinho">
              <div className="cart-table-head" aria-hidden="true">
                <span>NFTs</span>
                <span>Preço</span>
                <span>Edições</span>
                <span>Total</span>
                <span />
              </div>
              <ItemRows
                items={items}
                busy={busy}
                onQuantity={updateQuantity}
                onRemove={removeCartItem}
              />
              <div className="cart-mobile-items">
                <ItemRows
                  items={items}
                  mobile
                  busy={busy}
                  onQuantity={updateQuantity}
                  onRemove={removeCartItem}
                />
              </div>
              {operationError && (
                <p className="cart-feedback-error" role="alert">
                  {formatError(operationError)}
                </p>
              )}
            </section>
            <CartSummary
              quote={quote}
              couponCode={cartQuery.data.couponCode}
              couponDraft={couponDraft}
              couponError={couponError ? formatError(couponError) : ''}
              couponPending={couponPending}
              quoteLoading={quoteQuery.isPending || quoteQuery.isFetching}
              quoteError={quoteError}
              onCouponDraft={setCouponDraft}
              onApplyCoupon={() => void applyCartCoupon()}
              onRemoveCoupon={() => void clearCoupon()}
              onRetryQuote={() => void quoteQuery.refetch()}
            />
          </div>
          <CartSummary
            mobile
            quote={quote}
            couponCode={cartQuery.data.couponCode}
            couponDraft={couponDraft}
            couponError={couponError ? formatError(couponError) : ''}
            couponPending={couponPending}
            quoteLoading={quoteQuery.isPending || quoteQuery.isFetching}
            quoteError={quoteError}
            onCouponDraft={setCouponDraft}
            onApplyCoupon={() => void applyCartCoupon()}
            onRemoveCoupon={() => void clearCoupon()}
            onRetryQuote={() => void quoteQuery.refetch()}
          />
        </>
      )}

      <section className="cart-recommendations related-section">
        <div className="section-heading">
          <h2>Colecionadores também viram</h2>
        </div>
        <NftGrid items={nfts.slice(3, 8)} compact />
      </section>
    </div>
  )
}
