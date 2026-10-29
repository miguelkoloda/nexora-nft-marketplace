import { useEffect, useState } from 'react'
import {
  ArrowRight,
  ChevronDown,
  Search,
  SlidersHorizontal,
} from 'lucide-react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useNfts } from '../../api/hooks'
import type { CatalogQuery, Nft } from '../../domain/types'
import { nfts } from '../../data/nfts'
import { NftArtwork } from '../../components/nft/NftArtwork'
import { NftGrid } from '../../components/nft/NftGrid'
import { Button } from '../../components/ui/Button'
import { mockModeEnabled } from '../../realtime/config'

const collectionFilters = [
  'Arte digital',
  'Fotografia',
  'Música',
  'Arte 3D',
  'Colecionáveis',
  'Generativa',
  'Jogos',
  'Utilidade',
]
const articles = [
  'Como funciona a propriedade de NFTs',
  '10 artistas digitais para acompanhar',
  'Raridade, atributos e procedência',
  'Como proteger sua carteira',
]
const journalNfts = [nfts[2], nfts[0], nfts[1], nfts[6]]
const pageSize = 9
const minPriceCents = 2
const maxPriceCents = 1230

function toCents(value: string | undefined, fallback: number): number {
  if (!value) return fallback
  const [whole, fraction = ''] = value.split('.')
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0').slice(0, 2))
}

function priceString(value: number): string {
  return (value / 100).toFixed(2)
}

export function HomePage() {
  const search = useSearch({ strict: false }) as CatalogQuery
  const navigate = useNavigate()
  const catalog = useNfts({ ...search, page: search.page ?? 1, pageSize })
  const highlights = useNfts({ page: 1, pageSize })
  const categoryCatalog = useNfts({ page: 1, pageSize: 50 })
  const [searchInput, setSearchInput] = useState(search.search ?? '')
  const [minDraft, setMinDraft] = useState(() =>
    toCents(search.minPrice, minPriceCents),
  )
  const [maxDraft, setMaxDraft] = useState(() =>
    toCents(search.maxPrice, maxPriceCents),
  )

  useEffect(() => setSearchInput(search.search ?? ''), [search.search])
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const value = searchInput.trim()
      if (value === (search.search ?? '')) return
      void navigate({
        to: '/',
        replace: true,
        search: (previous) => ({
          ...previous,
          search: value || undefined,
          page: undefined,
        }),
      })
    }, 250)
    return () => window.clearTimeout(timer)
  }, [navigate, search.search, searchInput])
  useEffect(() => {
    setMinDraft(toCents(search.minPrice, minPriceCents))
    setMaxDraft(toCents(search.maxPrice, maxPriceCents))
  }, [search.minPrice, search.maxPrice])

  const items = catalog.data?.items ?? []
  const categoryCounts = new Map<string, number>()
  for (const nft of categoryCatalog.data?.items ?? []) {
    categoryCounts.set(nft.category, (categoryCounts.get(nft.category) ?? 0) + 1)
  }
  const isInitialCatalog =
    !search.search &&
    !search.category &&
    !search.network &&
    !search.minPrice &&
    !search.maxPrice &&
    (!search.sort || search.sort === 'recent') &&
    (search.page ?? 1) === 1
  const highlightItems = highlights.data?.items ?? nfts
  const heroNft = highlightItems[0] ?? nfts[0]
  const secondaryNft = highlightItems[1] ?? nfts[1]
  const featuredNft = highlightItems[2] ?? heroNft
  const page = catalog.data?.page ?? search.page ?? 1
  const pageCount = catalog.data?.pageCount ?? 1
  const currentTab =
    !search.category &&
    !search.network &&
    !search.minPrice &&
    !search.maxPrice &&
    !search.sort
      ? 'all'
      : search.sort === 'popular'
        ? 'popular'
        : search.sort === 'recent'
          ? 'recent'
          : 'filtered'

  function updateQuery(patch: Partial<CatalogQuery>) {
    void navigate({
      to: '/',
      search: (previous) => ({ ...previous, ...patch, page: patch.page ?? 1 }),
    })
  }

  function clearFilters() {
    void navigate({
      to: '/',
      search: (previous) => ({ search: previous.search }),
    })
  }

  function selectTab(tab: 'all' | 'recent' | 'popular') {
    if (tab === 'all') {
      void navigate({
        to: '/',
        search: (previous) => ({ search: previous.search }),
      })
      return
    }
    updateQuery({ sort: tab === 'popular' ? 'popular' : 'recent' })
  }

  function categoryClick(value: string) {
    updateQuery({ category: search.category === value ? undefined : value })
  }

  function networkClick(value: string) {
    updateQuery({ network: search.network === value ? undefined : value })
  }

  function applyPrice() {
    updateQuery({
      minPrice: minDraft <= minPriceCents ? undefined : priceString(minDraft),
      maxPrice: maxDraft >= maxPriceCents ? undefined : priceString(maxDraft),
    })
  }

  return (
    <>
      <div className="mobile-search page-wrap">
        <label>
          <Search size={19} />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Explorar coleções"
            aria-label="Buscar NFTs"
          />
        </label>
        <button
          aria-label="Abrir filtros"
          onClick={() =>
            document
              .getElementById('catalog-filters')
              ?.scrollIntoView({ behavior: 'smooth' })
          }
        >
          <SlidersHorizontal size={19} />
        </button>
      </div>

      <section className="hero page-wrap">
        <div className="hero-copy">
          <span className="eyebrow hero-kicker">Bem-vindo à Kurio</span>
          <h1>
            <span className="desktop-hero-title">
              SEJA DONO DO FUTURO
              <br />
              DA ARTE DIGITAL
            </span>
            <span className="mobile-hero-title">
              SEJA DONO DA
              <br />
              CULTURA DIGITAL
            </span>
          </h1>
          <p className="desktop-hero-copy">
            Descubra NFTs selecionados de criadores emergentes e consagrados.
            Colecione arte digital rara, apoie artistas e tenha uma parte da
            cultura da internet.
          </p>
          <p className="mobile-hero-copy">
            Descubra NFTs selecionados de criadores do mundo todo.
          </p>
          <a className="hero-explore" href="#catalogo">
            EXPLORAR
          </a>
          <div className="hero-dots" role="img" aria-label="Slide 1 de 3">
            <i className="selected" />
            <i />
            <i />
          </div>
        </div>
        <div className="hero-art-wrap">
          {highlights.isPending && !mockModeEnabled ? (
            <div
              className="hero-artwork catalog-skeleton"
              aria-label="Carregando destaque"
            />
          ) : (
            <>
              <Link
                to="/nft/$nftId"
                params={{ nftId: heroNft.id }}
                className="hero-art-link"
                aria-label={`Ver ${heroNft.name}`}
              >
                <NftArtwork
                  nft={heroNft}
                  className="hero-artwork"
                  decorative
                  loading="eager"
                  fetchPriority="high"
                />
              </Link>
              {!highlights.isPending && (
                <div className="hero-secondary-art" aria-hidden="true">
                  <NftArtwork
                    nft={secondaryNft}
                    className="hero-artwork"
                    decorative
                  />
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <section className="market-section page-wrap" id="catalogo">
        <aside className="market-sidebar" id="catalog-filters">
          <div className="filters-panel">
            <h2>Coleções</h2>
            <div className="filter-group collection-list">
              {collectionFilters.map((label) => (
                <button
                  className={`filter-row${search.category === label ? ' filter-active' : ''}`}
                  key={label}
                  aria-pressed={search.category === label}
                  onClick={() => categoryClick(label)}
                >
                  <span>{label}</span>
                  <small>({categoryCounts.get(label) ?? 0})</small>
                </button>
              ))}
            </div>
            <div className="filter-group price-filter">
              <h3>Faixa de preço</h3>
              <div className="price-range-inputs">
                <label>
                  <span className="sr-only">
                    Preço mínimo em centésimos de ETH
                  </span>
                  <input
                    type="range"
                    min={minPriceCents}
                    max={maxPriceCents}
                    value={minDraft}
                    onChange={(event) =>
                      setMinDraft(
                        Math.min(Number(event.target.value), maxDraft),
                      )
                    }
                  />
                </label>
                <label>
                  <span className="sr-only">
                    Preço máximo em centésimos de ETH
                  </span>
                  <input
                    type="range"
                    min={minPriceCents}
                    max={maxPriceCents}
                    value={maxDraft}
                    onChange={(event) =>
                      setMaxDraft(
                        Math.max(Number(event.target.value), minDraft),
                      )
                    }
                  />
                </label>
              </div>
              <small>
                Preço: {priceString(minDraft)} – {priceString(maxDraft)} ETH
              </small>
              <Button size="small" variant="secondary" onClick={applyPrice}>
                Aplicar
              </Button>
            </div>
            <div className="filter-group network-filter">
              <h3>Rede</h3>
              {(
                [
                  ['Ethereum', '119'],
                  ['Polygon', '78'],
                  ['Solana', '86'],
                ] as const
              ).map(([label, count]) => (
                <button
                  className={`filter-row${search.network === label ? ' filter-active' : ''}`}
                  key={label}
                  aria-pressed={search.network === label}
                  onClick={() => networkClick(label)}
                >
                  <span>{label}</span>
                  <small>({count})</small>
                </button>
              ))}
            </div>
          </div>

          {highlights.isPending ? (
            <div
              className="sidebar-featured catalog-skeleton"
              aria-label="Carregando NFT em destaque"
            />
          ) : (
            <Link
              to="/nft/$nftId"
              params={{ nftId: featuredNft.id }}
              className="sidebar-featured"
            >
              <span>NFT EM DESTAQUE</span>
              <strong>OFERTA LIMITADA</strong>
              <NftArtwork nft={featuredNft} decorative />
            </Link>
          )}
        </aside>

        <div className="market-content">
          <div className="market-toolbar">
            <div className="category-tabs">
              <button
                className={currentTab === 'all' ? 'tab-active' : ''}
                onClick={() => selectTab('all')}
              >
                Todos os NFTs
              </button>
              <button
                className={currentTab === 'recent' ? 'tab-active' : ''}
                onClick={() => selectTab('recent')}
              >
                Novos lançamentos
              </button>
              <button
                className={currentTab === 'popular' ? 'tab-active' : ''}
                onClick={() => selectTab('popular')}
              >
                Em alta
              </button>
            </div>
            <label className="sort-control">
              Ordenar por:
              <select
                aria-label="Ordenar NFTs"
                value={search.sort ?? 'recent'}
                onChange={(event) =>
                  updateQuery({
                    sort: event.target.value as CatalogQuery['sort'],
                  })
                }
              >
                <option value="recent">Listados recentemente</option>
                <option value="price-asc">Menor preço</option>
                <option value="price-desc">Maior preço</option>
                <option value="popular">Mais populares</option>
              </select>
              <ChevronDown size={13} />
            </label>
          </div>
          <div className="mobile-market-tools">
            <button
              className={currentTab === 'all' ? 'tab-active' : ''}
              onClick={() => selectTab('all')}
            >
              Todos os NFTs
            </button>
            <button
              className={currentTab === 'recent' ? 'tab-active' : ''}
              onClick={() => selectTab('recent')}
            >
              Novos lançamentos
            </button>
            <button
              className={currentTab === 'popular' ? 'tab-active' : ''}
              onClick={() => selectTab('popular')}
            >
              Em alta
            </button>
          </div>
          {catalog.isPending ? (
            <NftGrid
              items={[]}
              compact
              priorityCount={1}
              loading
              previewNft={
                mockModeEnabled && isInitialCatalog ? nfts[0] : undefined
              }
            />
          ) : catalog.isError ? (
            <div className="catalog-message" role="alert">
              <p>
                {catalog.error instanceof Error
                  ? catalog.error.message
                  : 'Não foi possível carregar os NFTs.'}
              </p>
              <button onClick={() => void catalog.refetch()}>
                Tentar novamente
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="catalog-message" role="status">
              <p>Nenhum NFT encontrado com esses critérios.</p>
              <button onClick={clearFilters}>Limpar filtros</button>
            </div>
          ) : (
            <NftGrid items={items} compact priorityCount={1} />
          )}
          {!catalog.isPending && !catalog.isError && pageCount > 1 && (
            <nav className="pagination" aria-label="Paginação do catálogo">
              <button
                disabled={page <= 1}
                aria-label="Página anterior"
                onClick={() => updateQuery({ page: page - 1 })}
              >
                ‹
              </button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map(
                (pageNumber) => (
                  <button
                    key={pageNumber}
                    className={pageNumber === page ? 'page-current' : ''}
                    aria-label={`Página ${pageNumber}`}
                    aria-current={pageNumber === page ? 'page' : undefined}
                    onClick={() => updateQuery({ page: pageNumber })}
                  >
                    {pageNumber}
                  </button>
                ),
              )}
              <button
                disabled={page >= pageCount}
                aria-label="Próxima página"
                onClick={() => updateQuery({ page: page + 1 })}
              >
                ›
              </button>
            </nav>
          )}
        </div>
      </section>

      <section className="promo-grid page-wrap" id="colecoes">
        <PromoCard
          nft={nfts[0]}
          title="Lançamentos gênesis de edição limitada"
          description="Colecione edições escassas diretamente dos criadores antes da revelação pública."
        />
        <PromoCard
          nft={nfts[2]}
          title="Arte digital selecionada e muito mais"
          description="Explore novos artistas, coleções verificadas e obras digitais que definem a expressão."
        />
      </section>
      <section className="journal-section page-wrap" id="diario">
        <div className="journal-heading">
          <h2>Diário da Cunhagem</h2>
          <p>
            Histórias, guias e insights para colecionadores sobre o universo da
            propriedade digital.
          </p>
        </div>
        <div className="journal-grid">
          {journalNfts.map((nft, index) => (
            <article className="journal-card" key={nft.id}>
              <NftArtwork nft={nft} className="journal-artwork" decorative />
              <small className="journal-meta">
                {13 + index} de setembro <span>|</span> Leitura de {index + 2}{' '}
                min
              </small>
              <h3>{articles[index]}</h3>
              <p>
                {
                  [
                    'Aprenda a colecionar, negociar e verificar ativos digitais.',
                    'Conheça criadores que moldam a cultura digital.',
                    'Entenda raridade, procedência, direitos autorais e utilidade.',
                    'Proteja sua carteira, seus ativos e sua identidade.',
                  ][index]
                }
              </p>
              <a href="#diario">Ler mais →</a>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}

function PromoCard({
  nft,
  title,
  description,
}: {
  nft: Nft
  title: string
  description: string
}) {
  return (
    <article className="promo-card">
      <NftArtwork nft={nft} className="promo-artwork" decorative />
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
        <a href="#catalogo">
          Explorar <ArrowRight size={13} />
        </a>
      </div>
    </article>
  )
}
