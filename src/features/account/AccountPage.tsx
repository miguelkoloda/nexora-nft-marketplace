import {
  Activity,
  Camera,
  CircleHelp,
  Download,
  Heart,
  LogOut,
  MapPin,
  Tag,
  UserRound,
} from 'lucide-react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../components/ui/Button'
import { ApiError } from '../../api/client'
import {
  useChangePassword,
  useAddDemoWalletBalance,
  useLogout,
  useOrders,
  useProfile,
  useSaveWallet,
  useUpdateProfile,
  useUpdateWallet,
  useWallets,
} from '../../api/hooks'

export function AccountPage({
  section,
}: {
  section: 'profile' | 'wallets' | 'orders'
}) {
  const wallets = section === 'wallets'
  const orders = section === 'orders'

  return (
    <div
      className={`page-wrap account-page${wallets ? ' wallets-account-page' : ''}`}
    >
      {!wallets && (
        <div className="breadcrumbs">
          <Link to="/">InÃ­cio</Link>
          <span>/</span>
          <span>Minha conta</span>
          <span>/</span>
          <span>{orders ? 'Atividade' : 'Meu perfil'}</span>
        </div>
      )}
      <div className="account-layout">
        <AccountSidebar wallets={wallets} orders={orders} />
        {wallets ? (
          <WalletSettings />
        ) : orders ? (
          <OrderHistory />
        ) : (
          <ProfileSettings />
        )}
      </div>
    </div>
  )
}

function AccountSidebar({
  wallets,
  orders,
}: {
  wallets: boolean
  orders: boolean
}) {
  const logout = useLogout()
  const navigate = useNavigate()
  const [logoutError, setLogoutError] = useState('')

  async function signOut() {
    setLogoutError('')
    try {
      await logout.mutateAsync()
      await navigate({ to: '/' })
    } catch (error) {
      setLogoutError(
        error instanceof Error ? error.message : 'NÃ£o foi possÃ­vel sair.',
      )
    }
  }

  return (
    <aside className="account-sidebar">
      <strong className="account-sidebar-title">Meu perfil</strong>
      <Link
        to="/account/profile"
        className={!wallets && !orders ? 'account-nav active' : 'account-nav'}
      >
        <UserRound size={15} /> Dados do perfil
      </Link>
      <Link
        to="/account/wallets"
        className={wallets ? 'account-nav active' : 'account-nav'}
      >
        <MapPin size={15} /> Carteiras
      </Link>
      <Link
        to="/account/orders"
        className={`account-nav${orders ? ' active' : ''}`}
      >
        <Activity size={15} /> Atividade
      </Link>
      <a href="#interest" className="account-nav">
        <Heart size={15} /> Lista de interesse
      </a>
      <a href="#offers" className="account-nav">
        <Tag size={15} /> Ofertas
      </a>
      <a href="#downloads" className="account-nav">
        <Download size={15} /> Arquivos baixados
      </a>
      <a href="#support" className="account-nav">
        <CircleHelp size={15} /> Suporte
      </a>
      <button
        type="button"
        className="account-nav account-signout"
        onClick={() => void signOut()}
        disabled={logout.isPending}
      >
        <LogOut size={15} /> Sair
      </button>
      {logoutError && (
        <p role="alert" className="account-action-error">
          {logoutError}
        </p>
      )}
    </aside>
  )
}

function WalletSettings() {
  const profile = useProfile()
  const wallets = useWallets()
  const saveWallet = useSaveWallet()
  const updateWallet = useUpdateWallet()
  const addDemoBalance = useAddDemoWalletBalance()

  const primaryWallet =
    wallets.data?.find((w) => w.isPrimary) ?? wallets.data?.[0]
  const secondaryWallet = wallets.data?.find(
    (w) => !w.isPrimary && w.id !== primaryWallet?.id,
  )

  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [label, setLabel] = useState('')
  const [network, setNetwork] = useState('Ethereum')
  const [address, setAddress] = useState('')
  const [provider, setProvider] = useState<'MetaMask' | 'WalletConnect' | 'Coinbase Wallet'>('MetaMask')
  const [ensName, setEnsName] = useState('')
  const [ensExtension, setEnsExtension] = useState('.eth')
  const [referralCode, setReferralCode] = useState('')
  const [secondarySameAsPrimary, setSecondarySameAsPrimary] = useState(false)
  const [addingWallet, setAddingWallet] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [topUpAmount, setTopUpAmount] = useState('1.0')

  useEffect(() => {
    if (profile.data) {
      setDisplayName(profile.data.displayName)
      setUsername(profile.data.username)
    }
  }, [profile.data])

  useEffect(() => {
    if (primaryWallet) {
      setLabel(primaryWallet.label)
      setNetwork(primaryWallet.network)
      setAddress(primaryWallet.address)
      setProvider(primaryWallet.provider)
      if (primaryWallet.ensName) {
        if (primaryWallet.ensName.endsWith('.nft')) {
          setEnsName(primaryWallet.ensName.replace(/\.nft$/, ''))
          setEnsExtension('.nft')
        } else {
          setEnsName(primaryWallet.ensName.replace(/\.eth$/, ''))
          setEnsExtension('.eth')
        }
      } else {
        setEnsName('')
      }
    }
  }, [primaryWallet])

  async function handleSavePrimary(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    if (!label.trim() || !address.trim() || !network.trim()) {
      setError('Preencha apelido, endereço e rede da carteira.')
      return
    }
    const fullEns = ensName.trim() ? `${ensName.trim()}${ensExtension}` : null
    try {
      if (addingWallet) {
        await saveWallet.mutateAsync({
          label: label.trim(),
          address: address.trim(),
          network,
          provider,
          ensName: fullEns,
          isPrimary: !primaryWallet,
          balance: '0.25',
        })
        setAddingWallet(false)
      } else if (primaryWallet) {
        await updateWallet.mutateAsync({
          id: primaryWallet.id,
          input: {
            label: label.trim(),
            address: address.trim(),
            network,
            provider,
            ensName: fullEns,
            isPrimary: true,
          },
        })
      } else {
        await saveWallet.mutateAsync({
          label: label.trim(),
          address: address.trim(),
          network,
          provider,
          ensName: fullEns,
          isPrimary: true,
          balance: '10.0',
        })
      }
      setMessage(
        addingWallet
          ? primaryWallet
            ? 'Carteira secundária adicionada com sucesso.'
            : 'Carteira principal adicionada com sucesso.'
          : 'Carteira principal salva com sucesso.',
      )
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : 'Não foi possível salvar a carteira.',
      )
    }
  }

  async function handleAddSecondary() {
    setError('')
    setMessage('')
    try {
      const secAddress = secondarySameAsPrimary && primaryWallet
        ? primaryWallet.address
        : `0x${globalThis.crypto?.randomUUID?.().replace(/-/g, '').slice(0, 40) ?? 'B72000000000000000000000000000000000D310'}`
      await saveWallet.mutateAsync({
        label: 'Reserva',
        address: secAddress,
        network: 'Polygon',
        provider: 'Coinbase Wallet',
        ensName: null,
        isPrimary: false,
        balance: '0.25',
      })
      setMessage('Carteira secundária adicionada com sucesso.')
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : 'Não foi possível adicionar carteira secundária.',
      )
    }
  }

  async function handlePromoteSecondary(secId: string) {
    setError('')
    setMessage('')
    try {
      await updateWallet.mutateAsync({
        id: secId,
        input: { isPrimary: true },
      })
      setMessage('Carteira secundária definida como principal.')
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : 'Não foi possível alterar a carteira principal.',
      )
    }
  }

  async function handleAddDemoBalance() {
    if (!primaryWallet) return
    setError('')
    setMessage('')
    try {
      await addDemoBalance.mutateAsync({
        id: primaryWallet.id,
        amount: topUpAmount,
      })
      setMessage(`${topUpAmount} ETH demonstrativo adicionado à carteira principal.`)
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : 'Não foi possível adicionar saldo demonstrativo.',
      )
    }
  }

  if (wallets.isPending) {
    return (
      <section className="account-wallet-settings" aria-busy="true">
        <p>Carregando carteiras...</p>
      </section>
    )
  }

  return (
    <section className="account-wallet-settings">
      <div className="wallet-settings-heading">
        <div>
          <h1>{addingWallet ? 'Adicionar carteira' : 'Carteira principal'}</h1>
          <p>
            Estas carteiras ficam disponíveis no pagamento para receber NFTs
            comprados.
          </p>
          {primaryWallet && (
            <p style={{ marginTop: '4px', color: '#eee6df' }}>
              Saldo disponível:{' '}
              <strong style={{ color: '#d58a49', fontSize: '11px' }}>
                {primaryWallet.balance} ETH
              </strong>
            </p>
          )}
          {primaryWallet && (
            <div className="demo-top-up" aria-label="Adicionar saldo demonstrativo">
              <label>
                Recarga de demonstração (ETH)
                <input
                  aria-label="Valor da recarga demonstrativa em ETH"
                  inputMode="decimal"
                  value={topUpAmount}
                  onChange={(event) => setTopUpAmount(event.target.value)}
                />
              </label>
              <button
                type="button"
                className="wallet-add-link"
                onClick={() => void handleAddDemoBalance()}
                disabled={addDemoBalance.isPending}
              >
                {addDemoBalance.isPending ? 'Adicionando...' : 'Adicionar saldo de teste'}
              </button>
              <small>Saldo fictício apenas para testar o checkout; não movimenta cripto real.</small>
            </div>
          )}
        </div>
        {!addingWallet && !secondaryWallet && (
          <button
            type="button"
            className="wallet-add-link"
            onClick={() => {
              setAddingWallet(true)
              setLabel('Nova Carteira')
              setAddress('')
              setEnsName('')
            }}
          >
            Adicionar carteira
          </button>
        )}
      </div>

      {error && (
        <p className="account-action-error" role="alert" style={{ marginBottom: '12px' }}>
          {error}
        </p>
      )}
      {message && (
        <p className="account-action-success" role="status" style={{ marginBottom: '12px' }}>
          {message}
        </p>
      )}

      <form className="wallet-settings-form" onSubmit={(e) => void handleSavePrimary(e)}>
        <label>
          Nome de exibição<span>*</span>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        </label>
        <label>
          Apelido da carteira<span>*</span>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ex: Principal"
            required
          />
        </label>
        <label>
          Rede <span>*</span>
          <select
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
          >
            <option value="Ethereum">Ethereum</option>
            <option value="Polygon">Polygon</option>
            <option value="Solana">Solana</option>
          </select>
        </label>
        <label>
          Nome do perfil<span>*</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>
        <label>
          Endereço da carteira<span>*</span>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Endereço 0x da carteira"
            required
          />
        </label>
        <label className="wallet-optional-field">
          <span className="wallet-field-spacer" aria-hidden="true" />
          <input
            placeholder="Saldo em ETH (demonstração)"
            value={addingWallet ? '0.25 ETH (saldo demonstrativo)' : primaryWallet ? `${primaryWallet.balance} ETH disponível` : 'Saldo inicial: 10.0 ETH'}
            readOnly
          />
        </label>
        <label>
          Tipo de carteira<span>*</span>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as 'MetaMask' | 'WalletConnect' | 'Coinbase Wallet')}
          >
            <option value="MetaMask">MetaMask</option>
            <option value="WalletConnect">WalletConnect</option>
            <option value="Coinbase Wallet">Coinbase Wallet</option>
          </select>
        </label>
        <label>
          Código de indicação
          <input
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
            placeholder="Opcional"
          />
        </label>
        <label>
          E-mail<span>*</span>
          <input type="email" value={profile.data?.email ?? ''} readOnly />
        </label>
        <label>
          Nome ENS
          <span className="wallet-ens-field">
            <select
              value={ensExtension}
              onChange={(e) => setEnsExtension(e.target.value)}
              aria-label="Extensão ENS"
            >
              <option value=".eth">.eth</option>
              <option value=".nft">.nft</option>
            </select>
            <input
              aria-label="Nome ENS"
              value={ensName}
              onChange={(e) => setEnsName(e.target.value)}
              placeholder="exemplo"
            />
          </span>
        </label>
        <button
          type="submit"
          className="wallet-save-button"
          disabled={saveWallet.isPending || updateWallet.isPending}
        >
          {saveWallet.isPending || updateWallet.isPending
            ? 'Salvando...'
            : addingWallet
              ? 'Adicionar carteira'
              : 'Salvar carteira'}
        </button>
        {addingWallet && (
          <button
            type="button"
            className="wallet-add-link"
            onClick={() => setAddingWallet(false)}
          >
            Cancelar
          </button>
        )}
      </form>

      <div className="secondary-wallet-section">
        <div>
          <h2>Carteira secundária</h2>
          {secondaryWallet ? (
            <div>
              <p>
                <strong>{secondaryWallet.label}</strong> ({secondaryWallet.provider} · {secondaryWallet.network})
              </p>
              <p>
                Endereço: {secondaryWallet.address}
              </p>
              <p style={{ marginTop: '2px', color: '#eee6df' }}>
                Saldo:{' '}
                <strong style={{ color: '#d58a49' }}>
                  {secondaryWallet.balance} ETH
                </strong>
              </p>
            </div>
          ) : (
            <p>Você ainda não adicionou uma carteira secundária.</p>
          )}
        </div>
        <div className="secondary-wallet-actions">
          {secondaryWallet ? (
            <button
              type="button"
              className="wallet-add-link"
              onClick={() => void handlePromoteSecondary(secondaryWallet.id)}
            >
              Tornar principal
            </button>
          ) : (
            <>
              <label>
                <input
                  type="checkbox"
                  checked={secondarySameAsPrimary}
                  onChange={(e) => setSecondarySameAsPrimary(e.target.checked)}
                />{' '}
                Igual à carteira principal
              </label>
              <button
                type="button"
                className="wallet-add-link"
                onClick={() => void handleAddSecondary()}
              >
                Adicionar
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

function OrderHistory() {
  const orders = useOrders()

  if (orders.isPending) {
    return (
      <section className="account-content" role="status" aria-busy="true">
        Carregando pedidos...
      </section>
    )
  }
  if (orders.isError) {
    return (
      <section className="account-content" role="alert">
        <h1>Atividade</h1>
        <p>Não foi possível carregar seus pedidos.</p>
        <button type="button" onClick={() => void orders.refetch()}>
          Tentar novamente
        </button>
      </section>
    )
  }
  if (!orders.data?.length) {
    return (
      <section className="account-content account-orders">
        <div className="account-heading">
          <div>
            <span className="eyebrow">SUA CONTA</span>
            <h1>Atividade</h1>
            <p>Seus pedidos aparecerão aqui após a finalização.</p>
          </div>
        </div>
        <p className="account-orders-empty">Você ainda não tem pedidos.</p>
      </section>
    )
  }
  return (
    <section className="account-content account-orders">
      <div className="account-heading">
        <div>
          <span className="eyebrow">SUA CONTA</span>
          <h1>Atividade</h1>
          <p>Histórico de pedidos registrados na simulação.</p>
        </div>
      </div>
      <div className="account-orders-list">
        {orders.data.map((order) => (
          <article className="account-order-row" key={order.id}>
            <div>
              <strong>Pedido {order.id}</strong>
              <small>
                {new Date(order.createdAt).toLocaleString('pt-BR')} ·{' '}
                {order.items.length} item(ns)
              </small>
            </div>
            <span className={`account-order-status status-${order.status}`}>
              {order.status === 'confirmed'
                ? 'Confirmado'
                : order.status === 'pending'
                  ? 'Pendente'
                  : 'Recusado'}
            </span>
            <strong>{order.total} ETH</strong>
            <Link
              to="/orders/$orderId/confirmation"
              params={{ orderId: order.id }}
            >
              Ver detalhes
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}

function ProfileSettings() {
  const profile = useProfile()
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!profile.data) return
    setDisplayName(profile.data.displayName)
    setUsername(profile.data.username)
    setPhone(profile.data.phone)
    setAddress(profile.data.address)
  }, [profile.data])

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    try {
      await updateProfile.mutateAsync({ displayName, username, phone, address })
      setMessage('Perfil atualizado.')
    } catch (cause) {
      setError(profileError(cause))
    }
  }

  async function savePassword() {
    setError('')
    setMessage('')
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setMessage('Senha atualizada.')
    } catch (cause) {
      setError(profileError(cause))
    }
  }

  if (profile.isPending) {
    return (
      <section className="account-content" aria-busy="true">
        Carregando perfil...
      </section>
    )
  }
  if (profile.isError || !profile.data) {
    return (
      <section className="account-content" role="alert">
        <p>Não foi possível carregar o perfil.</p>
        <button type="button" onClick={() => void profile.refetch()}>
          Tentar novamente
        </button>
      </section>
    )
  }

  const initials = displayName
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <section className="account-content">
      <div className="account-heading">
        <div>
          <span className="eyebrow">SUAS INFORMAÇÕES</span>
          <h1>Meu perfil</h1>
          <p>Atualize suas informações pessoais e preferências.</p>
        </div>
      </div>
      <div className="profile-avatar">
        <div className="avatar-placeholder">{initials}</div>
        <button
          aria-label="Alterar avatar"
          disabled
          title="Envio de avatar não disponível nesta etapa."
        >
          <Camera size={14} />
        </button>
        <span>
          <strong>Foto de perfil</strong>
          <small>JPG ou PNG. Máximo de 2 MB.</small>
        </span>
      </div>
      <form
        className="profile-form"
        onSubmit={(event) => void saveProfile(event)}
      >
        <div className="form-grid">
          <label>
            Nome completo
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
            />
          </label>
          <label>
            Nome de usuário
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </label>
          <label>
            E-mail
            <input type="email" value={profile.data.email} readOnly />
          </label>
          <label>
            Telefone
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </label>
          <label className="field-wide">
            Endereço
            <input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Rua, número, complemento"
            />
          </label>
        </div>
        {error && (
          <p className="account-action-error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="account-action-success" role="status">
            {message}
          </p>
        )}
        <div className="password-section">
          <h2>Alterar senha</h2>
          <div className="form-grid">
            <label>
              Senha atual
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
              />
            </label>
            <label>
              Nova senha
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                minLength={8}
                autoComplete="new-password"
                placeholder="Mínimo de 8 caracteres"
              />
            </label>
          </div>
          <Button
            type="button"
            variant="ghost"
            disabled={
              !currentPassword ||
              newPassword.length < 8 ||
              changePassword.isPending
            }
            onClick={() => void savePassword()}
          >
            {changePassword.isPending ? 'Aguarde...' : 'Atualizar senha'}
          </Button>
        </div>
        <Button type="submit" disabled={updateProfile.isPending}>
          {updateProfile.isPending ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </form>
    </section>
  )
}

function profileError(error: unknown): string {
  if (error instanceof ApiError) {
    const fields = Object.values(error.fields ?? {})
    return fields.length ? fields.join(' ') : error.message
  }
  return error instanceof Error
    ? error.message
    : 'Não foi possível salvar as alterações.'
}
