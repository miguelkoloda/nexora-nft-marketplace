import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft, ChevronDown, EllipsisVertical } from 'lucide-react'
import { Link, useNavigate } from '@tanstack/react-router'
import { ApiError, getSessionUserId } from '../../api/client'
import { parseEther } from '../../lib/ether'
import {
  useCart,
  useCheckoutQuote,
  useCreateOrder,
  useProfile,
  useUpdateProfile,
  useWallets,
} from '../../api/hooks'
import type { CartItem, Quote, Wallet } from '../../domain/types'
import { Button } from '../../components/ui/Button'
import { NftArtwork } from '../../components/nft/NftArtwork'

function sameQuote(left: Quote, right: Quote): boolean {
  return (
    JSON.stringify({
      items: left.items,
      subtotal: left.subtotal,
      discount: left.discount,
      networkFee: left.networkFee,
      total: left.total,
      couponCode: left.couponCode,
    }) ===
    JSON.stringify({
      items: right.items,
      subtotal: right.subtotal,
      discount: right.discount,
      networkFee: right.networkFee,
      total: right.total,
      couponCode: right.couponCode,
    })
  )
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === 'INSUFFICIENT_FUNDS')
      return (
        error.fields?.walletId ??
        error.message ??
        'Saldo insuficiente na carteira selecionada.'
      )
    if (error.code === 'INSUFFICIENT_STOCK')
      return 'A disponibilidade de um NFT mudou. Revise o carrinho antes de continuar.'
    if (error.code === 'QUOTE_STALE' || error.code === 'QUOTE_EXPIRED')
      return 'Os valores foram atualizados. Confira o novo resumo e confirme novamente.'
    if (error.code === 'SESSION_EXPIRED' || error.status === 401)
      return 'Sua sessão expirou. Entre novamente para continuar.'
    if (error.code === 'PRICE_CHANGED')
      return 'O preço de um NFT mudou. Revise os novos valores para confirmar.'
    return error.message
  }
  return error instanceof Error
    ? 'Não foi possível confirmar agora. O carrinho foi mantido; tente novamente.'
    : 'Não foi possível confirmar o pedido.'
}

function CheckoutItems({
  quote,
  cartItems,
}: {
  quote: Quote
  cartItems: CartItem[]
}) {
  return (
    <div className="checkout-order-items">
      {quote.items.map((item) => (
        <article className="checkout-order-item" key={item.nftId}>
          {cartItems.some((cartItem) => cartItem.nftId === item.nftId) && (
            <NftArtwork
              nft={
                cartItems.find((cartItem) => cartItem.nftId === item.nftId)!.nft
              }
              className="checkout-order-artwork"
              decorative
            />
          )}
          <div>
            <strong>{item.name}</strong>
            <small>ID do token: #{item.nftId.slice(-4)}</small>
          </div>
          <span className="checkout-order-quantity">(x {item.quantity})</span>
          <strong className="checkout-order-total">{item.lineTotal} ETH</strong>
        </article>
      ))}
    </div>
  )
}

function CostSummary({ quote }: { quote: Quote }) {
  return (
    <div className="checkout-costs">
      <div>
        <span>Subtotal</span>
        <strong>{quote.subtotal} ETH</strong>
      </div>
      <div>
        <span>Desconto</span>
        <strong>(-) {quote.discount} ETH</strong>
      </div>
      <div className="checkout-network-fee">
        <span>Taxa de rede</span>
        <strong>{quote.networkFee} ETH</strong>
        <small>Taxa estimada</small>
      </div>
      <div className="checkout-grand-total">
        <span>Total</span>
        <strong>{quote.total} ETH</strong>
      </div>
    </div>
  )
}

function WalletOptions({
  wallets,
  selectedId,
  onSelect,
}: {
  wallets: Wallet[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="checkout-wallet-list">
      {wallets.map((wallet) => (
        <label
          className={`checkout-desktop-wallet${selectedId === wallet.id ? ' is-selected' : ''}`}
          key={wallet.id}
        >
          <input
            type="radio"
            name="checkout-wallet"
            value={wallet.id}
            checked={selectedId === wallet.id}
            onChange={() => onSelect(wallet.id)}
          />
          <span>
            {wallet.label} · {wallet.provider} · {wallet.network}
            <span style={{ marginLeft: '6px', color: '#d58a49', fontWeight: 600 }}>
              ({wallet.balance} ETH)
            </span>
          </span>
        </label>
      ))}
    </div>
  )
}

export function CheckoutPage() {
  const userId = getSessionUserId()
  const navigate = useNavigate()
  const cart = useCart(userId)
  const quote = useCheckoutQuote(userId, Boolean(userId))
  const profile = useProfile(userId, Boolean(userId))
  const wallets = useWallets(userId, Boolean(userId))
  const updateProfile = useUpdateProfile()
  const createOrder = useCreateOrder(userId)
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [selectedWallet, setSelectedWallet] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [profileSaved, setProfileSaved] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!profile.data) return
    setDisplayName(profile.data.displayName)
    setUsername(profile.data.username)
  }, [profile.data])

  useEffect(() => {
    if (!wallets.data?.length) return
    setSelectedWallet((current) =>
      wallets.data?.some((wallet) => wallet.id === current)
        ? current
        : (wallets.data?.find((wallet) => wallet.isPrimary)?.id ??
          wallets.data?.[0]?.id ??
          ''),
    )
  }, [wallets.data])

  const selected = useMemo(
    () => wallets.data?.find((wallet) => wallet.id === selectedWallet),
    [wallets.data, selectedWallet],
  )

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    setError('')
    setNotice('')
    if (!displayName.trim() || !username.trim() || !selected) {
      setError(
        'Preencha os dados obrigatórios e selecione uma carteira cadastrada.',
      )
      return
    }
    if (!cart.data?.items.length || !quote.data) {
      setError(
        'Seu carrinho está vazio ou a cotação ainda não está disponível.',
      )
      return
    }
    try {
      if (parseEther(selected.balance) < parseEther(quote.data.total)) {
        setError(
          `Saldo insuficiente na carteira selecionada (${selected.balance} ETH) para o valor total (${quote.data.total} ETH). Escolha outra carteira.`,
        )
        return
      }
    } catch {
      // continua para validação no backend
    }
    setSubmitting(true)
    const attemptStorageKey = `nexora:checkout:${userId}:${quote.data.cartVersion}:${selected.id}`
    try {
      if (
        !profileSaved &&
        (displayName !== profile.data?.displayName ||
          username !== profile.data?.username)
      ) {
        await updateProfile.mutateAsync({
          displayName: displayName.trim(),
          username: username.trim(),
        })
        setProfileSaved(true)
      }
      const previousQuote = quote.data
      const latest = await quote.refetch()
      if (latest.isError || !latest.data)
        throw latest.error ?? new Error('Cotação indisponível.')
      if (!sameQuote(previousQuote, latest.data)) {
        setNotice(
          'Os valores ou itens mudaram. Revise o resumo atualizado e confirme novamente.',
        )
        return
      }
      const snapshot = JSON.stringify({
        items: latest.data.items,
        subtotal: latest.data.subtotal,
        discount: latest.data.discount,
        networkFee: latest.data.networkFee,
        total: latest.data.total,
        couponCode: latest.data.couponCode,
      })
      type StoredAttempt = {
        idempotencyKey: string
        quoteId: string
        snapshot: string
      }
      let attempt: StoredAttempt | null = null
      try {
        const stored = sessionStorage.getItem(attemptStorageKey)
        if (stored) attempt = JSON.parse(stored) as StoredAttempt
      } catch {
        attempt = null
      }
      if (!attempt || attempt.snapshot !== snapshot) {
        attempt = {
          quoteId: latest.data.id,
          snapshot,
          idempotencyKey:
            globalThis.crypto?.randomUUID?.() ??
            `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        }
        sessionStorage.setItem(attemptStorageKey, JSON.stringify(attempt))
      }
      const order = await createOrder.mutateAsync({
        input: { quoteId: attempt.quoteId, walletId: selected.id },
        idempotencyKey: attempt.idempotencyKey,
      })
      await navigate({
        to: '/orders/$orderId/confirmation',
        params: { orderId: order.id },
      })
    } catch (cause) {
      if (
        cause instanceof ApiError &&
        (cause.status === 401 || cause.code === 'SESSION_EXPIRED')
      ) {
        await navigate({ to: '/login', search: { returnTo: '/checkout' } })
        return
      }
      if (
        cause instanceof ApiError &&
        [
          'QUOTE_STALE',
          'QUOTE_EXPIRED',
          'PRICE_CHANGED',
          'INSUFFICIENT_STOCK',
        ].includes(cause.code)
      ) {
        sessionStorage.removeItem(attemptStorageKey)
        await quote.refetch()
      }
      setError(errorMessage(cause))
    } finally {
      setSubmitting(false)
    }
  }

  if (
    cart.isPending ||
    quote.isPending ||
    profile.isPending ||
    wallets.isPending
  ) {
    return (
      <div className="page-wrap checkout-state" role="status" aria-busy="true">
        Carregando resumo e carteiras...
      </div>
    )
  }
  if (cart.isError || quote.isError || profile.isError || wallets.isError) {
    return (
      <div className="page-wrap checkout-state" role="alert">
        <p>Não foi possível carregar os dados do checkout.</p>
        <button
          type="button"
          onClick={() => {
            void cart.refetch()
            void quote.refetch()
            void profile.refetch()
            void wallets.refetch()
          }}
        >
          Tentar novamente
        </button>
      </div>
    )
  }
  if (!cart.data?.items.length || !quote.data) {
    return (
      <div className="page-wrap checkout-state">
        <h1>Seu carrinho está vazio</h1>
        <p>Adicione NFTs ao carrinho para iniciar um pedido.</p>
        <Link to="/cart" className="button button-primary">
          Voltar ao carrinho
        </Link>
      </div>
    )
  }

  const profileForm = (
    <section className="checkout-profile">
      <h1>Perfil do colecionador</h1>
      <div className="checkout-profile-grid">
        <label>
          Nome de exibição<span>*</span>
          <input
            value={displayName}
            onChange={(event) => {
              setProfileSaved(false)
              setDisplayName(event.target.value)
            }}
            required
          />
        </label>
        <label>
          Nome de usuário<span>*</span>
          <input
            value={username}
            onChange={(event) => {
              setProfileSaved(false)
              setUsername(event.target.value)
            }}
            required
          />
        </label>
        <label>
          Rede<span>*</span>
          <span className="checkout-select">
            {selected?.network ?? 'Selecione uma carteira'}{' '}
            <ChevronDown size={15} />
          </span>
        </label>
        <label>
          Nome do perfil<span>*</span>
          <input
            value={displayName}
            onChange={(event) => {
              setProfileSaved(false)
              setDisplayName(event.target.value)
            }}
            required
          />
        </label>
        <label>
          Endereço da carteira<span>*</span>
          <input
            value={selected?.address ?? ''}
            readOnly
            placeholder="Endereço 0x da carteira"
          />
        </label>
        <label>
          <span className="checkout-optional-label">&nbsp;</span>
          <input
            aria-label="ENS ou carteira secundária (opcional)"
            value={selected?.ensName ?? ''}
            readOnly
            placeholder="ENS ou carteira secundária (opcional)"
          />
        </label>
        <label>
          Tipo de carteira<span>*</span>
          <span className="checkout-select">
            {selected?.provider ?? 'Selecione uma carteira'}{' '}
            <ChevronDown size={15} />
          </span>
        </label>
        <label>
          Código de indicação
          <input placeholder="Opcional" />
        </label>
        <label>
          E-mail<span>*</span>
          <input type="email" value={profile.data?.email ?? ''} readOnly />
        </label>
        <label>
          Nome ENS
          <input
            value={selected?.ensName ?? ''}
            readOnly
            placeholder="Não informado"
          />
        </label>
        <label className="checkout-other-wallet">
          <input type="radio" name="other-wallet" checked readOnly /> Usar
          carteira selecionada
        </label>
        <label className="checkout-note">
          Observação do colecionador (opcional)
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
      </div>
    </section>
  )

  const totals = <CostSummary quote={quote.data} />
  const walletChoices = (
    <WalletOptions
      wallets={wallets.data ?? []}
      selectedId={selectedWallet}
      onSelect={setSelectedWallet}
    />
  )
  const isInsufficient = Boolean(
    selected &&
      quote.data &&
      parseEther(selected.balance) < parseEther(quote.data.total),
  )

  const submitButton = (className: string) => (
    <Button
      className={className}
      type="submit"
      disabled={
        submitting ||
        createOrder.isPending ||
        updateProfile.isPending ||
        !selectedWallet ||
        isInsufficient
      }
    >
      {submitting || createOrder.isPending
        ? 'Confirmando...'
        : isInsufficient
          ? 'Saldo insuficiente'
          : 'Confirmar compra'}
    </Button>
  )

  return (
    <div className="page-wrap checkout-page">
      <div className="breadcrumbs checkout-breadcrumbs">
        <Link to="/">Início</Link>
        <span>/</span>
        <Link to="/">Mercado</Link>
        <span>/</span>
        <span>Pagamento</span>
      </div>
      <form onSubmit={(event) => void submit(event)}>
        <div className="checkout-desktop-layout">
          {profileForm}
          <aside className="checkout-desktop-summary">
            <h2>Seus NFTs</h2>
            <div className="checkout-order-head">
              <span>NFTs</span>
              <span>Subtotal</span>
            </div>
            <CheckoutItems quote={quote.data} cartItems={cart.data.items} />
            {totals}
            <h3 className="checkout-wallet-title">Carteira e rede</h3>
            {!wallets.data?.length && (
              <p className="checkout-feedback" role="status">
                Cadastre uma carteira antes de continuar.{' '}
                <Link to="/account/wallets">Ir para carteiras</Link>
              </p>
            )}
            {walletChoices}
            {selected && (
              <p
                style={{
                  margin: '8px 0',
                  fontSize: '11px',
                  color: '#ded5cd',
                  lineHeight: '1.4',
                }}
              >
                Saldo da carteira:{' '}
                <strong style={{ color: '#d58a49' }}>
                  {selected.balance} ETH
                </strong>
                {isInsufficient && (
                  <span
                    style={{
                      display: 'block',
                      color: '#e97449',
                      marginTop: '4px',
                      fontWeight: 600,
                    }}
                  >
                    Saldo insuficiente para cobrir o total de {quote.data.total}{' '}
                    ETH.
                  </span>
                )}
              </p>
            )}
            <p className="checkout-simulation-note">
              Checkout demonstrativo. Nenhum ETH será transferido.
            </p>
            {error && (
              <p role="alert" className="checkout-feedback is-error">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="checkout-feedback">
                {notice}
              </p>
            )}
            {submitButton('checkout-confirm')}
          </aside>
        </div>
        <div className="checkout-mobile-content">
          <div className="checkout-mobile-heading">
            <Link to="/cart" aria-label="Voltar ao carrinho">
              <ArrowLeft size={19} />
            </Link>
            <h1>Pagamento com carteira</h1>
          </div>
          {profileForm}
          <div className="checkout-mobile-connected">
            <strong>Carteira selecionada</strong>
            <Link to="/account/wallets">Trocar carteira</Link>
          </div>
          {!wallets.data?.length && (
            <p className="checkout-feedback" role="status">
              Cadastre uma carteira antes de continuar.{' '}
              <Link to="/account/wallets">Ir para carteiras</Link>
            </p>
          )}
          <div className="checkout-saved-wallets">
            {(wallets.data ?? []).map((wallet) => (
              <label
                className={`checkout-saved-wallet${selectedWallet === wallet.id ? ' is-selected' : ''}`}
                key={wallet.id}
              >
                <input
                  type="radio"
                  name="mobile-wallet"
                  checked={selectedWallet === wallet.id}
                  onChange={() => setSelectedWallet(wallet.id)}
                />
                <div>
                  <strong>{wallet.label}</strong>
                  <small>{wallet.ensName ?? wallet.address}</small>
                  <small>
                    Rede {wallet.network} · Saldo: {wallet.balance} ETH
                  </small>
                </div>
                <EllipsisVertical size={18} />
              </label>
            ))}
          </div>
          <h2 className="checkout-mobile-wallet-title">Carteira e rede</h2>
          {walletChoices}
          <CheckoutItems quote={quote.data} cartItems={cart.data.items} />
          {totals}
          <p className="checkout-simulation-note">
            Checkout demonstrativo. Nenhum ETH será transferido.
          </p>
          {error && (
            <p role="alert" className="checkout-feedback is-error">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="checkout-feedback">
              {notice}
            </p>
          )}
          {submitButton('checkout-mobile-confirm')}
        </div>
      </form>
    </div>
  )
}
