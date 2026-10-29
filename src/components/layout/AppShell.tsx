import { Link, useRouterState } from '@tanstack/react-router'
import {
  Facebook,
  Heart,
  House,
  Instagram,
  Linkedin,
  LogIn,
  Menu,
  Search,
  Scan,
  Twitter,
  UserRound,
  Youtube,
  ShoppingCart,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useCart, useSession } from '../../api/hooks'
import { getSessionUserId } from '../../api/client'
import { useRealtimeStatus } from '../../realtime/RealtimeProvider'

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const session = useSession()
  const realtimeStatus = useRealtimeStatus()
  const cart = useCart()
  const cartCount =
    cart.data?.items.reduce((total, item) => total + item.quantity, 0) ?? 0
  const authenticated = Boolean(session.data && getSessionUserId())

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Pular para o conteúdo
      </a>
      <header className="site-header">
        <div className="header-inner page-wrap">
          <Link to="/" className="wordmark" aria-label="Kurio início">
            KURIO
          </Link>
          <nav className="desktop-nav" aria-label="Navegação principal">
            <Link
              to="/"
              className="nav-link"
              activeProps={{ className: 'nav-link is-active' }}
            >
              Início
            </Link>
            <a href="#catalogo" className="nav-link">
              Mercado
            </a>
            <a href="#colecoes" className="nav-link">
              Criadores
            </a>
            <a href="#diario" className="nav-link">
              Aprenda
            </a>
          </nav>
          <div className="header-actions">
            <span
              className={`realtime-status is-${realtimeStatus}`}
              aria-live="polite"
              title={`Tempo real em simulação: ${realtimeStatus}`}
            >
              <span aria-hidden="true" />
              <span className="realtime-status-label">
                Tempo real:{' '}
                {realtimeStatus === 'connected'
                  ? 'conectado'
                  : realtimeStatus === 'connecting'
                    ? 'conectando'
                    : 'desconectado'}
              </span>
            </span>
            <button className="header-icon search-trigger" aria-label="Buscar">
              <Search size={17} />
            </button>
            <Link
              to="/cart"
              className="header-icon cart-trigger"
              aria-label={`Carrinho ${cartCount}`}
            >
              <ShoppingCart size={18} />
              <span className="cart-count">{cartCount}</span>
            </Link>
            {authenticated ? (
              <Link
                to="/account/profile"
                className="button button-primary button-sm header-login"
              >
                <UserRound size={14} /> Minha conta
              </Link>
            ) : (
              <Link
                to="/login"
                search={{ returnTo: undefined }}
                className="button button-primary button-sm header-login"
              >
                <LogIn size={14} /> Entrar
              </Link>
            )}
            <button className="header-icon mobile-menu" aria-label="Abrir menu">
              <Menu size={19} />
            </button>
          </div>
        </div>
      </header>
      <main
        id="main-content"
        className={pathname.startsWith('/nft/') ? 'is-detail-route' : undefined}
        tabIndex={-1}
      >
        {children}
      </main>
      <Footer />
      <nav className="mobile-nav" aria-label="Navegação móvel">
        <Link to="/" aria-label="Início">
          <House size={19} />
        </Link>
        <a href="#favoritos" aria-label="Favoritos">
          <Heart size={19} />
        </a>
        <button className="mobile-scan" aria-label="Escanear NFT">
          <Scan size={24} />
        </button>
        <Link to="/cart" aria-label="Carrinho">
          <ShoppingCart size={19} />
        </Link>
        <Link to="/account/profile" aria-label="Perfil">
          <UserRound size={19} />
        </Link>
      </nav>
    </div>
  )
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner page-wrap">
        <div className="footer-benefits">
          <div>
            <span className="benefit-mark">W</span>
            <strong>Segurança da carteira</strong>
            <small>
              Proteja sua carteira e colecione arte digital verificada com
              confiança.
            </small>
          </div>
          <div>
            <span className="benefit-mark">C</span>
            <strong>Criadores em destaque</strong>
            <small>
              Conheça artistas, estúdios e comunidades que moldam a cultura
              digital na rede.
            </small>
          </div>
          <div>
            <span className="benefit-mark">D</span>
            <strong>Alertas de lançamentos</strong>
            <small>
              Receba calendários de cunhagem, novidades de listas de acesso e
              análises do mercado.
            </small>
          </div>
          <div className="newsletter">
            <strong>Antecipe-se ao próximo lançamento</strong>
            <div>
              <input
                aria-label="Seu e-mail"
                placeholder="digite seu e-mail..."
              />
              <button>Enviar</button>
            </div>
            <small>
              Receba lançamentos selecionados, histórias de criadores e
              novidades do mercado.
            </small>
          </div>
        </div>
        <div className="footer-contact">
          <Link to="/" className="wordmark">
            KURIO
          </Link>
          <span>
            Feito para colecionadores,
            <br /> criadores e cultura
          </span>
          <a href="mailto:contato@email.com">contato@email.com</a>
          <a href="tel:+551140028922">+55 11 4002 8922</a>
        </div>
        <div className="footer-links">
          <div>
            <strong>Meu perfil</strong>
            <Link to="/account/profile">Meu perfil</Link>
            <Link to="/account/profile">Minha coleção</Link>
            <Link to="/account/profile">Atividade</Link>
            <Link to="/account/profile">Estúdio do criador</Link>
            <Link to="/account/profile">Lista de interesse</Link>
          </div>
          <div>
            <strong>Central de ajuda</strong>
            <a href="#ajuda">Central de ajuda</a>
            <a href="#ajuda">Como comprar NFTs</a>
            <a href="#ajuda">Carteira e segurança</a>
            <a href="#ajuda">Política do mercado</a>
            <a href="#ajuda">Denunciar item</a>
          </div>
          <div>
            <strong>Coleções</strong>
            <a href="#catalogo">Arte digital</a>
            <a href="#catalogo">Fotografia</a>
            <a href="#catalogo">Música</a>
            <a href="#catalogo">Arte 3D</a>
            <a href="#catalogo">Utilidade</a>
          </div>
          <div className="footer-social">
            <strong>Redes sociais</strong>
            <div>
              <a href="#social" aria-label="Facebook">
                <Facebook size={14} />
              </a>
              <a href="#social" aria-label="Instagram">
                <Instagram size={14} />
              </a>
              <a href="#social" aria-label="Twitter">
                <Twitter size={14} />
              </a>
              <a href="#social" aria-label="LinkedIn">
                <Linkedin size={14} />
              </a>
              <a href="#social" aria-label="YouTube">
                <Youtube size={14} />
              </a>
            </div>
            <b>Carteiras compatíveis</b>
            <small>METAMASK · WALLETCONNECT · COINBASE</small>
          </div>
        </div>
      </div>
      <div className="footer-bottom page-wrap mt-3">
        <span>© 2026 Kurio. Propriedade digital para todos.</span>
      </div>
    </footer>
  )
}
