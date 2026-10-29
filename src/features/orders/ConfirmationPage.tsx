import { useState } from 'react'
import { ArrowUpRight, Check, Copy } from 'lucide-react'
import { Link, useParams } from '@tanstack/react-router'
import { getSessionUserId } from '../../api/client'
import { useNfts } from '../../api/hooks'
import { useOrder } from '../../api/hooks'
import { NftArtwork } from '../../components/nft/NftArtwork'

export function ConfirmationPage() {
  const { orderId } = useParams({ from: '/shell/orders/$orderId/confirmation' })
  const order = useOrder(orderId, getSessionUserId())
  const catalog = useNfts({ page: 1, pageSize: 50 })
  const [copied, setCopied] = useState(false)

  if (order.isPending) {
    return (
      <div
        className="page-wrap confirmation-state"
        role="status"
        aria-busy="true"
      >
        Carregando pedido...
      </div>
    )
  }
  if (order.isError || !order.data) {
    return (
      <div className="page-wrap confirmation-state" role="alert">
        <h1>Pedido indisponível</h1>
        <p>Não foi possível localizar este pedido para a sua conta.</p>
        <Link to="/account/orders" className="button button-primary">
          Ver meus pedidos
        </Link>
      </div>
    )
  }

  const confirmed = order.data.status === 'confirmed'
  const status = confirmed
    ? 'PEDIDO CONFIRMADO · SIMULAÇÃO'
    : order.data.status === 'pending'
      ? 'PEDIDO PENDENTE'
      : 'PAGAMENTO RECUSADO'
  const transaction = order.data.transactionId ?? order.data.id

  async function copyTransaction() {
    try {
      await navigator.clipboard.writeText(transaction)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="page-wrap confirmation-page">
      <section className="receipt-card">
        <div className="receipt-emblem">
          {confirmed ? <Check size={22} /> : <span>!</span>}
        </div>
        <span className="eyebrow">{status}</span>
        <h1>
          {confirmed
            ? 'Sua próxima história começa aqui.'
            : order.data.status === 'pending'
              ? 'Seu pedido está em análise.'
              : 'Não foi possível concluir o pagamento.'}
        </h1>
        <p>
          {confirmed
            ? 'Pedido registrado na simulação do marketplace. Nenhum ETH foi transferido em blockchain.'
            : order.data.status === 'pending'
              ? 'O pedido foi criado e aguarda atualização de status.'
              : 'O pedido foi registrado como recusado. Nenhum valor foi transferido.'}
        </p>
        <div className="transaction-ref">
          <span>
            <small>
              {confirmed
                ? 'IDENTIFICAÇÃO DA TRANSAÇÃO SIMULADA'
                : 'IDENTIFICAÇÃO DO PEDIDO'}
            </small>
            <strong>{transaction}</strong>
          </span>
          <button
            type="button"
            aria-label="Copiar identificação"
            onClick={() => void copyTransaction()}
          >
            <Copy size={14} />
          </button>
        </div>
        {copied && (
          <p role="status" className="checkout-feedback">
            Identificação copiada.
          </p>
        )}
        <div className="receipt-items">
          {order.data.items.map((item) => {
            const nft = catalog.data?.items.find(
              (entry) => entry.id === item.nftId,
            )
            return (
              <div className="summary-item" key={item.nftId}>
                {nft && (
                  <NftArtwork
                    nft={nft}
                    className="summary-artwork"
                    decorative
                  />
                )}
                <div>
                  <strong>
                    {item.name} × {item.quantity}
                  </strong>
                  <small>Edição {item.edition}</small>
                </div>
                <b>
                  {item.lineTotal} <small>ETH</small>
                </b>
              </div>
            )
          })}
        </div>
        <div className="summary-lines">
          <div>
            <span>Subtotal</span>
            <strong>{order.data.subtotal} ETH</strong>
          </div>
          <div>
            <span>Desconto</span>
            <strong>(-) {order.data.discount} ETH</strong>
          </div>
          <div>
            <span>Taxa de rede</span>
            <strong>{order.data.networkFee} ETH</strong>
          </div>
          <div className="summary-total">
            <span>Total do pedido</span>
            <strong>
              {order.data.total} <small>ETH</small>
            </strong>
          </div>
        </div>
        <p className="order-wallet-summary">
          Carteira: {order.data.wallet.label} · {order.data.wallet.network}
          <br />
          Criado em {new Date(order.data.createdAt).toLocaleString('pt-BR')}
        </p>
        <Link
          to="/account/orders"
          className="button button-primary receipt-action"
        >
          Meus pedidos <ArrowUpRight size={15} />
        </Link>
        <Link to="/" className="explorer-link">
          Voltar ao mercado <ArrowUpRight size={12} />
        </Link>
      </section>
    </div>
  )
}
