# Arquitetura do Nexora NFT Marketplace

## Aplicação

Frontend React 19 com TypeScript, servido pelo Vite. O TanStack Router controla URLs e rotas protegidas; o TanStack Query mantém o estado remoto/cache; Axios centraliza chamadas REST; MSW implementa os contratos simulados no nível de rede. `src/domain` define as entidades compartilhadas, `src/api` concentra contratos e hooks, `src/features` contém telas por fluxo e `src/components` contém a composição visual reutilizável.

```text
React pages
  ├─ TanStack Router (URLs, parâmetros, áreas privadas)
  ├─ TanStack Query (cache e mutações)
  │    └─ API resources → Axios → REST real ou handlers MSW
  └─ RealtimeProvider → socket.io-client → servidor Socket.IO local
                                      └─ snapshots para reconciliação MSW/REST
```

Rotas implementadas: `/`, `/nft/$nftId`, `/cart`, `/checkout`, `/login`, `/register`, `/account/profile`, `/account/wallets`, `/account/orders` e `/orders/$orderId/confirmation`. Páginas principais são carregadas por importação dinâmica de rota. As rotas privadas consultam a sessão antes de renderizar e mantêm a origem de retorno permitida.

## Dados e estado

- Os componentes chamam hooks em `src/api/hooks.ts`, não Axios diretamente.
- As funções de `src/api/resources.ts` fazem operações nos contratos; `src/api/client.ts` adiciona autenticação, identidade de visitante e cenários MSW.
- `src/mocks/handlers.ts` valida entradas, status, autorização e falhas; `src/mocks/database.ts` mantém fixtures e estado compartilhado entre catálogo, contas, favoritos, carteiras, carrinho, cotação e pedidos.
- Chaves de TanStack Query são centralizadas e incluem parâmetros de consulta/usuário. Logout ou troca de usuário limpa cache privado.
- Preços ETH são strings decimais e usam aritmética inteira na unidade de 10⁻¹⁸ ETH.
- A criação de pedido revalida preço, estoque, cotação e carteira no handler, registra um snapshot e aceita `Idempotency-Key`. A interface limpa o carrinho só após resposta de pedido bem-sucedida; refresh da confirmação consulta novamente o pedido.
- O MSW persiste o estado demonstrativo em `localStorage` no browser e o endpoint de reset retorna as fixtures iniciais. A persistência não equivale a banco ou sessão seguros.

## Sessão e segurança

O login REST é uma simulação para execução local, com contas fictícias e token opaco no browser. Não representa armazenamento seguro de credenciais. Em desenvolvimento, o cliente troca o usuário fictício por um token Socket de curta duração no endpoint local de demonstração; o servidor assina com chave aleatória em memória. Como a identidade do mock é escolhida pelo próprio cliente, isso não autentica usuários para produção.

O endpoint de emissão demo é desativado em `NODE_ENV=production`; o servidor espera JWT HS256 de backend confiável, com `sub` e `exp`, verificado por `REALTIME_JWT_SECRET` somente no ambiente server-side. A API REST real, emissor de JWT, armazenamento persistente e autorização de pedidos ainda precisam existir antes do deploy funcional. Não use contas, dados ou tokens mock para ativos reais.

## Eventos em tempo real

`src/realtime/contracts.ts` tipa os eventos `nft.updated` e `order.updated`. `src/realtime/client.ts` centraliza o socket; `RealtimeProvider` mantém conexão/reconexão/estado visual e limpa listeners; `querySync.ts` ignora duplicados e versões antigas, atualiza caches de NFT/carrinho e invalida a cotação. A REST fornece estado inicial e continua autoritativa no checkout. Após reconectar, snapshots são consultados pelo MSW para reconciliar a simulação.

O transporte de eventos é um servidor Socket.IO local em `server/realtime`, separado do Vite e dos handlers MSW. O caminho WebSocket improvisado do preview foi removido: o frontend e os testes de navegador conectam com `socket.io-client` ao sidecar real em `127.0.0.1:5188`. MSW atende REST e sincroniza snapshots autorizados; os endpoints demonstrativos de evento alteram os fixtures REST, mas não simulam o protocolo Socket.IO. O binding `@mswjs/socket.io-binding` não é usado. Para desenvolvimento, execute `npm run realtime:dev` e `npm run dev` em terminais separados; para E2E, o Playwright inicia/encerra o sidecar. A exigência de binding específico do MSW permanece parcial. O estado do sidecar é em memória e perde alterações ao reiniciar.

## Interface, acessibilidade e visual

Tailwind CSS 4 está configurado e importado; a maior parte da aparência está em `src/styles.css` e componentes personalizados para preservar os frames enviados. Radix UI é usado em primitives de diálogo/seleção e `Button` usa CVA/Slot, mas não há componentes gerados pelo shadcn/ui no momento. Isso permanece como requisito técnico parcial; não foi feita uma migração que alterasse os componentes da identidade visual.

O skip link, foco `:focus-visible`, labels, landmarks e atributos de status apoiam teclado e leitores de tela. Playwright verifica nomes acessíveis e foco em páginas principais, inclusive checkout/recibo. Essa inspeção heurística não substitui auditoria WCAG com axe; a instalação de `@axe-core/playwright` não foi possível por indisponibilidade de rede. Contraste de todos os estados, zoom e tecnologia assistiva ainda requerem revisão manual.

`docs/designFigma.png` contém a referência visual composta disponível. As baselines em `tests/e2e/visual-regression.e2e.spec.ts-snapshots` representam o código atual em viewports 1440×1000, 768×1024 e 390×844; são regressão da implementação, não comparação automatizada pixel a pixel com cada frame original do Figma. As capturas E2E usam dados resetados, movimento reduzido, imagens/fontes aguardadas e foco/ponteiro neutros. Fontes Google permanecem externas na aplicação e sua indisponibilidade pode afetar renderização. Em 2026-10-29 as 12 baselines foram revistas e atualizadas para a interface corrente; a captura de catálogo agora espera a grade e as imagens carregarem. O botão fixo mobile do checkout foi colocado no fluxo normal para não cobrir o total.

## Execução e publicação

Para desenvolvimento local, execute `npm run dev` e `npm run realtime:dev` em terminais separados. `npm run build` gera frontend sem MSW por padrão; o host publicado precisa de fallback SPA e uma API real compatível. Defina `VITE_API_BASE_URL` e `VITE_REALTIME_URL` para serviços públicos (sem segredos), e configure no servidor `REALTIME_HOST`, `REALTIME_PORT`, `REALTIME_ALLOWED_ORIGIN` e `REALTIME_JWT_SECRET`. Use HTTPS/WSS e permita somente origins necessários. O `REALTIME_DEMO_ADMIN_TOKEN` é exclusivo da demonstração, não um segredo de produção.

Não há implantação pública configurada. Repositório/URL públicos, provedor/credenciais, backend REST persistente, JWT/Socket.IO de produção, origins definitivos, fallback de SPA e verificação da aplicação publicada são etapas manuais pendentes.

## Cache, testes e auditoria

TanStack Query usa `staleTime` global de 30 segundos e retry padrão 1; mutations invalidam dados afetados. Consultas ao carrinho/cotação são revalidadas no fluxo de compra. Os scripts `test:api`, `test:mock-browser`, `test:realtime` e `test:e2e` exercitam contratos, interface e socket. `audit:lighthouse` executa Lighthouse 12.8.2 três vezes para home/detalhe em desktop/mobile e grava JSON/HTML em `artifacts/lighthouse`.

Na execução de auditoria de 2026-10-28, o chunk principal de produção ficou em aproximadamente 464 kB (151 kB gzip), abaixo do aviso Vite de 500 kB; rotas são chunks separados. As medições locais ainda ficam abaixo da meta Lighthouse em desempenho mobile e detalhe desktop; veja medianas, causas observadas e limitações em `docs/PROGRESSO.md`. Isso usa build local com MSW e não prediz desempenho de backend/deploy real.
