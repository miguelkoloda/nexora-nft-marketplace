# Nexora NFT Marketplace

Marketplace demonstrativo de NFTs desenvolvido com React, TypeScript e Vite para demonstrar competências em desenvolvimento frontend.

A aplicação oferece catálogo de NFTs, filtros dinâmicos, busca, favoritos, carrinho, cupons, carteira com saldo demonstrativo, checkout simulado, histórico de pedidos e atualizações de estado na interface.

O projeto utiliza TanStack Router, TanStack Query, Axios, MSW, Tailwind CSS e Playwright. A arquitetura separa a interface, a camada de comunicação HTTP, as regras de domínio e os dados simulados.

**Importante:** este é um projeto demonstrativo. Não há transações reais, conexão com carteiras blockchain ou transferência de criptomoedas.

## URLs da entrega

- Repositório: **https://github.com/miguelkoloda/nexora-nft-marketplace**
- Aplicação: **https://nexora-nft-marketplace-woad.vercel.app/**
- Servidor Socket.IO: **não publicado; a demonstração funciona com dados simulados.**

## Requisitos

- Node.js 22.6 ou superior (necessário para `--experimental-strip-types` nos testes/servidor).
- npm incluído com Node.js.
- Chromium instalado pelo Playwright para testes e Lighthouse. Após instalar dependências, execute `npx playwright install chromium` se o navegador ainda não estiver disponível.

## Instalação e desenvolvimento

```bash
npm ci
npm run dev
```

Em outro terminal, inicie o servidor Socket.IO local:

```bash
npm run realtime:dev
```

O Vite usa `http://127.0.0.1:5173` e o servidor realtime usa `http://127.0.0.1:5188` por padrão. Em desenvolvimento, MSW é ativado por padrão. Para desativá-lo, defina `VITE_ENABLE_MOCKS=false` e configure uma API REST compatível.

## Contas demonstrativas

| E-mail            | Senha         |
| ----------------- | ------------- |
| `alex@kurio.test` | `Kurio123!`   |
| `sam@kurio.test`  | `Collect123!` |

As contas existem apenas nas fixtures do MSW. O banco de demonstração guarda hashes de senha e pode persistir dados em `localStorage`. Use o reset demonstrativo para retornar às fixtures iniciais.

## Stack e uso

- **React 19 e TypeScript:** componentes e contratos tipados.
- **TanStack Router:** rotas, parâmetros de busca e proteção de páginas privadas.
- **TanStack Query:** cache, consultas e mutations.
- **Axios:** cliente REST centralizado.
- **MSW 2:** handlers REST e dados/falhas demonstrativos na camada de rede.
- **Socket.IO:** servidor local separado, cliente centralizado, eventos versionados de NFT e pedido.
- **Tailwind CSS 4:** plugin Vite e folha de estilos carregada; a maior parte da identidade visual usa CSS próprio.
- **Radix UI e class-variance-authority:** diálogo/seleção e composição de `Button`. O projeto ainda não usa um conjunto de componentes shadcn/ui completo; veja as limitações abaixo.
- **Playwright:** testes API, integração de browser, fluxos E2E, acessibilidade prática por teclado e regressão visual.
- **Lighthouse:** auditorias reproduzíveis de início e detalhe em desktop/mobile.

## Mocks e cenários

O MSW inicia antes da aplicação em desenvolvimento e nos modos de teste/auditoria. A camada compartilha estado entre NFTs, carrinho, conta, carteiras, favoritos e pedidos, e permite reset pelo endpoint demonstrativo `POST /api/__mock/reset`.

O cliente HTTP lê `kurio.mock.scenario` do `localStorage` quando os mocks estão ativos. Cenários aceitos incluem `slow`, `network-error`, `server-error`, `session-expired`, `payment-declined`, `order-pending`, `timeout-after-create`, `price-changed` e `stock-changed`. O guia de endpoints, eventos, erros e cenários está em [`docs/API.md`](docs/API.md).

## Arquitetura resumida

- `src/features`: páginas e fluxos do marketplace.
- `src/api`: cliente Axios, contratos de recursos e hooks TanStack Query.
- `src/domain`: entidades e tipos compartilhados.
- `src/mocks`: handlers MSW e base de dados demonstrativa.
- `src/realtime`: cliente Socket.IO, sincronização do cache e estado de conexão.
- `server/realtime`: servidor independente de eventos.
- `tests/api`, `tests/browser`, `tests/e2e`, `tests/realtime`: cobertura REST, browser, interface e protocolo.
- `docs/designFigma.png`: imagem de referência fornecida no projeto. Snapshots Playwright são baselines do código atual para detectar regressões; não são uma comparação pixel a pixel com todos os frames do Figma.

## Verificações

```bash
npm run typecheck
npm run lint
npm run build
npm run test:api
npm run test:mock-browser
npm run test:realtime
npm run test:e2e
npm run audit:lighthouse
```

`test:api` exercita handlers REST em Node. `test:mock-browser` cria build de teste e executa os testes browser. `test:e2e` inclui casos browser, cenários completos, verificações de acessibilidade por teclado/nome e screenshots baseline em Chromium. O Playwright salva traces/screenshots de falhas e HTML em `playwright-report-e2e`. Baselines são evidência visual: revise os pares atual/esperado e confirme a causa antes de atualizar qualquer imagem.

Nos testes de navegador, o cliente Socket.IO conecta diretamente ao sidecar iniciado pelo Playwright em `127.0.0.1:5188`; o preview Vite não implementa um transporte WebSocket mock. Em desenvolvimento, inicie `npm run realtime:dev` junto com o frontend. Eventos privados de pedido permanecem autorizados no servidor.

```bash
npm run build:browser-test
npx playwright test --config=playwright.e2e.config.ts tests/e2e/visual-regression.e2e.spec.ts
```

O comando `audit:lighthouse` constrói com mocks de auditoria, inicia os serviços locais e executa três medições para cada combinação de página (início/detalhe) e perfil (desktop/mobile). JSON/HTML individuais e medianas são gravados em `artifacts/lighthouse/`. Não trate pontuações da simulação local como garantias de produção.

## Build e publicação

```bash
npm run build
npm run preview
```

O build padrão é de produção: MSW não inicia por padrão, Socket.IO não aponta para `localhost` e a aplicação precisa de uma API real compatível. Configure apenas valores públicos no frontend:

- `VITE_API_BASE_URL`: URL base pública da API REST.
- `VITE_REALTIME_URL`: URL pública do Socket.IO.
- `VITE_ENABLE_MOCKS=true`: opt-in explícito para build demonstrativo com MSW; não é apropriado para dados reais ou contas privadas.
- `VITE_REALTIME_STATE_SYNC=false`: desativa a reconciliação de snapshots demonstrativos.

No servidor Socket.IO, configure no ambiente do serviço (nunca em `VITE_*`):

- `REALTIME_HOST` e `REALTIME_PORT`.
- `REALTIME_ALLOWED_ORIGIN` com os origins públicos permitidos.
- `REALTIME_JWT_SECRET` para validar tokens JWT HS256 emitidos pelo backend real.
- `REALTIME_DEMO_ADMIN_TOKEN` somente se a operação administrativa for habilitada.

Hospede o frontend estático e o servidor Socket.IO como serviços separados, configure fallback de SPA para rotas diretas e habilite HTTPS/WSS e CORS restrito. A aplicação não foi publicada; faltam URLs, credenciais/ambientes do provedor, backend REST real e configuração/validação do host de eventos. Nenhuma chave deve ser colocada no bundle ou em variáveis `VITE_*`.

### Publicação do frontend no Vercel

O projeto Vite gera `dist` com `npm run build`. O arquivo [`vercel.json`](vercel.json) adiciona o rewrite SPA necessário para acesso direto e refresh de rotas TanStack; arquivos estáticos existentes são servidos antes do rewrite. Configure Framework Preset **Vite**, Build Command `npm run build` e Output Directory `dist` (ou mantenha os valores detectados automaticamente). Para a demo, defina `VITE_ENABLE_MOCKS=true` antes do build. `VITE_REALTIME_URL` deve apontar somente a um servidor Socket.IO publicado; deixe vazio na demo sem eventos realtime. Nunca configure segredos como `VITE_*`.

O Vercel publica o frontend estático, não o processo `server/realtime/index.ts`. O cliente Socket.IO tem reconexão e as consultas REST continuam funcionando sem socket. Se precisar de realtime, hospede o sidecar num serviço compatível ou adapte-o conscientemente a uma rota WebSocket/Vercel Function com estado compartilhado: a arquitetura atual não se publica como servidor Node persistente apenas adicionando `vercel.json`. A documentação do Vercel descreve rewrites para deep links em SPAs Vite e WebSockets em Functions com conexões ligadas à instância/duração e coordenação externa ([Vite](https://vercel.com/docs/frameworks/frontend/vite), [rewrites](https://vercel.com/docs/routing/rewrites), [WebSockets](https://vercel.com/kb/guide/do-vercel-serverless-functions-support-websocket-connections)). Nenhuma URL foi configurada ou publicada.

### Status da publicação

O frontend está hospedado na Vercel:

https://nexora-nft-marketplace-woad.vercel.app/

A aplicação utiliza MSW para simular a API REST durante a demonstração. Os dados e o saldo da carteira são demonstrativos, e não representam transações financeiras reais.

O servidor Socket.IO é executado separadamente e não faz parte do deploy estático do frontend. Para disponibilizar os recursos de realtime em um ambiente público, é necessário hospedar e configurar esse serviço separadamente.

### Preparação para Render

O arquivo [`render.yaml`](render.yaml) descreve um serviço Node para Socket.IO e um site estático Vite, com rewrite de rotas para `/index.html`. O serviço realtime usa `PORT` fornecido pelo provedor (com fallback local para `REALTIME_PORT`/5188), escuta em `0.0.0.0` e tem health check em `/__demo/health`. O plano `free` pode suspender o serviço após inatividade; para conexões contínuas, escolha conscientemente um plano que não suspenda e confira o custo antes de criar os serviços.

Após importar o Blueprint, configure `REALTIME_ALLOWED_ORIGIN` no serviço Socket.IO com a origem HTTPS exata do site e `VITE_REALTIME_URL` no site com a URL HTTPS do serviço Socket.IO (o cliente Socket.IO negocia WSS sobre HTTPS). Salve as variáveis e faça novo deploy do site para incorporá-las ao bundle. O secret JWT é gerado e fica no serviço, mas ainda não existe API de produção que emita esses tokens ou forneça REST persistente. Portanto este Blueprint prepara uma demonstração com MSW; não torna o marketplace uma aplicação financeira real. Sem API REST, desative os fluxos de identidade/eventos privados até integrar um emissor de JWT confiável.

Para exercitar o build demonstrativo localmente em preview de produção (PowerShell):

```powershell
$env:VITE_ENABLE_MOCKS = 'true'
$env:VITE_REALTIME_URL = 'http://127.0.0.1:5188'
npm run build
Remove-Item Env:VITE_ENABLE_MOCKS
Remove-Item Env:VITE_REALTIME_URL
```

Em terminais separados, execute `npm run realtime:dev` e `npm run preview -- --host 127.0.0.1`. Para automatizar os fluxos de navegador contra o `dist` atual, execute `npx playwright test --config=playwright.browser.config.ts` sem reconstruir entre o build e os testes. O build padrão sem `VITE_ENABLE_MOCKS=true` continua sendo o modo esperado para uma API real.

## Limitações conhecidas

- MSW, armazenamento local e contas fictícias não oferecem autenticação, persistência ou isolamento para produção. O reset e os dados são locais ao navegador.
- A emissão de identidade Socket.IO demonstrativa só existe em desenvolvimento/teste: o cliente fornece o identificador do perfil mock ao endpoint local, por isso esse mecanismo **não autentica identidades** e não deve ser exposto como serviço público. O modo de produção desativa essa emissão; o servidor só aceita eventos privados com JWT HS256 e segredo exclusivamente server-side. O backend real deve emitir/validar o JWT e autorizar o pedido.
- A assinatura demonstrativa usa chave aleatória em memória do processo, sem valor de configuração no frontend. Reiniciar o servidor invalida esses tokens/eventos.
- O checkout é simulado; não há carteira blockchain, gateway, transferência, conversão fiat ou transação real.
- `shadcn/ui` não está integrado como biblioteca/componentes gerados. Componentes existentes Radix/customizados preservam o design; essa exigência da stack permanece pendente.
- Avatar ainda não tem upload. O gerenciamento demonstrativo permite cadastrar/promover carteiras e conferir saldo simulado; a cobertura funcional está em `docs/PROGRESSO.md`.
- Axe não está instalado: a tentativa de obter a dependência não recebeu resposta da rede. Os testes Playwright verificam teclado, foco e nomes acessíveis, mas não substituem axe/WCAG abrangente.
- Build atual divide páginas sob demanda e mantém o chunk principal abaixo do limite de aviso do Vite; consulte os tamanhos e Lighthouse atuais em `docs/PROGRESSO.md` e `artifacts/lighthouse/` após executar a auditoria.
- Lighthouse local foi executado três vezes por perfil/rota; os resultados e a limitação de desempenho mobile estão em `docs/PROGRESSO.md`. Deploy público e relatório WCAG abrangente continuam pendentes.
- A arte principal `emerald-ape` tem variante WebP local com fallback PNG. A comparação Lighthouse de três execuções por perfil e rota está em `docs/PROGRESSO.md`; mesmo após o ganho, o LCP mobile permanece acima da meta.

## Documentação

- [`docs/API.md`](docs/API.md): contratos REST, cenários e eventos.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): rotas, estado, segurança, eventos, UX e limites de publicação.
- [`docs/PROGRESSO.md`](docs/PROGRESSO.md): auditoria de requisitos, resultados e pendências.
- [`docs/ENTREGA.md`](docs/ENTREGA.md): otimização final, comparação Lighthouse, build de produção e configuração de demonstração.
- `docs/README.md`: enunciado original do desafio.

As baselines visuais usam 1440×1000, 768×1024 e 390×844; elas detectam mudanças na renderização atual e não certificam fidelidade pixel a pixel em relação ao Figma. `npm run lint` aplica regras ESLint aos arquivos JavaScript de infraestrutura; os arquivos TypeScript são verificados por `npm run typecheck` porque o parser/plugin TypeScript do ESLint não está instalado.
