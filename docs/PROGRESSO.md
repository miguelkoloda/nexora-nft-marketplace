# Progresso do desafio

## Estado inicial

Este arquivo registra o estado conhecido no início do planejamento, sem alegar implementação inexistente.

| Área                            | Estado                                                                                                                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Documento oficial               | Lido integralmente em `README.md`                                                                                                                                               |
| Design                          | `docs/designFigma.png` inspecionado; link original continua inacessível pela ferramenta. Estruturas visuais reconhecíveis foram incorporadas ao plano, com limitações anotadas. |
| Aplicação / funcionalidades     | Estrutura e páginas visuais iniciais criadas com conteúdo fictício temporário; fluxos complexos não implementados.                                                              |
| `docs/PLANO.md`                 | Requisitos e checklist atualizados com a etapa visual.                                                                                                                          |
| Build / tipos                   | `npm run build` e `npm run typecheck` concluídos com sucesso após a refatoração da home.                                                                                        |
| Testes E2E, auditorias e deploy | Não executados / não configurados além dos pacotes/scripts iniciais.                                                                                                            |

## Implementado

- Planejamento e checklist em `docs/PLANO.md`.
- Registro inicial do estado em `docs/PROGRESSO.md`.
- Análise visual de `docs/designFigma.png`: início, detalhe, carrinho, pagamento, perfil, confirmação e variações mobile, incluindo linguagem escura com acento laranja.
- Fundação React/TypeScript com configuração Vite/Tailwind, Router e Query providers e rotas para as páginas previstas.
- Layouts visuais iniciais para catálogo, detalhe, carrinho, pagamento, autenticação, perfil/carteiras, confirmação demonstrativa e 404; componentes compartilhados para shell, navegação, rodapé, cards de NFT, grade e botões.
- Dependências instaladas e lockfile npm gerado.
- Build de produção e checagem TypeScript executados com sucesso.
- Login/cadastro ajustados para diálogos Radix sobre a página inicial, mantendo a página visível sob uma camada escura; fechamento pelo botão, clique externo ou tecla Escape.
- Em mobile, login/cadastro ocupam a tela inteira sobre o fundo principal, sem caixa/borda ao redor do formulário.
- Conteúdo mobile de autenticação alinhado à referência: moldura escura arredondada, campos e ações na ordem do design, opções Google/Facebook e alternância entre entrar/cadastrar.
- Home reorganizada para as referências enviadas: desktop com hero em duas colunas, filtros e NFT em destaque na lateral, catálogo em três colunas, banners, diário e rodapé; mobile com busca/filtro no topo, hero compacto, tabs, grade de duas colunas escalonada e navegação inferior com ação central.
- Quatro retratos recortados da imagem composta `docs/designFigma.png` e salvos localmente em `public/artwork/`; cards, hero, diário e telas que reutilizam `NftArtwork` agora usam a arte visível no documento.
- Dados fictícios de catálogo alinhados aos nomes/preços exibidos na referência. Continuam temporários e sem comportamento de catálogo funcional.
- Ajustes finais da home desktop: wordmark sem símbolo registrado, carrinho com ícone e contador do design, ação Entrar com ícone de login, remoção do ícone de perfil do cabeçalho e remoção da seta em Explorar.
- Rodapé reorganizado para deixar a linha de direitos autorais abaixo e fora do painel marrom; redes sociais alinhadas aos cinco ícones da referência.

Os fluxos complexos ainda não estão implementados. Os formulários, navegação, controles de catálogo, carrinho e pagamento continuam sendo principalmente layouts demonstrativos, sem integração REST ou estado de negócio.

## Auditoria visual e refatoração

### Divergências encontradas

1. Estrutura/proporções: autenticação móvel havia sido apresentada como modal; catálogo desktop tinha quatro colunas em vez das três aparentes na referência.
2. Paleta/tipografia: tokens escuros e âmbar estavam centralizados, mas a folha de estilos muito comprimida dificultava revisão consistente.
3. Componentes/imagens: cards e telas usavam fotos externas de gatos/cães, diferentes dos retratos ilustrados de macacos do Figma; catálogo e diário tinham pouca variedade.
4. Espaçamentos/alinhamentos: destaque tinha um quadrado decorativo inclinado e sombra forte não presentes na referência; classes de imagem assumiam `<img>`.
5. Responsividade: algumas telas mantinham estruturas desktop sem refinamento suficiente; autenticação mobile não reproduzia os campos e a ordem dos frames.
6. Interação/robustez: detalhe de NFT desconhecido mostrava o primeiro item do catálogo. Busca, filtros, favoritos e controles de quantidade aparentam interação, mas seguem sem lógica de negócio.

### Correções desta auditoria

- Ajustadas colunas do catálogo e diário para a densidade da referência, com grade móvel em duas colunas e reorganização de journal.
- Removidas fotos externas e vetores provisórios; quatro retratos da referência foram extraídos para uso como assets locais no hero, cards, detalhe, carrinho, checkout, confirmação e diário.
- Refeita a composição da página inicial em desktop e mobile de acordo com as imagens enviadas, incluindo a navegação inferior móvel e hierarquia de catálogo/sidebar/diário/rodapé no desktop.
- Removido o backdrop decorativo inclinado do destaque e ajustadas proporções dos cards.
- Ampliados os dados demonstrativos para dar densidade aos layouts; carrinho e resumo passaram a exibir três itens e total coerente (2.73 ETH com taxa de rede de 0.04 ETH).
- NFT com identificador desconhecido passou a exibir 404 em vez de renderizar o primeiro NFT.
- Adicionado Prettier e formatados os arquivos TS/TSX/CSS para facilitar manutenção dos estilos.
- Mantida a composição de login/cadastro mobile como painel de tela inteira arredondado, com conteúdo e ordem dos campos alinhados ao frame compartilhado.

## Falta

- Confirmar no Figma original os nomes dos frames, a tipografia, medidas e interações; o link segue inacessível.
- Carregar localmente a fonte, que ainda depende do Google Fonts.
- Refinar o layout nos viewports tablet e páginas internas; esta revisão visual foi focada nas telas iniciais desktop/mobile.
- Implementar a integração REST/MSW e comportamentos de catálogo/carrinho; autenticação, checkout, tempo real e cenários avançados seguem pendentes.
- Configurar e executar Playwright, Lighthouse, documentação completa e deploy.

## Problemas e dúvidas

- A ferramenta de navegação retornou que o URL do Figma não é acessível. `designFigma.png` contém uma montagem de frames; foi possível extrair retratos da página desktop, mas não assets-fonte independentes.
- Home conferida por capturas da versão de produção em 390×844 e 1440×1000, incluindo captura completa desktop. Build e TypeScript passaram. Não houve teste funcional de interações.
- A instalação npm reportou 29 vulnerabilidades no conjunto resolvido (19 moderadas e 10 altas). Nenhuma correção automática foi aplicada; revisar dependências antes da entrega.
- As artes locais são recortes dos retratos embutidos na captura de design, não os arquivos-fonte originais. A fonte ainda é carregada de serviço externo.
- A comparação com a referência apontou que login e cadastro eram páginas isoladas, ocultando o início. Corrigido para overlay com o mercado preservado ao fundo.
- As imagens de referência fornecem uma captura visual, não os componentes ou os arquivos-fonte do Figma; recortes de tela podem incluir pequenas variações de borda/escala.
- O repositório não possui arquivos de teste Playwright nem configuração ESLint. Os scripts declarados ainda precisam de configuração/execução antes da entrega.
- O README não fixa nomes de rotas, ferramenta de build, biblioteca de validação/precisão decimal, estratégia concreta de hospedagem, nem divisão do perfil/carteiras em páginas ou abas. São decisões de implementação, respeitando os requisitos funcionais.
- O README exige `@mswjs/socket.io-binding` como exemplo de integração compatível, não como dependência nominal obrigatória; o requisito obrigatório é simular eventos via MSW com transporte compatível e exercitar `socket.io-client`.
- O prazo de dois dias é uma restrição de planejamento, não uma alteração do escopo oficial. O conjunto completo pode excedê-lo; consultar a seção de priorização em `PLANO.md`.

## Decisões técnicas propostas (ainda não implementadas)

- Organização por domínios `catalog`, `cart`, `checkout`, `account` e `wallets`, com infraestrutura compartilhada para API, UI, validação e tempo real.
- TanStack Router para estado de URL/guards; TanStack Query para estado remoto e isolamento; Axios para REST; MSW como origem dos dados simulados; Socket.IO real no cliente para eventos.
- Valores ETH transportados como strings decimais, quantidades inteiras e aritmética decimal sem conversão para ponto flutuante binário.
- Mutations de pedido com idempotência e recibo baseado em snapshot; cache privado e listeners removidos ao encerrar/mudar sessão.
- Retry limitado a leituras transitórias e sem repetição cega de mutations; cancelar/descartar consultas obsoletas; revisar política durante a implementação e documentá-la em `ARCHITECTURE.md`.

## Histórico

- 2026-10-27: leitura integral do `README.md`; tentativa de abrir o Figma sem sucesso; criação do plano e deste registro. Sem alterações de implementação.
- 2026-10-27: inspeção de `docs/designFigma.png`; atualização de páginas/componentes e descrição visual em `PLANO.md`. Sem alterações de implementação.
- 2026-10-27: após aprovação, criada estrutura visual React + TypeScript e páginas/layouts iniciais; instaladas dependências; `npm run build` e `npm run typecheck` passaram. Sem autenticação, compra, API ou tempo real funcionais.
- 2026-10-27: revisão do frame mobile de autenticação e refatoração do conteúdo/layout: painel arredondado de tela inteira e formulário sem cartão interno.
- 2026-10-27: auditoria visual de catálogo, detalhes, carrinho, resumo, imagens, estados e breakpoints; troca de fotos externas por retratos vetoriais temporários, ajustes de densidade/grades, 404 de NFT e formatação de código. Build/tipos e execução dos comandos de qualidade a registrar abaixo.
- 2026-10-27: comparação das telas iniciais com as imagens mais recentes; refatorada composição desktop/mobile, extraídos quatro retratos da montagem de design, ajustados textos e dados demonstrativos; capturas desktop/mobile revisadas; `npm run build` e `npm run typecheck` passaram.
- 2026-10-27: correções finais solicitadas no cabeçalho, botão Explorar e separação do copyright no rodapé; captura desktop completa revisada; build e TypeScript passaram.

## Revisao do detalhe do NFT — 2026-10-27

- O divisor do cabeçalho agora ocupa somente a largura interna entre KURIO e Entrar.
- Removidos os corações dos cards de catálogo, ausentes no design. O botão Favoritar permanece no detalhe porque o README o exige; seu estado ainda é local e não persiste na conta.
- Detalhe recomposto para desktop e mobile com galeria, avaliação, preço, edições, metadados, quantidade e ações de compra. A descrição e a coleção relacionada aparecem no desktop conforme a referência.
- `npm run build` passou. Capturas em 1280×1000 e 390×844 foram inspecionadas visualmente. Os controles não estão conectados a carrinho, API ou persistência.

- Segunda revisão de fidelidade do detalhe baseada nas capturas mais recentes: proporções das colunas desktop, posição da área de detalhes, cinco estrelas, edição, quantidade e ações alinhadas em linha; no mobile, imagem em largura cheia, texto com quebra igual à referência e barra de compra com larguras e posições conferidas.
- A galeria relacionada foi ordenada conforme a captura (Cosmic Bloom, Violet Nomad, Ivory Baron, Golden Beat e Golden Signal), sem controles de curtir nos cards.
- Capturas conferidas em 1442×2252 e 414×950; `npm run build` e `git diff --check` passaram. Compra, compartilhamento, zoom e seleção de edição seguem apenas visuais, sem integração.

- Ajustes complementares solicitados: cards da coleção relacionada agora mostram nome e preço empilhados abaixo da arte, com fonte maior; divisor do cabeçalho fica restrito à home; fundo do campo de e-mail do rodapé foi clareado. Capturas desktop da home e do detalhe foram conferidas; build e `git diff --check` passaram.

- Refinamento final: removido o fundo/borda do card atrás do nome e do preço; a moldura escura envolve somente a imagem, enquanto nome e valor ficam sobre o fundo da página. Tipografia desktop do rodapé aumentada levemente. Revisão visual e build confirmados.

- Rodapé: círculos W/C/D alinhados ao início horizontal dos títulos e entre si; copyright alterado para branco com espaçamento entre letras ampliado. Verificados por medidas no navegador e captura desktop; build e `git diff --check` passaram.

- Carrinho: layout desktop com colunas de NFT, preço, edições, total e remoção visual; resumo promocional e seção de recomendações. Mobile com quatro cartões, quantidades/preços e painel fixo inferior. Valores são demonstrativos e os controles ainda não alteram estado nem integram checkout.
pm run build e git diff --check passaram.

- Recomendações do carrinho: reutilizam o mesmo estilo da seção de NFTs relacionados no detalhe (título, espaçamento, grade e apresentação dos cards). Build passou.

- Checkout recomposto conforme referências: desktop com formulário de perfil, NFTs/resumo e opções de carteira; mobile com carteiras conectada/salva, provedores, total e confirmação fixa inferior. Conferi capturas nas larguras 1474 e 430;
pm run build passou. Formulário, carteiras e pagamento são apenas visuais e não transmitem compra.

- Autenticação: modal desktop escurecido e dimensionado com abas Entrar/Criar conta, fundo da home visível, inputs mais escuros e barra inferior laranja. Mobile ajustado para o painel e espaçamentos da referência nos breakpoints estreitos. Capturas login/cadastro desktop e mobile conferidas; build passou. Autenticação continua sem integração.

- Ajuste desktop de autenticação: modais de login/cadastro ampliados levemente (largura, campos e botões); mobile preservado. Capturas desktop revisadas e build passou.

- Autenticação: fundo e borda dos campos de login padronizados com o cadastro, inclusive no foco. Capturas desktop conferidas; build e git diff --check passaram.

- Contorno do contêiner mobile da home: aplicado filete marrom contínuo ao redor dos cantos arredondados e laterais. Conferido em captura 360×760.

- Autenticação mobile em tela cheia: removidas as margens externas e o painel agora cobre toda a viewport; estados de autofill preservam o preenchimento escuro. Captura conferida em 360×780; build e git diff --check passaram.

- Autenticação desktop: removido o texto de alternância de conta; logos do Google multicolorido e Facebook azul. O link permanece no mobile. Captura desktop e build conferidos.

- Carteiras da conta: formulário da carteira principal, campos de rede/ENS, carteira secundária e navegação lateral alinhados à referência desktop. Mobile empilha os campos e mantém navegação horizontal. Capturas desktop/mobile e build conferidos; ações de salvar/adicionar permanecem visuais.

- Modal desktop de login/cadastro ampliado novamente: largura 370px, campos e botões maiores e altura aumentada para ambas as telas. Capturas desktop revisadas; mobile preservado; build passou.

- Modal desktop de login/cadastro ampliado novamente para largura de até 390px, com maior altura e controles. Posição ajustada para o centro vertical em 49% da viewport, ligeiramente acima do meio. Mobile preservado. Capturas desktop conferidas; build e git diff --check passaram.

## Auditoria de conformidade com o desafio — 2026-10-28

Escala: **concluído** = evidência suficiente de funcionamento; **parcial** = há fundação ou parte do fluxo, mas faltam requisitos essenciais; **ausente** = não há implementação identificável; **não verificado** = depende de ambiente/evidência ausente do repositório. Uma rota, botão ou dependência isolada não comprova funcionamento.

| Requisito | Estado atual | Evidência no código/testes | Arquivos envolvidos | Próxima ação necessária | Prioridade |
|---|---|---|---|---|---|
| Catálogo: dados e navegação para detalhe | Parcial | Grade lê array local e cards navegam ao detalhe; catálogo fixo em slice. | src/features/catalog/HomePage.tsx; src/components/nft/NftCard.tsx; src/data/nfts.ts | Buscar dados por API simulada e suportar estados de consulta. | P1 |
| Busca | Ausente | Campo existe sem estado, evento ou consulta. | src/features/catalog/HomePage.tsx | Sincronizar busca com URL e API, preservando refresh/histórico. | P1 |
| Filtros combináveis | Ausente | Botões de coleção/rede/preço não alteram dados ou estado. | src/features/catalog/HomePage.tsx | Implementar filtros combináveis na URL/API e reiniciar página ao alterar. | P1 |
| Ordenação | Ausente | Controle é botão estático. | src/features/catalog/HomePage.tsx | Adicionar opções de ordenação sincronizadas com URL/API. | P1 |
| Paginação e histórico | Ausente | Botões não têm handlers; lista não muda. | src/features/catalog/HomePage.tsx | Implementar paginação real, URL e navegação voltar/avançar. | P1 |
| Detalhe, acesso direto e item inexistente | Parcial | Rota procura em array local e mostra mensagem se ID não existir; sem consulta/API/loading/erro. | src/app/router.tsx; src/features/catalog/NftPage.tsx; src/data/nfts.ts | Consultar API e validar acesso direto, refresh, falha e 404. | P1 |
| Edição, estoque e limite no detalhe | Ausente | Chips são estáticos; quantidade tem teto fixo 10 não ligado à disponibilidade. | src/features/catalog/NftPage.tsx | Modelar edição/estoque pela API e validar limites. | P1 |
| Favoritos por usuário | Ausente | Alternância de coração é estado local; não persiste nem identifica usuário. | src/features/catalog/NftPage.tsx | Persistir via API por sessão; implementar isolamento e rollback otimista. | P1 |
| Inclusão no carrinho a partir do detalhe | Ausente | Ações apenas navegam para /cart sem transmitir item/quantidade. | src/features/catalog/NftPage.tsx | Fazer mutation de inclusão ligada à disponibilidade. | P1 |
| Carrinho: dados e persistência | Ausente | Itens/quantidades são constantes; desktop/mobile exibem listas diferentes. | src/features/cart/CartPage.tsx | Buscar e persistir carrinho; mesclar itens de visitante após autenticação. | P1 |
| Carrinho: quantidade e remoção | Ausente | Botões não têm handlers. | src/features/cart/CartPage.tsx | Implementar operações, limites de estoque e feedback de falha. | P1 |
| Cupons e resumo de valores | Ausente | Campos Aplicar não fazem ação; subtotais/taxas são textos fixos e divergem entre layouts. | src/features/cart/CartPage.tsx; src/features/checkout/CheckoutPage.tsx | Integrar cotação/cupom pela API e manter total coerente. | P1 |
| Precisão monetária ETH | Ausente | Subtotal usa Number/toFixed e valores são mockados no JSX, não strings decimais da API. | src/features/cart/CartPage.tsx; src/features/checkout/CheckoutPage.tsx | Usar strings decimais e aritmética de precisão adequada conforme resposta da cotação. | P1 |
| Checkout: formulário/validação/revisão | Ausente | Campos são visuais, sem regras, erros ou envio. | src/features/checkout/CheckoutPage.tsx | Validar dados, exibir erros e permitir revisão antes de enviar. | P1 |
| Carteiras/rede e conexão simulada | Ausente | Provedores são estáticos, seleção não controla estado e não há conexão/recusa/desconexão. | src/features/checkout/CheckoutPage.tsx; src/features/account/AccountPage.tsx | Carregar carteiras e simular conexão, rede e falhas. | P1 |
| Criação idempotente do pedido | Ausente | Confirmar compra é botão sem submit/handler; não existe serviço de pedidos. | src/features/checkout/CheckoutPage.tsx | Criar pedido simulado com revalidação, idempotência e estados recuperáveis. | P0 |
| Confirmação/recibo condicionado ao pedido | Ausente | Rota ignora orderId; referência, itens, taxas e total são hardcoded. | src/app/router.tsx; src/features/orders/ConfirmationPage.tsx | Exibir snapshot somente para pedido efetivamente confirmado. | P0 |
| Login/cadastro, validação e conflito | Ausente | Form sem onSubmit; botões principais type=button; login social/recuperação não executam ação. | src/features/auth/AuthPage.tsx | Implementar API simulada, validação, conflito e retorno ao fluxo anterior. | P0 |
| Sessão, refresh, expiração, logout e guards | Ausente | Não há sessão nem rotas protegidas; Sair só navega para início. | src/app/router.tsx; src/components/layout/AppShell.tsx | Recuperar sessão, proteger fluxos, preservar retomada e limpar dados privados. | P0 |
| Perfil/avatar/senha | Ausente | Valores iniciais são fixos; salvar/avatar não têm handler nem validação. | src/features/account/AccountPage.tsx | Integrar consulta/edição, avatar e senha com persistência e erros. | P1 |
| Carteiras: cadastro/edição | Ausente | Adicionar/Salvar são controles sem ação; dados não persistem nem alimentam checkout. | src/features/account/AccountPage.tsx | Implementar CRUD simulado, validação e compartilhamento com checkout. | P1 |
| Histórico e detalhes de pedidos | Ausente | Sem rota/lista; link Atividade é âncora sem conteúdo. | src/app/router.tsx; src/features/account/AccountPage.tsx | Criar histórico protegido e detalhe/recibo por identificador. | P2 |
| React + TypeScript | Concluído | React/TS estruturam a aplicação; typecheck passou. | src/main.tsx; src/ | Manter os contratos tipados durante integrações. | — |
| TanStack Router | Parcial | Provider e rotas existem; faltam search params funcionais e guards. | src/app/router.tsx | Adicionar parâmetros tipados, acesso direto e proteção de rotas. | P1 |
| TanStack Query | Parcial | QueryClientProvider configurado; não há useQuery/useMutation nem sincronização de cache. | src/main.tsx; package.json | Usar Query para consulta/mutation, chaves por usuário, cancelamento/invalidação. | P0 |
| Axios e REST | Ausente | Axios instalado sem importação/instância; não há endpoint nem camada de serviços. | package.json; src/ | Definir contratos e recursos do enunciado; rotear chamadas REST pelo Axios. | P0 |
| MSW, fixtures, persistência e reset | Ausente | MSW instalado, mas não há handlers/worker/server/cenários; array local é a origem dos dados. | package.json; src/data/nfts.ts; src/ | Criar mocks consistentes, persistência e reset determinístico para demo/testes. | P0 |
| Socket.IO cliente/servidor e mock de eventos | Ausente | socket.io-client instalado sem io(), servidor/mock compatível, eventos ou subscriptions. | package.json; src/ | Implementar transporte MSW compatível e exercitar o cliente Socket.IO. | P0 |
| Eventos NFT/pedido, reconexão e isolamento | Ausente | Não há nft.updated/order.updated, versão, deduplicação, reconciliação ou limpeza. | src/ | Atualizar catálogo/detalhe/carrinho/checkout; testar reconexão e isolamento por sessão. | P0 |
| Estados loading/skeleton shimmer | Ausente | Nenhuma consulta remota ou implementação skeleton identificada. | src/features/; src/components/ | Implementar skeletons para catálogo/detalhe/resumo, preservando dimensões e reduced motion. | P1 |
| Estados vazio/erro/sucesso/retry | Parcial | Há 404 estático; não há estados de API nem feedback/retry para mutations. | src/components/feedback/NotFoundPage.tsx; src/features/ | Cobrir estados e recuperação de todas as operações/consultas. | P1 |
| Tailwind e shadcn/ui | Parcial | Tailwind está instalado/configurado/importado, mas o layout é majoritariamente CSS manual. Há Radix Dialog/Slot e botão próprio CVA; não há conjunto shadcn/ui estabelecido. | package.json; vite.config.ts; src/styles.css; src/components/ui/Button.tsx | Usar/adaptar efetivamente os padrões exigidos sem comprometer a identidade visual. | P2 |
| Responsividade 390/768/1440 | Parcial | CSS e layouts desktop/mobile existem; não há evidência de revisão de todas as rotas nos três viewports, sobretudo perfil/carteiras/recibo. | src/styles.css; src/features/ | Validar e registrar cada tela nos viewports oficiais. | P1 |
| Acessibilidade | Parcial | Alguns labels/aria e Dialog Radix existem; erros, foco, teclado, contraste/zoom não têm testes/evidências completos. | src/components/; src/features/; src/styles.css | Auditar teclado/foco/semântica/contraste/reduced motion e testar. | P1 |
| Playwright E2E/regressão visual | Ausente | Pacote/scripts instalados, mas npm run test:e2e responde “No tests found”; sem config, testes, baselines ou traces. | package.json; configuração/testes ausentes | Configurar Chromium desktop/mobile e cobrir os 12 grupos oficiais, screenshots e relatórios. | P0 |
| Lighthouse | Ausente | CLI/script instalados; sem configuração, relatórios ou medições. | package.json; configuração/relatórios ausentes | Rodar 3 medições por página/perfil, reportar medianas, LCP/CLS/TBT e causas. | P1 |
| Lint e qualidade reproduzível | Parcial | npm run lint falha por ausência de eslint.config.*; build e typecheck passaram nesta auditoria. | package.json; configuração ESLint ausente | Adicionar config e validar comandos em checkout limpo. | P1 |
| Documentação técnica da solução | Ausente | docs/README.md contém o enunciado; não encontrei README de solução nem ARCHITECTURE.md com contratos/políticas. | raiz; docs/ | Documentar setup/env/credenciais/reset, contratos, sessão, cache e eventos. | P1 |
| README raiz e estado Git | Parcial | git status registra D README.md; o enunciado segue em docs/README.md. | README.md; docs/README.md | Entregar README da solução sem perder o enunciado; revisar a exclusão registrada. | P1 |
| Deploy e refresh público | Não verificado | Não encontrei URL ou configuração de publicação no inventário local; ambiente externo não foi verificado. | raiz/configuração de deploy ausente | Publicar demo e validar URL, mocks, acesso direto e refresh. | P1 |
| Critérios eliminatórios (stack, fluxos, isolamento, E2E) | Ausente | Query só tem provider; Axios/MSW/Socket não são usados; fluxos de compra/auth são visuais; recibo aparece sem pedido; sem testes executáveis. | src/main.tsx; src/app/router.tsx; src/features/; package.json | Resolver itens P0 e comprová-los por E2E atravessando UI, API mock e cliente socket. | P0 |

### Verificações realizadas nesta auditoria

- npm run typecheck: passou.
- npm run build: passou.
- npm run lint: falhou porque ESLint 9 não encontra arquivo eslint.config.js/.mjs/.cjs.
- npm run test:e2e: falhou com “No tests found”.
- npm ls --depth=0 confirma dependências instaladas; a inspeção do código mostra que várias não são usadas.
- Não foi feita validação funcional em navegador. A ausência das integrações e dos testes foi confirmada pela inspeção do repositório.

### Plano de execução ordenado

1. **P0 — Fluxos eliminatórios:** contratos tipados, Axios, API/MSW determinística, sessão/autenticação/guards, Query, carrinho persistente, cotação/cupons com precisão, checkout revalidado/idempotente e recibo só após pedido confirmado.
2. **P0 — Tempo real e isolamento:** Socket.IO exercitado pelo cliente via transporte mock compatível; eventos versionados de NFT/pedido, reconexão/reconciliação e cenários de dois usuários, mudança de estoque/preço e desconexão.
3. **P0 — E2E:** configurar Playwright e primeiro demonstrar catálogo, conta, favoritos, carrinho/cupom, compra/recibo, falhas/idempotência e eventos; completar os 12 grupos oficiais.
4. **P1 — Conta e resiliência de interface:** perfil/avatar/senha, carteiras, loading/skeleton, vazio/erro/sucesso/retry, responsividade nos três viewports e acessibilidade.
5. **P1 — Entrega:** corrigir lint, README da solução, ARCHITECTURE.md, cenários/reset reproduzíveis, checkout limpo e deploy acessível com refresh das rotas.
6. **P1/P2 — Evidências e refinamento:** regressão visual e Lighthouse conforme o protocolo do desafio; então corrigir problemas medidos. Melhorias cosméticas de baixo impacto ficam depois dos fluxos obrigatórios.


## Camada Axios, REST simulada e TanStack Query — 2026-10-28

- Centralizado o Axios em src/api/client.ts, com base /api configurável por VITE_API_BASE_URL, timeout, token bearer, identidade de visitante e erros normalizados como ApiError. Requisições canceladas preservam o cancelamento.
- Criados contratos compartilhados em src/domain/types.ts; src/data/nfts.ts continua sendo a fixture visual e também alimenta o mock, sem uma segunda definição da entidade NFT.
- Criados serviços tipados para catálogo/coleções, conta/sessão, perfil/avatar/senha, favoritos, carrinho/cupons/cotações, carteiras e pedidos em src/api/resources.ts.
- Criados hooks TanStack Query em src/api/hooks.ts, com chaves privadas separadas por usuário, cache/invalidação para mutations e atualização otimista com rollback de favoritos. As páginas existentes ainda não foram migradas para os hooks.
- Criado banco MSW compartilhado e persistente no armazenamento local do navegador quando disponível, com reset determinístico, dois usuários, hashes de senha, carrinho de visitante mesclado no login, favoritos isolados, cupons, carteiras, cotações e pedidos idempotentes com snapshot. Cálculos ETH usam inteiros de 18 casas decimais.
- Registrados handlers REST em src/mocks/handlers.ts para recursos do escopo. Cenários pelo cabeçalho X-Mock-Scenario: latência, falha de rede, HTTP 503, sessão expirada, pagamento recusado, pedido pendente e timeout após criação recuperável por idempotência.
- O worker public/mockServiceWorker.js é iniciado antes do React. MSW fica ligado por padrão; VITE_ENABLE_MOCKS=false o desliga. Contratos, endpoints, credenciais fictícias e cenários estão em docs/API.md.
- Criada camada de testes MSW Node e Playwright no browser. npm run test:api: 12 passaram. npm run test:mock-browser: 2 passaram, incluindo interceptação REST real pelo worker e persistência do carrinho após refresh.
- npm run typecheck, npm run build e git diff --check passaram.

### Arquivos criados/modificados nesta etapa

- Criados: src/domain/types.ts, src/api/client.ts, src/api/resources.ts, src/api/hooks.ts, src/mocks/database.ts, src/mocks/handlers.ts, src/mocks/browser.ts, src/mocks/server.ts, src/vite-env.d.ts, src/lib/ether.ts, public/mockServiceWorker.js, tests/api/marketplace.api.spec.ts, tests/browser/msw.browser.spec.ts, playwright.config.ts, playwright.browser.config.ts, playwright.e2e.config.ts e docs/API.md.
- Modificados: src/data/nfts.ts, src/main.tsx, package.json e este registro de progresso.

### Limites e pendências preservados

- As páginas do catálogo, detalhe, login, perfil, carteiras, carrinho, checkout e confirmação ainda mostram os dados/controles anteriores e não consomem esses serviços/hooks. Não afirmar integração funcional de interface nesta etapa.
- Hooks compilam, mas ainda não têm testes de componente que cubram cache/invalidação/rollback. Testes atuais exercitam serviços/handlers e o worker no browser.
- Não foi implementado servidor Socket.IO, transporte de eventos por MSW ou sincronização em tempo real.
- Não foram criados testes E2E de fluxos de usuário; npm run test:e2e continua pendente até existir a suíte de interface. Os 11 testes API não substituem os 12 grupos E2E oficiais.
- ESLint segue sem configuração (npm run lint falha conforme a auditoria anterior). A tentativa de inicialização por CLI do worker exibiu prompt interativo após copiar o worker; o arquivo foi gerado e sua interceptação foi validada pelo teste de navegador.
- A execução do teste em navegador reporta falha de rede para a fonte existente de Google Fonts neste ambiente sem acesso externo; os testes REST e o build passam. A fonte ainda precisa estar disponível localmente para execução offline.

## Integração do catálogo, detalhe, favoritos e carrinho — 2026-10-28

| Funcionalidade | Estado | Evidência / arquivos | Pendência |
|---|---|---|---|
| Catálogo pela API | Funcional | `src/features/catalog/HomePage.tsx` chama `useNfts` para a listagem paginada e para os destaques. | Destaques e promoções editoriais ainda usam conteúdo demonstrativo como fallback. |
| Busca, categoria, rede, faixa de preço, ordenação e página | Funcional | Parâmetros serializados na rota `/`, atualizam `useNfts`, reiniciam a página ao mudar filtro e sobrevivem à navegação/URL. Faixa de preço enviada como decimal; o mock usa precisão ETH. | A faixa visual usa controles range nativos sobre centésimos de ETH; refinamento visual não foi feito nesta etapa. |
| Loading, erro, retry e vazio do catálogo | Funcional | Skeletons, estado `role=alert` com retry e estado vazio com limpeza de filtros em `HomePage.tsx`. | Nenhuma pendência funcional conhecida. |
| Detalhe por ID, loading, erro e 404 | Funcional | `src/features/catalog/NftPage.tsx` consulta `useNft`; teste browser acessa NFT e ID inexistente. | Revisão visual manual em desktop/mobile recomendada. |
| Itens relacionados | Funcional | `useNfts` carrega a mesma categoria e exclui o NFT atual; loading/erro/vazio tratados. | O contrato não oferece endpoint de coleção individual; relação feita pela categoria disponível. |
| Favoritos autenticados | Funcional com autenticação simulada | `useFavorites` e `useToggleFavorite` sincronizam os dois controles; mutation usa otimização/rollback. Sem sessão, navega para `/login`. Teste browser adiciona/remove usando sessão da API. | O formulário visual de login/cadastro ainda não chama `useLogin`/`useRegister`; a sessão precisa ser criada pela API. |
| Adicionar ao carrinho pelo detalhe | Funcional pela API | `useAddCartItem`, quantidade limitada por estoque, erro exibido sem navegação e sucesso direciona para `/cart`. Teste browser confere item/quantidade no endpoint com identidade visitante. | A página `/cart` permanece estática e não apresenta os itens criados pela mutation. |

### Arquivos desta etapa

- Modificados: `src/api/hooks.ts`, `src/features/catalog/HomePage.tsx`, `src/features/catalog/NftPage.tsx`, `src/styles.css`, `tests/api/marketplace.api.spec.ts`, `tests/browser/msw.browser.spec.ts` e este documento. A validação de busca do router já existia e foi aproveitada.
- Testes API adicionados para busca, filtros combinados, preço, ordenação, paginação e lista vazia.
- Testes browser adicionados para busca/URL, filtros combinados, detalhe/404, favoritos autenticados e inclusão/quantidade no carrinho.

### Verificações executadas

- `npm run typecheck`: passou.
- `npm run build`: passou. Vite alerta que o bundle principal excede 500 kB após minificação.
- `npm run test:api`: 14 testes passaram.
- `npm run test:mock-browser`: sete casos passaram, incluindo dois testes REST existentes e cinco cenários de interface. O Playwright deixou o processo Vite da porta 5187 ativo após imprimir resultados; ele foi encerrado pelo PID que estava escutando exclusivamente essa porta antes de novas execuções.
- Uma execução inicial de testes de busca/filtros falhou por campo oculto no viewport desktop e por regex da query string; os testes foram corrigidos e reexecutados com sucesso. A verificação de carrinho passou a enviar `X-Guest-Id`, como faz o Axios.

### Limites atuais

- Busca e filtros leem/escrevem estado na URL. Modal ou painel avançado de filtros não foi criado nesta tarefa.
- Formulários de autenticação não estão conectados; favoritos exigem sessão criada pela API simulada.
- O carrinho recebe e persiste o item no mock, mas a tela ainda não consome os hooks. Checkout completo e Socket.IO continuam fora desta etapa.

## Autenticação, perfil e carrinho conectados — 2026-10-28

| Requisito | Estado | Evidência | Próxima ação |
|---|---|---|---|
| Login/cadastro com API, validação e erros | Funcional | `AuthPage.tsx` usa `useLogin`/`useRegister`, valida campos, mostra estado pendente, erros do servidor e confirmação divergente. | Login Google/Facebook e recuperação de senha seguem explicitamente indisponíveis. |
| Sessão persistente e recuperação | Funcional | Axios persiste token/usuário; `useSession` recupera sessão pelo endpoint; teste browser recarrega após cadastro/login. | Expiração real depende dos cenários simulados; expirado/401 é limpo e guard envia à autenticação. |
| Logout e isolamento | Funcional | Botão Sair usa `useLogout`, remove queries privadas e zera query de sessão; testes API alternam Alex/Sam e verificam carrinhos isolados. | Nenhuma pendência conhecida nesta etapa. |
| Proteção de rotas | Funcional | `beforeLoad` verifica sessão em perfil, carteiras, checkout e confirmação; preserva destino após login para rotas suportadas. | Checkout continua visual e não cria pedidos nesta etapa. |
| Perfil | Funcional parcialmente | `AccountPage.tsx` carrega/salva perfil e troca senha via hooks; logout operacional. | Foto de perfil continua visual e indisponível nesta etapa; CRUD de carteiras permanece fora do escopo. |
| Carrinho API | Funcional | `CartPage.tsx` consome `useCart`, mostra resposta real, altera quantidades e remove itens; estados vazio/loading/erro e retry. | A etapa não integra pedido/checkout. |
| Cupons e cotação para visitante | Funcional | Handlers validam `KURIO10`, inválido e expirado; remoção atualiza carrinho; quote retorna valores precisos para visitante e autenticado. | Criação de pedido segue restrita à conta autenticada. |
| Valores, estoque e preço atualizado | Funcional | Totais usam resposta de `useCheckoutQuote`; linha usa `multiplyEther`; requisições de cart/quote são atualizadas ao abrir página. API rejeita quantidade acima do estoque e cotação detecta indisponibilidade. | Sem WebSocket; mudanças externas são percebidas ao atualizar/abrir novamente. |
| Identidade no header | Funcional | `AppShell.tsx` mostra acesso à conta/sessão e quantidade real no carrinho. | Nenhuma pendência conhecida nesta etapa. |

### Arquivos alterados nesta etapa

- `src/features/auth/AuthPage.tsx`, `src/features/account/AccountPage.tsx`, `src/features/cart/CartPage.tsx`, `src/components/layout/AppShell.tsx`, `src/app/router.tsx`, `src/api/hooks.ts`, `src/mocks/database.ts`, `src/mocks/handlers.ts`, `src/styles.css`, `tests/api/marketplace.api.spec.ts`, `tests/browser/msw.browser.spec.ts`, `docs/API.md` e este progresso.
- A cotação guest usa o mesmo contrato REST com escopo do `X-Guest-Id`; pedidos continuam associados a uma conta e não podem usar quote de visitante. Login mantém a mesclagem de carrinho já implementada.

### Testes executados

- `npm run typecheck`: passou após os ajustes de sessão e navegação.
- `npm run test:api`: 18 testes passaram antes do acréscimo final do teste de falhas para autenticação/carrinho; essa suíte será repetida antes de concluir.
- `npm run test:mock-browser`: suíte com 10 testes; os cinco cenários anteriores passaram. Os novos testes de cadastro e carrinho passaram após corrigir seletores, e o teste de login/guard/logout passou após sincronizar explicitamente a query de sessão no logout. A suíte completa será repetida antes de concluir.
- `npm run build` e verificações finais serão registradas com o resultado desta etapa.

### Limites

- Login social/recuperação, upload de avatar, CRUD de carteiras, checkout/pedido e servidor Socket.IO não foram implementados nesta etapa.
- Mudanças de preço/estoque não são em tempo real: a página consulta valores atuais ao abrir e a cotação também valida preço/estoque no mock.

### Resultado final da validação — 2026-10-28

- `npm run typecheck`: passou.
- `npm run build`: passou. Aviso não bloqueante: bundle principal de aproximadamente 539 kB excede o limite recomendado de 500 kB.
- `npm run test:api`: 19 passaram, incluindo credenciais, cadastro inválido, sessão/logout, isolamento de carrinhos, cotação de visitante, cupom, remoção e falhas HTTP/rede.
- `npm run test:mock-browser`: 10 passaram. Inclui interceptação/persistência REST, catálogo/detalhes/favoritos anteriores, fluxo de login com credenciais inválidas e válidas, rota protegida, perfil, logout, cadastro com confirmação e carrinho com vazio/quantidade/cupom/cotação/remoção.
- `git diff --check`: passou.

## Auditoria final de E2E e requisitos do desafio — 2026-10-28

Esta seção atualiza os apontamentos anteriores. Os resultados abaixo foram reexecutados nesta etapa; não usar contagens de validações antigas acima como resultado atual.

### Auditoria das suítes e isolamento

| Grupo sem dupla contagem | Casos | O que exercita | Preparação e dependências |
| --- | ---: | --- | --- |
| Playwright browser, interação de UI | 13 | 11 casos em `tests/browser/msw.browser.spec.ts` e 2 em `tests/browser/realtime.browser.spec.ts`; fluxo visual por Chromium | MSW inicia em `src/main.tsx`; contexto novo por teste; dados de conta/carrinho isolados no storage do contexto; sidecar local de Socket.IO |
| Playwright browser, smoke de rede | 2 | `fetch` direto para verificar MSW no browser e persistência REST após refresh; não são interação de UI | Worker MSW iniciado na página; sem backend externo |
| Playwright E2E adicionados nesta etapa | 6 | Ordenação/paginação/histórico, validação/login, isolamento A/B, recusa e carrinho, preço alterado, status de pedido pelo Socket.IO | `beforeEach` reinicia MSW e sidecar; cenários de falha usam `kurio.mock.scenario`; UI real em Chromium |
| API/MSW em Node | 23 | Contratos REST, erros, persistência, isolamento, idempotência e precisão ETH; sem browser | `setupServer`/reset da base antes dos casos |
| Socket.IO em Node | 7 | Transporte, reconexão, versões/duplicatas, limpeza de listener e autorização de pedidos; sem UI | Servidor local efêmero e estado resetado por cenário |

`npm run test:e2e` executa 21 casos browser no total (19 com asserções de fluxo na interface e 2 smoke tests de rede). `npm run test:mock-browser` executa os 15 casos em `tests/browser` (13 de UI + 2 de rede). Os testes não chamam serviços externos; os únicos servidores são o preview local e o sidecar Socket.IO local. As verificações aguardam estado observável; não há `waitForTimeout` na suíte browser. O sidecar é resetado em cada E2E novo; cenários de falha pausam/retomam o transporte. O Playwright é serial (`workers: 1`), mantém traces/screenshots em falhas e encerra os serviços pelo teardown global.

### Requisitos do desafio

| Requisito | Estado atual | Evidência | Arquivos envolvidos | Próxima ação | Prioridade |
| --- | --- | --- | --- | --- | --- |
| React e TypeScript | Implementado e verificado | Typecheck e build de produção passam | `src`, `package.json`, `tsconfig*.json` | Manter checagens no CI | P0 |
| Fidelidade visual ao Figma | Implementado visualmente, sem verificação suficiente | As telas foram compostas com assets locais e CSS próprio; não há baselines de regressão visual nem comparação automatizada | `src/features`, `src/styles.css`, `public` | Criar baselines para início, detalhe, carrinho e checkout nos viewports do desafio | P1 |
| TanStack Router e Query | Implementado e verificado nos fluxos cobertos | Rotas/search params e hooks de cache utilizados pela UI | `src/app/router.tsx`, `src/api/hooks.ts` | Adicionar E2E de refresh em todos os fluxos privados | P0 |
| Axios e REST tipada | Implementado e verificado | 23 testes Node API e UI MSW; erros convertidos em `ApiError` | `src/api`, `src/domain/types.ts`, `tests/api` | Nenhuma pendência central identificada | P0 |
| MSW para REST e cenários de falha | Implementado e verificado parcialmente | 23 testes API, smoke no browser, falha de pagamento e preço no E2E; reset determinístico | `src/mocks`, `src/api/client.ts`, `tests` | E2E para latência/timeout e recuperação de rede | P0 |
| Catálogo: busca, filtros combináveis, sort, paginação e histórico | Implementado e verificado parcialmente | Casos browser de busca/filtros; E2E de sort, paginação e `goBack` | `src/features/catalog/HomePage.tsx`, `tests/browser`, `tests/e2e` | Cobrir persistência via refresh e combinação completa dos filtros no mesmo fluxo | P0 |
| Detalhe, item ausente, favoritos e carrinho | Implementado e verificado parcialmente | UI cobre detalhe inexistente, compra, favorite add/remove; API verifica rollback/isolamento | `src/features/catalog/NftPage.tsx`, `src/api/hooks.ts`, `tests` | E2E de falha de mutation de favorito/rollback | P0 |
| Login, cadastro, sessão, logout e dados de usuário | Implementado e verificado parcialmente | UI cobre credenciais inválidas/válidas, cadastro com confirmação, sessão e logout; E2E verifica separação A/B | `src/features/auth/AuthPage.tsx`, `src/api/client.ts`, `tests` | E2E de sessão expirada no browser e conflito de cadastro | P0 |
| Carrinho, cupom e precisão ETH | Implementado e verificado | UI altera quantidades, remove item e cupom; API cobre cupom inválido, carrinho e aritmética decimal | `src/features/cart/CartPage.tsx`, `src/lib/ether.ts`, `tests` | Acrescentar refresh/login do carrinho como cenário browser independente | P0 |
| Checkout, pedido e recibo | Implementado e verificado parcialmente | UI confirma pedido, recusa preserva carrinho, preço alterado requer revisão; API cobre idempotência/timeout | `src/features/checkout/CheckoutPage.tsx`, `src/features/orders/ConfirmationPage.tsx`, `tests` | E2E de clique repetido, timeout-after-create e retomada pela chave idempotente | P0 |
| Socket.IO | Implementado e verificado parcialmente | 7 testes de protocolo e UI testa preço/catálogo, indisponibilidade e status pendente de pedido | `server/realtime`, `src/realtime`, `tests/realtime`, `tests/browser`, `tests/e2e` | E2E de preço/estoque durante checkout e queda/reconexão de pedido pendente | P0 |
| Eventos simulados por MSW com binding Socket.IO | Parcial | MSW reconcilia snapshots REST; Socket.IO roda em servidor local separado, sem `@mswjs/socket.io-binding` | `server/realtime`, `src/mocks/handlers.ts`, `docs/API.md` | Confirmar aceitabilidade da arquitetura ou implementar binding exigido pelo enunciado | P0 |
| Tailwind CSS | Parcial | Vite plugin e `@import 'tailwindcss'` existem; a maior parte do design usa CSS próprio e não utilitários Tailwind | `vite.config.ts`, `src/styles.css` | Usar Tailwind de forma efetiva sem substituir estilos Figma | P1 |
| shadcn/ui | Não implementado | Componentes próprios e Radix Dialog/Select; não há componentes shadcn no projeto | `src/components/ui`, `package.json` | Adotar componentes shadcn necessários, adaptando tokens visuais | P1 |
| Playwright E2E | Implementado e verificado parcialmente | `npm run test:e2e`: 21/21; 19 cenários interagem com UI e 2 são smoke de rede | `playwright.e2e.config.ts`, `tests/browser`, `tests/e2e` | Completar grupos pendentes abaixo e criar baselines visuais versionadas | P0 |
| Acessibilidade | Parcial, sem auditoria suficiente | Labels, roles, teclado inerente ao HTML/Radix; nenhum axe/Lighthouse ou varredura abrangente executada | `src/features`, `src/components`, `tests` | Testes dedicados de foco/teclado, contraste, zoom e auditoria automatizada | P1 |
| Responsividade desktop/tablet/mobile | Parcial, sem cobertura em todos os tamanhos exigidos | Um checkout mobile 390px; ausência de matriz 390/768/1440 em todos fluxos | `src/styles.css`, `tests/browser` | Adicionar validação visual e overflow nos viewports 390, 768 e 1440 | P1 |
| Lighthouse e performance | Não verificado; requisito pendente | Dependência e script genérico existem, mas não há configuração, relatórios, 3 medições ou medianas; bundle app ~594 kB minificado | `package.json`, build Vite | Configurar execução home/detalhe desktop/mobile, três repetições, reportar medianas e otimizar bundle se necessário | P1 |
| README de entrega, arquitetura e deploy público | Não implementado/verificado | Há desafio em `docs/README.md` e contrato em `docs/API.md`; `README.md` de solução e `ARCHITECTURE.md` não estão presentes; nenhuma URL pública/documentada | `docs/README.md`, `docs/API.md`, arquivos raiz | Criar instruções de setup/arquitetura e publicar versão de avaliação | P0 |
| Carteiras, avatar e senha | Parcial | APIs/contratos cobrem partes; UI de avatar e gerenciamento completo de carteiras não foi validada E2E | `src/features/account/AccountPage.tsx`, `src/mocks`, `tests` | Verificar salvar/adicionar/editar carteiras, validação de senha e estado do avatar | P1 |
| Pagamento real, blockchain e conexão real de carteira | Fora do escopo | Desafio exclui gateway, extensão e transação blockchain; interface identifica simulação | `docs/README.md`, checkout, confirmação | Manter comunicação explícita de simulação | — |

### Falhas encontradas e correções desta etapa

- `test:e2e` antes apontava para `tests/e2e` vazio, não iniciava servidores e não fazia build. Agora executa os 15 casos de browser mais os seis E2E de fluxo, com os mesmos servidores locais, Chromium, relatórios e teardown.
- O teste anterior desligava Socket.IO antes dos demais cenários e a suite dependia da ordem. Foi substituído por pausa/retomada administrativa e `afterEach`; o encerramento ocorre no teardown global.
- O teste de preço alterado revelou que a API rejeitava o pedido corretamente, mas o resumo não atualizava a cotação após esse conflito. Checkout agora refaz a cotação em conflito de preço, estoque ou validade.
- Ajustados seletores duplicados e esperas de autenticação para observar o estado autenticado antes de seguir o cenário.

### Validação atual

- `npm run typecheck`: passou (a etapa de build também executou `tsc -b`).
- `npm run build`: passou; o Vite ainda alerta que o bundle principal tem aproximadamente 593,72 kB minificado (>500 kB).
- `npm run test:api`: 23/23 passaram.
- `npm run test:realtime`: 7/7 passaram.
- `npm run test:mock-browser`: 15/15 passaram.
- `npm run test:e2e`: 21/21 passaram (19 UI, 2 smoke de rede).
- `git diff --check`: passou após o fechamento documental.

### Pendências E2E que impedem considerar todos os critérios verificados

Não há regressão visual com baselines, nem varredura ampla de acessibilidade/foco. Também faltam no browser: expiração de sessão durante checkout, falha e rollback otimista de favorito, falha de rede e recuperação, timeout/idempotência por repetição, desconexão e retomada de pedido pendente, evento de preço/estoque enquanto o checkout está aberto, edição de carteira/avatar/senha e matriz completa de viewports. Os testes unitários/API cobrem partes desses comportamentos, mas isso não substitui E2E conforme o desafio.
- O Playwright não encerra sozinho o servidor Vite iniciado pelo script neste ambiente; após confirmar todos os dez casos aprovados, encerrei o processo que mantinha a porta 5187 aberta.

A validação funcional em navegador confirmou a integração entre telas, hooks e API. Permanecem fora do escopo o checkout de pedido, Socket.IO, login social/recuperação de senha, upload de avatar e CRUD de carteiras.

## Implementacao de checkout e pedidos — 2026-10-28

| Requisito | Estado | Evidencia | Arquivos | Proxima acao | Prioridade |
|---|---|---|---|---|---|
| Checkout carrega itens, cotacao e carteiras | Concluido | `CheckoutPage` usa hooks TanStack Query; exibe carregamento, falha e carrinho vazio | `src/features/checkout/CheckoutPage.tsx`, `src/api/hooks.ts` | Validar nos breakpoints desktop/mobile durante revisao visual | P1 |
| Validacao dos dados e carteira | Parcial | Nome, usuario e carteira sao exigidos; campos de perfil sao atualizados pela API | `CheckoutPage.tsx`, `src/api/hooks.ts` | Decidir se nota/referral precisam integrar contratos oficiais; hoje nao sao persistidos | P1 |
| Cotacao revalidada antes de finalizar | Concluido | Nova cotacao comparada a itens/totais visiveis; divergencia exige confirmacao posterior | `CheckoutPage.tsx`, `src/mocks/database.ts` | Adicionar sincronizacao por evento em etapa Socket.IO | P1 |
| Preco, disponibilidade e propriedade validados no pedido | Concluido | Handler verifica cotacao do usuario, estoque e preco corrente; cenarios `price-changed` e `stock-changed` | `src/mocks/handlers.ts`, `src/mocks/database.ts` | Cobrir atualizacao concorrente com Socket.IO na etapa propria | P0 |
| Criacao idempotente e snapshot do pedido | Concluido | API cria snapshot e recupera a mesma tentativa com a mesma chave; conflito para payload diferente | `src/api/resources.ts`, `src/mocks/database.ts` | Nenhuma nesta etapa | P0 |
| Carrinho removido somente apos resposta de sucesso | Concluido | Sucesso confirmado invalida cache; timeout preserva cart no primeiro erro e remove no retry recuperado | `src/api/hooks.ts`, `src/mocks/database.ts` | Exercitar na interface com falha de rede automatizada | P0 |
| Confirmacao consulta pedido real e suporta refresh | Concluido | `useOrder` por ID; estados de carregamento/erro; valores lidos do snapshot; simula status | `src/features/orders/ConfirmationPage.tsx` | Ligar atualizacao de status a evento Socket.IO depois | P0 |
| Isolamento e historico de pedidos | Concluido | APIs filtram por usuario; nova rota autenticada `/account/orders` | `src/features/account/AccountPage.tsx`, `src/app/router.tsx`, `src/mocks/database.ts` | Nenhuma nesta etapa | P1 |
| Testes de API do pedido | Concluido | Cobrem sucesso, idempotencia, timeout, preco/estoque alterados, isolamento, sessao expirada e recusa | `tests/api/marketplace.api.spec.ts` | Manter os testes ao integrar tempo real | P0 |
| Testes de browser do checkout | Concluido | Cobre pedido confirmado, refresh do recibo, historico, carrinho vazio e validacao HTML do formulario | `tests/browser/msw.browser.spec.ts` | Cobrir falha no checkout pelo navegador quando o cliente de cenarios for integrado | P0 |
| Cotacao de moeda fiduciaria | Ausente no contrato atual | `Quote` fornece subtotal, desconto, taxa e total em ETH; nao ha taxa de conversao | `src/domain/types.ts`, `src/api/resources.ts`, `docs/API.md` | Confirmar se requisito oficial pede moeda alem de ETH | P2 |
| Upload de avatar, conexao real de carteira e blockchain | Fora desta etapa | Desafio exclui integracoes reais; pagamento identificado como simulacao | Checkout e documentacao | Permanecem fora do escopo atual |

### Arquivos alterados nesta etapa

- `src/features/checkout/CheckoutPage.tsx`: API/hook integration, formulario, cotacao, carteira selecionavel, validacao, estados, bloqueio de reenvio, revalidacao e chave idempotente persistente.
- `src/features/orders/ConfirmationPage.tsx`: consulta o pedido autenticado e exibe status e recibo do snapshot sem simular transferencia real.
- `src/features/account/AccountPage.tsx`: item Atividade ligado ao historico de pedidos pela API.
- `src/app/router.tsx`: rota autenticada `/account/orders`.
- `src/mocks/database.ts` e `src/mocks/handlers.ts`: validacao de preco, cenarios de alteracao de preco/estoque e carrinho preservado em timeout ate retry idempotente.
- `src/styles.css`: estados de checkout, apresentacao do historico e feedback; estrutura visual existente preservada.
- `tests/api/marketplace.api.spec.ts` e `tests/browser/msw.browser.spec.ts`: cenarios de pedidos e integracao checkout.
- `docs/API.md`: documentacao dos fluxos de checkout/pedidos e limitacoes do contrato.

### Validacao desta etapa

Registrar abaixo os resultados finais apos executar typecheck, build, testes API, testes de browser e `git diff --check`. A infraestrutura nao inclui cotacao fiat nem persistencia de nota/codigo de indicacao; nao declarar esses pontos implementados.

### Resultados finais de validacao — 2026-10-28

- `npm run typecheck`: passou.
- `npm run build`: passou; Vite alertou que o bundle principal excede 500 kB minificado (547.27 kB), sem falha de build.
- `npm run test:api`: passou, 23 testes, incluindo falha 503 durante o checkout, sem pedido ou perda do carrinho.
- `npm run test:mock-browser`: passou, 13 testes, incluindo validacao do formulario, checkout desktop/mobile, criacao do pedido, refresh da confirmacao, historico e carrinho vazio. O servidor de desenvolvimento de teste permaneceu ativo depois dos casos; finalizei o processo da porta 5187 e o comando concluiu com codigo 0.
- `git diff --check`: passou, sem erros de whitespace.

Pendencias explicitamente mantidas: cotacao de conversao para moeda fiduciaria nao existe nos contratos; nota de colecionador e codigo de indicacao mostrados no formulario nao sao enviados nem persistidos; conexao real de carteira, blockchain e atualizacao por Socket.IO ficam fora desta etapa. A rota de historico foi adicionada ligando a entrada Atividade ja existente da conta.

## Etapa Socket.IO local (2026-10-28)

| Requisito | Estado | Evidencia | Arquivos | Proxima acao | Prioridade |
| --- | --- | --- | --- | --- | --- |
| Auditar arquitetura realtime anterior | Concluido | socket.io-client existia; nao havia servidor, listeners, contratos nem API de snapshots | `package.json`, `src/realtime`, `src/mocks` | Nenhuma | P0 |
| Contratos tipados para precos, estoque e status de pedido | Concluido | `NftMarketUpdate` e `OrderUpdatedEvent` incluem identidade, versao e sequencia | `src/domain/types.ts`, `src/realtime/contracts.ts` | Acrescentar novos eventos somente quando previstos pelo desafio | P0 |
| Servidor Socket.IO separado | Concluido | Servidor HTTP/Socket.IO independente, porta configuravel e cenarios administrativos locais | `server/realtime/index.ts`, `package.json` | Substituir pelo servidor real quando existir backend | P0 |
| Autorizacao de eventos privados | Parcial (simulacao local) | Servidor valida expiracao/assinatura, deriva sala do token e nao aceita selecao de userId pelo socket; testes A/B e token expirado passam | `server/realtime/index.ts`, `src/realtime/sessionToken.ts`, `tests/realtime/server.spec.ts` | Migrar validacao para segredo e sessao mantidos no backend antes de producao | P0 |
| Cliente central, reconexao e estado visivel | Concluido | Provider conecta/desconecta, reconecta automaticamente, mostra status e remove listeners no cleanup | `src/realtime/client.ts`, `src/realtime/RealtimeProvider.tsx`, `src/components/layout/AppShell.tsx` | Nenhuma para demo | P0 |
| Atualizacao de preco e disponibilidade | Concluido | Cache do catalogo, detalhe e carrinho recebe evento versionado; cache de cotacao e invalidado | `src/realtime/querySync.ts`, `tests/realtime/querySync.spec.ts` | Manter validacao autoritativa na REST | P0 |
| Atualizacao de status do pedido | Parcial | Evento privado atualiza cache; snapshots autenticados sao filtrados pelo token e propriedade conferida no MSW | `src/realtime/querySync.ts`, `src/mocks/database.ts`, `src/mocks/handlers.ts` | Integrar evento a transicao real da API quando houver backend persistente | P0 |
| Sincronizacao de snapshot para respostas REST simuladas | Concluido | Antes de catalogo/detalhe/carrinho/cotacao/pedidos, MSW tenta importar snapshots com limite de 300 ms; falha externa nao interrompe API | `src/mocks/handlers.ts`, `server/realtime/index.ts` | Considerar fila/event store persistente se a demo passar a ter multiplas instancias | P0 |
| Evento duplicado ou antigo | Concluido | Versao monotona por entidade, IDs duplicados ignorados e requisicoes em andamento canceladas antes do patch | `src/realtime/querySync.ts`, `src/mocks/database.ts`, `tests/realtime/querySync.spec.ts` | Nenhuma para simulacao | P0 |
| Falha/desconexao do servidor | Concluido | A interface mostra desconexao/erro; invalidacao REST e leitura MSW continuam; browser test encerra o sidecar e verifica catalogo | `tests/browser/realtime.browser.spec.ts` | Nenhuma para demo | P0 |
| Testes Socket.IO | Concluido | 7 testes nativos: transporte, desconexao, reconexao, precos/estoque, status/identidade, eventos antigos e limpeza de listeners | `tests/realtime/server.spec.ts`, `tests/realtime/querySync.spec.ts` | Adicionar testes de stress se o servico evoluir | P0 |
| Testes de integracao no browser | Concluido | Evento de NFT reflete na interface e REST; API segue disponivel com servidor encerrado | `tests/browser/realtime.browser.spec.ts` | Reexecutar junto da suite completa antes de entrega | P0 |
| Documentacao e execucao local | Concluido | API, payloads, portas, comandos, limites e cenarios descritos | `docs/API.md`, `package.json`, `playwright.browser.config.ts` | Manter comandos/documentacao sincronizados | P1 |

### Validacao desta etapa

- `npm run typecheck`: passou, incluindo servidor Node e testes realtime.
- `npm run build`: passou; bundle principal acima de 500 kB gera aviso do Vite, sem falha.
- `npm run test:realtime`: passou, 7 testes.
- `npm run test:api`: passou, 23 testes.
- `npm run test:mock-browser`: 15 casos passaram em execucao observada; foi necessario ajustar o gerenciamento de processos do preview antes de considerar o codigo final da suite.
- `git diff --check`: executar depois das ultimas mudancas de documentacao.

Limites conhecidos: o estado do sidecar e em memoria; reiniciar o servidor perde eventos; eventos de pedido sao cenarios administrativos e nao simulam uma transacao ou reconciliacao blockchain; segredo/token de demonstracao pode ser extraido do codigo frontend e nao fornece seguranca de producao. A API REST mantem a validacao autoritativa no checkout.

### Revalidacao final Socket.IO

Este bloco substitui o registro provisório de browser acima. A suite completa terminou normalmente e o preview de teste fechou a propria porta ao final.

- `npm run typecheck`: passou, incluindo `server/realtime` e `tests/realtime`.
- `npm run build`: passou; aviso do Vite para bundle principal acima de 500 kB.
- `npm run test:realtime`: passou, 7 testes.
- `npm run test:api`: passou, 23 testes.
- `npm run test:mock-browser`: passou, 16 testes; inclui propagacao REST/UI, queda do sidecar e desligamento do preview de teste.
- `git diff --check`: passou.

## Auditoria de entrega e revalidação final (2026-10-28)

Esta seção é o registro mais recente desta auditoria e substitui resultados provisórios e incompatíveis registrados acima. O objetivo é medir o estado do checkout contra `docs/README.md`, o enunciado original do desafio. A auditoria não configura um deploy nem declara prontidão de produção.

### Requisitos e pendências

| Requisito | Estado | Evidência verificada | Arquivos principais | Próxima ação | Prioridade |
|---|---|---|---|---|---|
| React + TypeScript | Implementado e verificado | Build e typecheck executados | `src/`, `package.json`, `tsconfig*.json` | Nenhuma nesta etapa | P0 |
| TanStack Router | Implementado e verificado | Rotas tipadas, busca da URL, proteção e importação dinâmica; build produz chunks por rota | `src/app/router.tsx`, `src/` | Nenhuma nesta etapa | P0 |
| TanStack Query | Implementado e verificado | Hooks de consulta/mutation, cache por parâmetros e invalidação; integração realtime atualiza/invalida caches | `src/api/hooks.ts`, `src/realtime/querySync.ts` | Nenhuma nesta etapa | P0 |
| Axios e contratos REST | Implementado para simulação | Cliente central `/api`; recursos tipados; 23 testes API aprovados. Em produção é necessário backend compatível | `src/api/`, `src/mocks/` | Fornecer API real somente quando ambiente de entrega existir | P0 |
| Catálogo, busca, filtros, ordenação e paginação | Implementado e verificado | UI usa parâmetros na URL e API; testes E2E cobrem busca/filtros e navegação | `src/features/home/`, `tests/e2e/` | Reforçar cenários combinados/histórico em E2E segundo matriz oficial | P0 |
| Detalhes e item inexistente | Implementado e verificado | Rota por ID, estados de carregamento/erro e recursos relacionados; fluxos browser/E2E executados | `src/features/nft/`, `tests/` | Nenhuma bloqueadora | P0 |
| Favoritos por usuário | Implementado; cobertura incompleta | Handlers isolam favoritos, mutations atualizam cache; fluxo de UI está nos testes | `src/api/`, `src/mocks/`, `tests/` | E2E explícito de falha otimista/rollback e troca de usuário | P0 |
| Carrinho, cupons e valores ETH | Implementado; cobertura incompleta | Operações REST, quote e cálculos decimais; testes API/browser e compra E2E | `src/api/`, `src/domain/`, `src/mocks/` | Ampliar E2E para todos limites de edição, cupom expirado e falha recuperável | P0 |
| Checkout, idempotência, confirmação e histórico | Implementado para simulação | API revalida quote/preço/estoque/carteira, snapshot do pedido, idempotência; carrinho só limpa após sucesso; pedidos isolados | `src/api/`, `src/mocks/`, `src/features/`, `tests/` | Provedor de pagamento e backend persistente são externos e não existem | P0 |
| Login, cadastro, sessão e logout | Implementado para simulação | API, recuperação por refresh, redirecionamento e limpeza de cache privado; testes E2E | `src/features/auth/`, `src/api/`, `src/mocks/`, `tests/e2e/` | Acrescentar E2E dedicado de expiração durante checkout e alternância de duas contas | P0 |
| Perfil e carteiras | Parcial | Perfil/senha e carteira têm UI e contratos mock; cobertura funcional de UI não é abrangente | `src/features/account/`, `src/api/`, `tests/` | Completar testes de carteira principal/secundária, erros e persistência; avatar não implementado | P1 |
| Socket.IO cliente/servidor e eventos | Implementado para demo; requisito MSW parcial | Cliente e servidor separados, eventos versionados, reconexão/ordenação/isolamento em testes realtime; browser confirma atualização e fallback | `src/realtime/`, `server/realtime/`, `tests/realtime/`, `tests/browser/` | O desafio cita `@mswjs/socket.io-binding`; ele não está instalado. Integrar binding compatível ou obter aceite para transporte sidecar documentado | P0 |
| Tailwind CSS | Parcialmente integrado | Plugin Vite e folha Tailwind carregados; a maior parte do layout continua em CSS autoral para preservar referências | `vite.config.ts`, `src/styles.css` | Confirmar se uso efetivo exigido requer adoção mais ampla sem descaracterizar o Figma | P1 |
| shadcn/ui | Não implementado como conjunto | Há Radix UI e `Button` próprio com CVA/Slot; nenhum componente shadcn gerado identificado | `src/components/`, `package.json` | Adotar componentes shadcn necessários ou documentar desvio; requisito de stack permanece pendente | P1 |
| MSW e cenários de falha | Implementado e verificado | MSW REST no nível de rede; cenários de lentidão, falha, sessão, conflito, cupom, preço/estoque e pedido; 23 testes API e 15 browser | `src/mocks/`, `tests/api/`, `tests/browser/` | Incluir resposta fora de ordem e latência variável na cobertura de UI | P0 |
| Playwright E2E | Implementado; matriz oficial não completa | Execução final: 35/35. São 15 testes browser (13 interação UI e 2 smoke de rede) e 20 em `tests/e2e` (2 acessibilidade, 6 fluxos críticos, 12 visuais); os 2 smoke não são interação UI | `playwright*.config.ts`, `tests/browser/`, `tests/e2e/` | Acrescentar E2E dos fluxos ausentes listados abaixo, incluindo mobile para checkout/conta e falhas de favoritos | P0 |
| Acessibilidade | Parcial | E2E heurístico testa skip link, foco/teclado e nomes; Lighthouse mediano dá 100 nas quatro páginas/perfis | `tests/e2e/accessibility.e2e.spec.ts`, relatórios Lighthouse | Executar axe quando dependência puder ser obtida e auditoria manual WCAG/zoom/tecnologia assistiva | P1 |
| Responsividade e regressão visual | Parcial | 12 baselines Playwright capturam home/detalhe/carrinho/checkout em 390, 768 e 1440 px; baselines são do código atual, não diff direto contra Figma | `tests/e2e/visual-regression.e2e.spec.ts-snapshots`, `docs/designFigma.png` | Comparar frames individualmente e revisar desvios visuais; ampliar baselines a pagamento se necessário | P1 |
| Skeleton shimmer | Parcial/não verificado integralmente | Estados de carregamento existem; auditoria não comprova shimmer em todos os recursos nem preservação de dimensão sob latência | `src/features/`, `src/styles.css`, `tests/` | Conferir catálogo, detalhe e resumo de carrinho com cenário lento em browser | P1 |
| Lighthouse e performance | Executado; metas parcialmente não atingidas | 3 medições por rota/perfil, medianas e HTML/JSON versionados; tabela abaixo | `scripts/lighthouse-audit.mjs`, `artifacts/lighthouse/` | Melhorar performance mobile e Best Practices da home sem simplificar auditoria ou quebrar Figma | P1 |
| Publicação obrigatória | Ausente | README informa sem URL pública; não há provedor/credenciais configurados | `README.md`, `docs/ARCHITECTURE.md` | Publicar frontend, sidecar realtime e backend/mock demonstrativo num ambiente persistente; testar refresh/rotas e manter acessível | P0 eliminatório |
| Documentação de setup/arquitetura/API | Implementado localmente | README, arquitetura, contratos, eventos, variáveis e limites revisados | `README.md`, `docs/API.md`, `docs/ARCHITECTURE.md` | Inserir URLs finais e instruções específicas do provedor após publicação | P1 |

### Cobertura E2E: escopo e lacunas

`npm run test:e2e` abriu Chromium com preview de build e completou 35 casos. Decomposição sem contagem dupla: 15 casos `tests/browser` (13 interações visuais de UI; 2 verificações de rede MSW sem interação UI) e 20 casos `tests/e2e` (2 acessibilidade, 6 fluxos críticos, 12 screenshots de baseline). Os testes não dependem de contas nem serviços externos; fixtures e reset deixam os cenários determinísticos. Não há `waitForTimeout` como sincronização de fluxo nos testes E2E revisados. O sidecar local é iniciado/encerrado pelo setup apropriado; uma verificação de indisponibilidade desliga e restaura o serviço.

A suíte verifica no navegador catálogo/busca/filtros, detalhe, autenticação, carrinho/cupom, checkout/recibo, conexão e atualização realtime, fallback quando o socket cai, acessibilidade prática e snapshots nos três viewports. Ainda não cobre integralmente a matriz do desafio: combinações de filtros + ordenação + paginação + histórico; mutação de favoritos com rollback; troca de duas contas e expiração durante todas as rotas privadas; editar avatar/carteiras com erros; cupom expirado; falha após submissão/timeout e clique repetido no browser; socket durante checkout pendente; todos estados skeleton e falhas de recuperação; fluxos completos mobile de checkout, perfil e carteiras. Testes de API/realtime reduzem risco, mas não substituem essas interações E2E.

### Lighthouse reprodutível

Executado com build local de auditoria e dados MSW, três medições por cada combinação. Ambiente: Node `v22.22.2`, Lighthouse `12.8.2`, Chrome `156.0.8078.4`. Medianas registradas em `artifacts/lighthouse/summary.json`; relatórios individuais HTML/JSON em `artifacts/lighthouse/`. Metas oficiais: Performance ≥90, Accessibility ≥95, Best Practices ≥95, SEO ≥90.

| Rota / perfil | Performance | Accessibility | Best Practices | SEO | LCP mediano | CLS mediano | TBT mediano | Resultado vs meta |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Início desktop | 97 | 100 | 96 | 92 | 1125 ms | 0.00003 | 0 ms | Todas atingidas |
| Início mobile | 79 | 100 | 93 | 92 | 4200 ms | 0 | 158 ms | Performance e Best Practices abaixo |
| Detalhe desktop | 98 | 100 | 96 | 92 | 1028 ms | 0.01474 | 0 ms | Todas atingidas |
| Detalhe mobile | 82 | 100 | 96 | 92 | 3961 ms | 0.01685 | 121 ms | Performance abaixo |

A inspeção dos relatórios atribui a maior parte do LCP mobile ao atraso de renderização das imagens principais (aprox. 2.9 s na home e 2.8 s no detalhe sob throttling simulado; a imagem de detalhe só é descoberta após renderizar a rota). Best Practices da home inclui fontes Google indisponíveis no ambiente (`ERR_NETWORK_ACCESS_DENIED`) e uma requisição esperada 401 para sessão anônima; os textos muito pequenos em alguns elementos do Figma também geram sinal de fonte reduzida. Não foram alterados tamanhos visuais apenas para perseguir nota. Essas medições são locais, variam entre execuções e não substituem medição do deploy.

### Bundle e revisão de segurança

O build de produção separa páginas por rota. O chunk principal medido foi 463.82 kB minificado (151.05 kB gzip), abaixo do aviso Vite de 500 kB. Busca no bundle não encontrou `127.0.0.1`, `local-demo-only-token`, `REALTIME_JWT_SECRET` ou chave literal de assinatura. Permanecem ocorrências genéricas de `localhost` de fallbacks internos de dependências Router/Axios; não são endpoints configurados pela aplicação. Axios usa `/api` por padrão e o socket de produção requer `VITE_REALTIME_URL`. A emissão de identidade de demo é desligada em produção e não deve ser tratada como autenticação real.

### Comandos verificados nesta auditoria

| Comando | Resultado |
|---|---|
| `npm run typecheck` | Passou |
| `npm run lint` | Passou; ESLint cobre infraestrutura JavaScript, TS/TSX é coberto por typecheck |
| `npm run build` | Passou; chunk principal 463.82 kB minificado, rotas divididas |
| `npm run test:api` | Passou, 23/23 |
| `npm run test:mock-browser` | Passou, 15/15 |
| `npm run test:realtime` | Passou, 8/8 |
| `npm run test:e2e` | Passou, 35/35; distribuição descrita acima |
| `npm run audit:lighthouse` | Passou, 12 auditorias (4 configurações × 3 repetições); metas abaixo descritas |
| `git diff --check` | Passou após este registro final |

### Bloqueios para declarar entrega concluída

1. **Deploy público é requisito eliminatório e está ausente.** Não há URLs, provedor ou ambiente configurado nesta workspace. A publicação precisa de infraestrutura compatível com API REST e Socket.IO; o MSW local não pode ser apresentado como backend privado seguro.
2. **shadcn/ui não participa efetivamente**; somente Radix e componentes próprios estão presentes.
3. **Binding Socket.IO específico de MSW não está instalado.** A simulação real usa cliente/servidor Socket.IO local e MSW para REST/snapshots; isto está documentado, mas diverge do requisito explícito.
4. **Cobertura E2E e de acessibilidade não fecha toda a matriz oficial.** Axe não foi instalado devido à indisponibilidade de rede; revisão WCAG manual ainda falta.
5. **Performance mobile não alcança a meta Lighthouse** e Best Practices da home fica em 93.
6. Backend, persistência e autenticação reais, publicação e verificação pós-deploy permanecem externos; login social/recuperação de senha não estão previstos como integrações reais no desafio e não devem aparentar sucesso.

## Auditoria carteira e checkout (2026-10-29)

### Diagnostico e correcoes

- O checkout simulado valida cotacao, carteira da sessao, preco e estoque atuais, saldo suficiente e idempotencia. Os valores ETH sao manipulados em unidades inteiras. Pedido confirmado atualiza saldo, disponibilidade, carrinho e historico no estado compartilhado MSW.
- A acao de adicionar carteira apenas preenchia campos aleatorios; salvar atualizava a carteira principal existente. Agora o formulario cria uma carteira nova sem sobrescrever a principal. A primeira carteira criada vira principal e a seguinte recebe saldo demonstrativo `0.25 ETH`.
- Foram adicionados testes de navegador para cadastro/persistencia da carteira e recusa de checkout por saldo insuficiente, verificando saldo e carrinho preservados e ausencia de pedido. O teste API tambem cobre saldo insuficiente.
- ESLint falhava porque `URL` nao estava declarado como global no script de preview; corrigido. O preview de teste agora fecha conexoes WebSocket no teardown.
- Corrigidos testes que liam `Response.ok` diretamente do resultado serializado de `page.evaluate`. Os testes mock validam os estados persistidos na API REST.

### Validacoes executadas em 2026-10-29

| Verificacao | Resultado | Observacoes |
|---|---|---|
| TypeScript | Passou | `npm run typecheck` passou; `npm run build` final tambem executou `tsc -b`. |
| ESLint | Passou | `npm run lint`. |
| API/MSW | Passou, 25/25 | Inclui saldo insuficiente sem pedido, debito ou perda do carrinho. |
| Socket.IO | Passou, 8/8 | `npm run test:realtime`. |
| Playwright funcional | Passou, 24/24 | Browser, realtime browser e fluxos criticos; inclui carteira, checkout e falhas. |
| Build producao | Passou | Chunk principal 465.03 kB minificado (151.45 kB gzip), rotas divididas. |
| E2E completo | Falhou, 24/38 na execucao completa observada | Doze snapshots visuais divergiram; um teste mock foi posteriormente corrigido e passou no conjunto funcional direcionado. Revisar snapshots e repetir a suite completa. |
| Socket.IO mock em preview | Pendente | A conexao WebSocket do preview nao completa o protocolo Socket.IO. O sidecar Socket.IO real passou nos testes de integracao. |
| `git diff --check` | Passou | Aviso de conversao LF/CRLF no README. |

### Pendencias

- P0: completar o transporte Socket.IO mock no preview browser ou eliminar esse caminho demonstrativo. Compra e saldo continuam simulados, sem pagamento real.
- P1: revisar visualmente os doze snapshots divergentes e atualiza-los apenas se a diferenca corresponder a interface aprovada; repetir a suite completa.
- P1: deploy publico, API persistente e autenticacao real nao estao configurados.
- P1: shadcn/ui nao e usado como conjunto de componentes; axe/WCAG abrangente permanece pendente.
- P2: avatar, login social, recuperacao de senha, conversao fiat e blockchain nao estao implementados.

## Rodada final de auditoria (2026-10-29)

### Capturas visuais: inspeção e resultado por baseline

As 12 capturas antigas divergiam de uma interface que havia mudado desde a geração dos baselines. A revisão confirmou que os retratos e fontes locais carregavam; a home era capturada antes de a grade/imagens terminar de carregar. O teste agora aguarda a grade e `naturalWidth` de cada imagem. Os baselines foram regenerados de modo determinístico depois de rever as capturas atuais. A inspeção também encontrou e corrigiu cortes reais na tela de detalhes tablet e sobreposição no checkout mobile.

| Baseline | Causa da divergência / decisão |
|---|---|
| `home-desktop` | H1, espaçamento do hero e hierarquia atual do catálogo diferem do baseline antigo; imagens e fontes carregadas. Atualizado para o layout atual. |
| `home-tablet` | Composição responsiva do hero e grade em duas colunas mudou; captura anterior podia ocorrer antes das imagens. Sincronização corrigida e baseline atualizado. |
| `home-mobile` | Busca móvel, hero compacto, grade escalonada e barra inferior diferem do baseline antigo; imagens carregadas antes da captura. Atualizado. |
| `detail-desktop` | Galeria, hierarquia de informações e espaçamento atuais diferem do snapshot anterior; recurso de arte carregado. Atualizado. |
| `detail-tablet` | Além do layout atual, avaliação e login ultrapassavam a borda direita. Ajustados tipografia/fluxo da avaliação e espaço do cabeçalho; asserção de borda adicionada. Baseline atualizado após a correção. |
| `detail-mobile` | Composição móvel de galeria, metadados e controles difere do baseline antigo; arte carregada. Atualizado. |
| `cart-desktop` | Colunas da tabela e resumo atual têm dimensões e quebras diferentes; dados e arte corretos. Atualizado. |
| `cart-tablet` | Largura intermediária altera colunas e quebras do item/resumo; conteúdo não foi cortado. Atualizado. |
| `cart-mobile` | Cabeçalho com botão voltar, cartão de item e resumo fixo pertencem ao layout móvel atual. Atualizado. |
| `checkout-desktop` | Carteiras e saldos simulados agora são apresentados no resumo; isso aumenta a altura do conteúdo. Atualizado. |
| `checkout-tablet` | Carteiras, saldos e espaçamento atual do checkout diferem do snapshot antigo. Atualizado. |
| `checkout-mobile` | Cartões de carteira e saldos são mudanças funcionais. Também removida a posição fixa do botão, que cobria o total e o aviso; botão agora segue o conteúdo. Atualizado. |

Validação final E2E repetida após o ajuste tablet e o cenário de duplo clique: **40/40 passaram**, com os 12 baselines aprovados.

### Socket.IO no preview

Removido o servidor `ws` cru incompatível com Socket.IO e o caminho duplicado de socket mock. O browser-test usa o cliente Socket.IO oficial e o sidecar `server/realtime` real na porta 5188; Vite preview serve a aplicação e não intercepta o protocolo. A dependência exclusiva desse caminho inválido foi retirada. Em desenvolvimento, execute `npm run dev` e `npm run realtime:dev` em terminais separados. Testes cobrem conexão inicial, `nft.updated` que atualiza a interface, `order.updated` privado em uma única sessão, reconexão, limpeza de listeners, encerramento do servidor e REST disponível durante indisponibilidade do socket. O servidor rejeita token privado inválido/expirado e a chave JWT de produção continua apenas no lado do servidor. O requisito de usar binding MSW específico para Socket.IO segue parcial; essa arquitetura não usa binding.

### Carteira, checkout e invariantes financeiros

Playwright verificou login demo, inclusão de carteira secundária, preservação da principal, recarga e persistência, checkout mobile, pedido confirmado e refresh da confirmação. O cenário E2E dispara dois eventos de clique e confirma que só um pedido fica no histórico. Isso é automação de browser, não uma sessão manual. A interface de navegador integrado não está disponível nesta execução; por isso não registro inspeção manual de console/rede.

No estado simulado, os preços são strings decimais convertidas para inteiros de 10⁻¹⁸ ETH. Antes de gravar, `createOrder` valida dono/expiração/versão da cotação, carteira, saldo, estoque e preço; falhas de API, saldo, sessão, preço, estoque e recusa preservam carrinho e não registram pedido conforme cenários cobertos. Pedido confirmado guarda snapshot de itens/preços/total, debita saldo e reduz estoque; retry com a mesma chave recupera o mesmo pedido. O teste API agora confirma que compra duplicada de 2 unidades debita `2.396 ETH` uma única vez (saldo `12.5 → 10.104`), estoque `12 → 10` e carrinho vazio. Persistência de browser/localStorage sobrevive reload nos fluxos cobertos.

Essas garantias são do mock em memória/localStorage de uma única execução. As mudanças do estado são agrupadas antes de uma gravação síncrona, mas localStorage/MSW não oferece transação atômica contra falha de quota, encerramento ou concorrência entre clientes. Não existe pagamento blockchain ou proteção de saldo real.

### Acessibilidade, responsividade e Lighthouse

Os testes Playwright de teclado, foco visível, diálogo e nomes acessíveis passaram (2 casos nas rotas principais). Lighthouse 12.8.2/Chrome 156 foi executado três vezes por rota/perfil; artefatos individuais e medianas em `artifacts/lighthouse/summary.json`.

| Rota / perfil | Performance | Acessibilidade | Best Practices | SEO | LCP mediano | CLS mediano | TBT mediano |
|---|---:|---:|---:|---:|---:|---:|---:|
| Início desktop | 96 | 100 | 100 | 92 | 1413 ms | 0.00061 | 0 ms |
| Início mobile | 70 | 100 | 96 | 92 | 5896 ms | 0.00029 | 240 ms |
| Detalhe desktop | 96 | 100 | 100 | 92 | 1319 ms | 0.01668 | 0 ms |
| Detalhe mobile | 73 | 100 | 100 | 92 | 5780 ms | 0.01744 | 135 ms |

Contraste em todos os estados, leitores de tela/zoom e conformidade WCAG completa ainda não foram auditados manualmente. Axe não está instalado; não foi obtido pela rede. A pontuação 100 em Acessibilidade se limita às duas rotas Lighthouse e não certifica o produto. O LCP mobile permanece baixo: a auditoria identifica a imagem do primeiro NFT como elemento LCP e aproximadamente 91% do tempo em atraso de renderização após a descoberta; a navegação demonstrativa também espera dados MSW.

### Validações executadas

| Comando | Resultado |
|---|---|
| `npm run typecheck` | Passou após as correções finais. |
| `npm run lint` | Passou. |
| `npm run test:api` | 25/25 passou; inclui débito/estoque com idempotência e falhas financeiras. |
| `npm run test:realtime` | 8/8 passou. |
| `npm run test:mock-browser` | 18/18 passou. |
| `npm run test:e2e` | 40/40 passou após as correções responsive e atualização dos baselines. |
| `npm run audit:lighthouse` | 12 medições concluídas (3 por rota/perfil). |
| `npm run build` | Passou; bundle principal 464.66 kB minificado / 151.30 kB gzip; rotas em chunks separados. |

### Estado de publicação e pendências por prioridade

- **P0:** nenhum bloqueio de build/test local identificado.
- **P1:** ainda não há deploy público, backend REST persistente nem autenticação de produção. Para uma demonstração publicável: hospedar frontend estático com fallback SPA e MSW explicitamente habilitado; hospedar sidecar Socket.IO separado com HTTPS/WSS e origin restrita. Isso continua sendo uma demonstração e perde estado ao reiniciar. Para uso real, substituir MSW por API/banco persistentes e auth que emita JWT; não colocar segredos em `VITE_*`. Nenhum deploy foi feito.
- **P2:** desempenho Lighthouse mobile (70/73) e LCP ~5.8–5.9 s; WCAG completa e axe/manual de leitor de tela pendentes. O binding MSW Socket.IO específico não é usado; integração usa sidecar real e mantém cobertura de protocolo.
- **P3:** conjunto shadcn/ui, avatar upload, login social/recuperação de senha, conversão fiat e blockchain não estão implementados.

Para validar localmente: `npm ci`; em terminais separados `npm run realtime:dev` e `npm run dev`; contas de demonstração e comandos de validação estão no README. Não use estas contas/saldos para ativos reais.
