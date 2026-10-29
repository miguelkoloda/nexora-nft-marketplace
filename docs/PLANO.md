# Plano — NFT Marketplace

## Fonte e ressalvas

Este plano foi extraído do `README.md` do desafio e atualizado após inspeção visual de `docs/designFigma.png`, imagem composta com vários frames desktop e mobile. O link original [Frontend Challenge](https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1) continua inacessível pela ferramenta; a imagem foi a referência disponível. A resolução exibida permite reconhecer páginas e estrutura, mas textos pequenos e algumas labels não são legíveis. Não se inferem estados visuais que não estejam claros na imagem; validar nomes/textos, dimensões e detalhes de interação no Figma quando houver acesso.

O escopo deste documento é planejamento. Nenhuma funcionalidade abaixo deve ser considerada implementada até ser concluída e registrada em `PROGRESSO.md`.

## Etapa visual iniciada

Após aprovação do usuário, foi criada uma fundação visual React + TypeScript com TanStack Router/Query, Tailwind e primitives adaptadas ao projeto. As rotas têm layouts demonstrativos para início/catálogo, detalhe, carrinho, pagamento, login, cadastro, perfil, carteiras e confirmação, além de 404. Os dados do catálogo e estados exibidos são locais e temporários; nenhum fluxo transacional/autenticação foi implementado. O botão de confirmação de pagamento não cria um pedido.

O visual segue a referência disponível em `docs/designFigma.png` (tema escuro, acento laranja, layouts de catálogo, detalhe, carrinho, pagamento e conta). Quatro retratos visíveis no frame desktop foram recortados da montagem e salvos em `public/artwork/` para serem reutilizados no hero, nos cards, no diário e nas demais telas. São recortes da imagem de referência, não os arquivos-fonte individuais do Figma. A tipografia principal continua dependendo temporariamente do Google Fonts; incluir uma fonte local antes da entrega.

### Revisão das telas iniciais desktop e mobile

- **Desktop:** header centralizado; hero editorial em duas colunas, com texto e retrato em destaque; catálogo em três colunas, filtros e NFT em destaque na barra lateral; paginação; dois banners promocionais; quatro artigos no diário; benefícios, newsletter e rodapé em quatro colunas.
- **Mobile:** shell escuro arredondado; busca e ação de filtros no topo; banner compacto com dois retratos; abas horizontais; cards em duas colunas com deslocamento alternado; barra inferior fixa com cinco ações e botão de scanner central.
- Textos e dados demonstrativos do catálogo foram aproximados aos nomes e preços legíveis na referência. Busca, filtros, tabs, scanner, paginação, favoritos e newsletter ainda não foram conectados a comportamento real.
- Cabeçalho revisado conforme a referência: wordmark sem ®, carrinho com contador, botão Entrar com ícone próprio e sem ícone de perfil ao lado; chamada Explorar sem seta. Copyright fica separado abaixo do painel marrom do rodapé.
- As telas iniciais foram capturadas na versão de produção em 390×844 e 1440×1000 e comparadas visualmente com as imagens fornecidas. As demais rotas precisam de uma revisão equivalente.

Login e cadastro aparecem como diálogos sobre o início no desktop, mantendo o mercado visível ao fundo. Nos frames mobile, cada fluxo ocupa uma moldura alta com cantos arredondados sobre o canvas escuro, com formulário centralizado diretamente no painel principal (sem caixa interna). O login tem e-mail, senha, recuperação de senha, ação principal, Google/Facebook e link para cadastro; cadastro tem nome de usuário, e-mail, senha, confirmação de senha, ação principal, Google/Facebook e link para entrar. A apresentação troca por breakpoint: overlay no desktop e tela mobile dedicada.

## Objetivo

Construir um marketplace de NFTs responsivo para descoberta, compra simulada e gerenciamento da conta do colecionador. APIs, autenticação, carteiras, pagamentos e eventos devem ser simulados; integrações reais com blockchain, extensões de carteira e gateways de pagamento estão fora do escopo. Os fluxos precisam funcionar, não apenas parecer funcionais.

## Funcionalidades exigidas

### Descoberta, catálogo e detalhe

- Início com destaques, catálogo, busca, filtros combináveis, ordenação, paginação e navegação para o detalhe.
- Estado de busca/filtros/ordenação/página na URL, restaurado em refresh e histórico; mudar filtro reinicia a página.
- Consultas REST com parâmetros correspondentes à URL e tratamento de vazio, falha e respostas fora de ordem.
- Detalhe com galeria, informações, edição, quantidade, favoritos e compra; acesso direto, NFT inexistente, edição indisponível e limite de quantidade.
- Favoritos persistidos por usuário autenticado.

### Carrinho

- Adicionar, alterar quantidade e remover, respeitando disponibilidade por NFT/edição.
- Persistência após refresh e união/preservação dos itens de visitante após login.
- Aplicar/remover cupom e tratar código inválido/expirado.
- Subtotal, desconto, taxa de rede e total conforme cotação da API.
- Atualizar preço/disponibilidade por eventos enquanto aberto.
- ETH como string decimal e cálculo/apresentação precisos; quantidade inteira; cotação da API como referência de finalização.

### Checkout, pedido e recibo

- Dados do colecionador, carteira e rede, validação e revisão antes de enviar.
- Simular conexão, recusa e desconexão de carteira.
- Revalidar preço, disponibilidade, cupom e taxa; exigir nova confirmação se houver mudança.
- Impedir duplicidade com chave de idempotência inclusive em clique repetido/timeout; mesma chave recupera mesmo pedido e conteúdo diferente gera conflito.
- Estados pendente, confirmado e recusado recuperáveis após refresh/reconexão; estados confirmados/recusados são terminais.
- Mostrar confirmação somente após confirmação simulada. Preservar itens em falha; na confirmação remover somente itens/quantidades comprados.
- Recibo baseado em snapshot imutável do pedido; referências e links de exploração simulados.
- Recuperar pedido pendente após interrupção sem criar outra compra.

### Conta e sessão

- Cadastro, login, logout e sessão via API simulada; sessão recuperável após refresh.
- Checkout, perfil, carteiras, favoritos e pedidos protegidos por autenticação.
- Expiração durante navegação/checkout com preservação do contexto para retomada.
- Logout/troca de usuário limpam cache privado e subscriptions da sessão anterior.
- Perfil: consultar/editar dados e avatar, alterar senha. Carteiras: consultar, cadastrar e atualizar carteiras principal/secundária.
- Validar cadastro, perfil, senha e carteiras, inclusive erros de API; persistir alterações após refresh.
- Credenciais fictícias; não armazenar senhas em claro.

### Dados, mocks e tempo real

- Contratos REST tipados e documentados para sessão/conta, NFTs, favoritos, carrinho, cotação, pedidos, perfil e carteiras; representar validação, sessão inválida, permissão, inexistência, conflito de disponibilidade e falha transitória.
- MSW na camada de rede, reutilizando contratos/cenários em desenvolvimento, demonstração e testes. Estado consistente entre recursos, persistência local permitida e reset completo para estado conhecido.
- Cenários reproduzíveis de sucesso/vazio, latência/respostas fora de ordem, conexão/HTTP 4xx/5xx, sessão expirada/não autorizado, conflitos de formulário, cupom inválido/expirado, preço alterado/edição esgotada, timeout após criação com recuperação idempotente e pagamentos confirmado/recusado.
- Simular condições de rede: lentidão, latência variável, timeout, indisponibilidade de conexão e erro HTTP.
- MSW também deve simular eventos por integração compatível com Socket.IO (exemplo indicado: `@mswjs/socket.io-binding`). Documentar transporte e limitações. Os cenários devem exercitar `socket.io-client`; não simular evento por setter/callback/cache direto.
- Eventos mínimos `nft.updated` (preço/disponibilidade no catálogo, detalhe e carrinho) e `order.updated` (estado do pedido e confirmação/recusa), com identidade estável, recurso e versão. Tolerar duplicatas/antigos sem regressão/reaplicação; reconciliar via REST após reconexão; isolar por sessão e limpar listeners.
- Ativar mocks por configuração e incluí-los no build de demonstração; mudanças simuladas devem refletir em REST e eventos.

### Interface, acessibilidade, qualidade

- Implementar frames desktop e mobile; todas as telas desktop/tablet/mobile, inclusive perfil, carteiras e confirmação em mobile sem frame específico. Avaliar 390, 768 e 1440 px.
- Skeletons com shimmer em catálogo, detalhe e resumo do carrinho, dimensões estáveis e respeito a movimento reduzido.
- Fidelidade ao Figma em tipografia, cor, espaçamento, hierarquia, imagens, proporção e composição; adaptar shadcn/ui. Usar assets/fontes disponíveis localmente e documentar substituições/desvios.
- Teclado e foco visível; foco em diálogos/drawers; semântica, labels e erros associados; textos alternativos; contraste e estados não apenas por cor; feedback acessível para mutations/eventos; sem overflow indevido e sem perda com zoom.
- Atualização otimista em pelo menos uma interação, com rollback.
- Estados de loading, vazio, erro, sucesso e atualização em segundo plano; invalidar cache coerentemente; cancelar/descartar respostas obsoletas; isolamento por usuário e parâmetros; recuperar falhas sem duplicar operações; 404 e acesso direto a telas previstas.

### Testes e auditorias

- Playwright E2E com mocks para os 12 grupos listados no README: catálogo/URL/histórico; detalhe direto/inexistente; ciclo de sessão; favoritos e falha/recuperação; carrinho/cupom/persistência; compra e recibo; pagamento recusado/duplicidade/timeout; perfil/avatar/senha/carteiras; mudança via Socket.IO no checkout; eventos duplicados/antigos/desconexão/pedido pendente; teclado/foco/formulários; skeleton/falha/retry.
- Fluxos principais em Chromium desktop e mobile; regressão visual com baselines versionadas para início, detalhe, carrinho e pagamento; isolamento de estado por teste e controle de relógio/latência/eventos nos cenários sensíveis. Relatório HTML e traces de falhas.
- Testes devem observar interface e efeitos reais simulados; REST por handlers MSW e tempo real passando pelo cliente Socket.IO.
- Lighthouse em build otimizado, mocks padrão, início e detalhe, perfis mobile/desktop; três execuções por combinação e mediana. Metas: Performance ≥90, Accessibility ≥95, Best Practices ≥95, SEO ≥90. Registrar LCP, CLS, TBT, relatórios HTML/JSON, versões, ambiente e condições; justificar metas não atingidas.

## Requisitos técnicos obrigatórios

| Responsabilidade                 | Obrigatório                                                                              |
| -------------------------------- | ---------------------------------------------------------------------------------------- |
| UI / linguagem                   | React / TypeScript                                                                       |
| Rotas, query params e proteção   | TanStack Router                                                                          |
| Estado remoto, mutations e cache | TanStack Query                                                                           |
| HTTP e REST                      | Axios / REST APIs                                                                        |
| Tempo real                       | Socket.IO, incluindo `socket.io-client` nos cenários simulados                           |
| Estilos / componentes            | Tailwind CSS / shadcn/ui                                                                 |
| Mock de API/rede/eventos         | MSW e integração de transporte Socket.IO compatível (exemplo `@mswjs/socket.io-binding`) |
| E2E e regressão visual           | Playwright                                                                               |
| Auditoria                        | Lighthouse                                                                               |

Ferramenta de build, organização do projeto e bibliotecas complementares ficam a critério do candidato. Todas as tecnologias obrigatórias precisam participar efetivamente da solução.

## Páginas e componentes reutilizáveis

### Páginas/rotas propostas

Os nomes abaixo conciliam os fluxos do README com as telas legíveis na imagem. Rotas exatas não são definidas pelo desafio e ficam como decisão técnica:

1. Início / catálogo — pública.
2. Detalhe do NFT por identificador — pública.
3. Carrinho — carrinho de NFTs.
4. Pagamento/checkout — privado.
5. Confirmação/recibo do pedido — privado, mediante pedido confirmado.
6. Login — público, com retorno ao fluxo anterior.
7. Cadastro — público.
8. Perfil do colecionador — privado.
9. Carteiras — privado.
10. Rota inexistente/404.

Na imagem também aparecem estados de autenticação sobre a página inicial, uma tela de perfil com navegação lateral e uma tela de cadastro de carteira. Tratá-los como variações/modal ou páginas de acordo com navegação e requisitos, sem perder a rota dedicada/retomada exigida. A imagem mostra ainda composições mobile para início, detalhe, carrinho, pagamento, login e cadastro. Perfil, carteiras e confirmação não têm frame mobile identificável, mas o README exige que funcionem nesse formato.

### Leitura visual de `designFigma.png`

A imagem apresenta uma interface escura de marketplace chamada “KURIO”, com acentos laranja/dourados e tipografia de aparência monoespaçada em títulos/labels. O texto fino e medidas exatas não são legíveis o suficiente para transcrição segura.

- **Início desktop:** header horizontal com marca e navegação; hero editorial com título e NFT em destaque; catálogo com filtros numa coluna lateral e cards em grade; áreas de NFT em destaque e conteúdo editorial; rodapé com blocos informativos. A imagem também mostra estados de login e cadastro em painéis/modal sobre a página.
- **Detalhe desktop:** breadcrumb, miniaturas verticais e imagem principal em galeria; título e identificador/descrição; preço, disponibilidade/edição, quantidade e ações de compra/favorito; descrição/atributos e recomendações de NFTs relacionados.
- **Carrinho desktop:** breadcrumb e lista de itens à esquerda, resumo à direita com campo de cupom, subtotal/descontos/taxa/total e ação de continuar ao pagamento; recomendações abaixo.
- **Pagamento desktop:** formulário de dados do colecionador em coluna larga e resumo do pedido em coluna lateral, incluindo itens, cupom/taxas e opções de carteira/rede/termos/ação de confirmar. O conteúdo exato dos campos deve seguir o frame e validações do README.
- **Perfil desktop:** navegação lateral de conta e formulário principal com dados pessoais; outra variação mostra dados de carteira e ações de edição/adicionar. A captura sugere seções de navegação para perfil e configurações relacionadas.
- **Confirmação desktop:** cartão central compacto sobre fundo escuro com ícone/estado de sucesso, informação de pedido/transação, itens, valores e ação de continuar/voltar.
- **Mobile:** header compacto e navegação inferior no início; listagem com filtros compactados; detalhe em coluna única com mídia e ações; carrinho em coluna com resumo condensado; pagamento em coluna; login/cadastro em telas focadas. Conferir comportamento de filtros e resumo expansível no frame original, pois os rótulos diminutos não são legíveis.
- **Sistema visual observável:** fundo quase preto/marrom, superfícies castanho-escuras, linhas divisórias discretas, texto claro, acento laranja para botões/estados/preços; cartões de NFT com imagem dominante, borda/superfície escura e metadados compactos. Priorizar contraste, consistência e responsividade sem assumir valores exatos de tokens.

Os elementos acima são descrições do que é visível na imagem, não confirmação de nomes oficiais de frames. A imagem não permite aferir dimensões, fonte exata, breakpoints, estados de hover/foco, validações visuais nem comportamento de cada controle.

### Componentes candidatos a reutilização

- Shell de aplicação, header/navegação desktop, header compacto/navegação inferior mobile e footer informativo.
- Card NFT, grade/listagem, filtros, ordenação, paginação e skeleton correspondente.
- Galeria/mídia NFT, preço/disponibilidade/edição e controle de quantidade.
- Botão/controle de favorito, avisos acessíveis e feedback de mutations.
- Linha de item de carrinho, editor de quantidade, cupom, skeleton e resumo de valores.
- Form fields com labels/erros, validação e estados de envio; cartões/seletor de carteira/rede.
- Dialog/drawer acessível (incluindo login/cadastro sobre o início, se confirmado como modal no protótipo), confirmação de alteração de cotação e estados de pedido.
- Navegação lateral de conta e painéis de resumo de pedido reutilizáveis no carrinho, checkout e recibo, ajustados ao conteúdo próprio de cada fluxo.
- Proteção de rota/retomada de destino, estados vazio/erro/loading, confirmação de operação.

São candidatos identificados pelo enunciado e pela composição visível; os detalhes de variants e interações precisam ser confirmados no Figma.

## Arquitetura proposta (React + TypeScript)

Proposta organizada por domínio, sem fixar ferramenta de build:

```text
src/
  app/          # inicialização, providers, router, configuração
  routes/       # páginas e loaders/guards por rota
  domains/
    catalog/    # NFTs, busca, filtros, detalhe, favoritos
    cart/       # carrinho e cotação
    checkout/   # revisão e criação/recuperação de pedido
    account/    # sessão, cadastro, login, perfil
    wallets/    # carteiras e redes
  shared/
    api/        # Axios, erros, contratos e conversores
    ui/         # shadcn/ui adaptado, componentes compartilhados
    realtime/   # socket.io-client, eventos, lifecycle e reconciliação
    validation/ # esquemas e mensagens compartilhadas
  mocks/        # handlers MSW REST/socket, fixtures, cenários, persistência/reset
  tests/        # utilitários e fixtures Playwright
```

- TanStack Router controla rotas, search params tipados, acesso direto, 404 e guards. Guard conserva destino ao encaminhar para login.
- TanStack Query é dono do estado remoto, chaves segmentadas por usuário/parâmetros, mutations, invalidação, cancelamento e sincronização REST/socket. Limpar cache/subscriptions ao mudar sessão.
- Axios encapsula REST e tradução de erros; componentes não contêm respostas fictícias. Tipos de transporte e de domínio separados quando conversão de ETH/versões exigir.
- Valores ETH trafegam como strings decimais; usar aritmética decimal apropriada (biblioteca complementar a escolher) e quantidades inteiras.
- MSW mantém estado único/coerente e cenários nomeados; cliente de socket real recebe eventos do transporte mockado. Persistência/reset controlados por configuração.
- Idempotência na criação de pedido e snapshot imutável do recibo; fluxo de pedido recupera estado por API após refresh/reconexão.
- Política inicial proposta: chaves de query incluem recurso, usuário e filtros; cancelar requests anteriores na mudança de parâmetros; retry limitado a falhas transitórias de leitura, sem retry cego de mutations; mutations invalidam recursos afetados. Ajustar e documentar conforme a implementação.
- Tailwind e shadcn/ui formam a base visual, com tokens e variantes ajustados após inspeção do Figma. Validação de formulário e lib decimal são decisões complementares pendentes.

## Dependências e ordem recomendada

1. **Inspeção de design e fundação**: usar `docs/designFigma.png` como referência inicial e, se possível, confirmar frames/assets no Figma; definir tokens aproximados a partir do arquivo; confirmar rotas/estados; criar app React/TS, stack, contratos e configuração.
2. **Contratos e MSW base**: tipos/endpoints, fixtures, usuários, cenários, reset/persistência e erros. Necessário antes de integrar telas sem dados locais artificiais.
3. **Shell e catálogo**: router, Axios/Query, URL state, busca/filtros/ordenação/paginação, loading/vazio/erro, cards e detalhe. Base visual e prova das integrações REST.
4. **Sessão e proteção**: cadastro/login/logout/refresh/expiração e isolamento. Necessário para favoritos e fluxos privados.
5. **Carrinho/cotação**: persistência e merge do visitante, quantidades/cupom/preços. Necessário para checkout.
6. **Carteiras, checkout e pedido**: perfil/carteiras, validações, revisão, revalidação, idempotência e estados recuperáveis, snapshot/recibo.
7. **Socket.IO**: eventos versionados, deduplicação, reconexão/reconciliação, isolamento e integração MSW. Exercitar mudança de NFT e pedido pendente.
8. **Responsividade/acessibilidade e robustez**: completar breakpoints e estados, teclado/foco, skeletons, optimistic update/rollback e falhas.
9. **Playwright**: fluxos críticos desde início, depois matriz de falhas, viewports e baselines.
10. **Build, deploy e Lighthouse**: documentação, execução limpa, deploy público, auditorias repetidas e relatórios.

Dependências centrais: checkout depende de sessão, carrinho, cotação e carteiras; recibo depende de pedido confirmado; favoritos/perfil/carteiras/pedidos dependem de sessão; eventos dependem de contratos e estado MSW/API; E2E depende de fluxos e cenários determinísticos; Lighthouse/deploy dependem do build reproduzível.

## Eliminatórios e riscos de perda de nota

### Eliminatórios explícitos

- Não usar efetivamente qualquer item da stack obrigatória.
- Fluxos principais apenas visuais, sem comportamento funcional.
- Confirmar compra sem resposta da simulação.
- Expor dados entre usuários.
- Simular eventos diretamente na UI em vez de passar pelo socket.
- Não entregar testes E2E executáveis.

### Pontos de avaliação (100 pontos)

- Fidelidade visual/responsividade 20; fluxos/UX 20; integração/estado 15; tempo real 10; mocking 10; testes 10; acessibilidade 5; performance 5; arquitetura/documentação 5.
- Riscos específicos: frames incompletos ou discrepância visual; checkout sem revalidação/retomada/idempotência; valores ETH imprecisos; URL não restaurável; cache privado contaminado; mocks inconsistentes ou não reproduzíveis; socket sem reconciliação/versionamento; falhas sem recuperação; falta de baselines/relatórios; metas Lighthouse não medidas/justificadas; setup/deploy/refresh de rotas quebrados.

## Plano de execução em dois dias

O escopo completo é extenso e não há garantia de que seja viável em dois dias. A prioridade abaixo preserva primeiro os fluxos que evitam critérios eliminatórios; cobertura integral de cenários, polish visual e as 12 famílias E2E podem exceder o prazo.

### Dia 1 — estrutura e fluxo principal

1. Inspecionar Figma/assets e configurar React/TypeScript, Router, Query, Axios, Tailwind/shadcn, MSW e scripts essenciais.
2. Definir contratos/erros/fixtures e MSW determinístico, incluindo dois usuários e reset.
3. Implementar shell responsivo, início/catálogo e detalhe com URL state, loading/empty/error e REST.
4. Implementar sessão (cadastro/login/logout/refresh/guards) e isolamento por usuário.
5. Implementar favoritos e carrinho básico, persistência/merge, quantidades e cotação/cupom.

### Dia 2 — compra, evidências e entrega

1. Implementar carteiras e fluxo checkout → pedido idempotente → estado recuperável → recibo condicionado à confirmação.
2. Implementar eventos Socket.IO e MSW para `nft.updated` e `order.updated`, reconexão/reconciliação e cenário de cotação obsoleta.
3. Fechar responsividade/acessibilidade essencial, skeletons e ao menos uma mutation otimista com rollback.
4. Priorizar Playwright: compra completa, catálogo/URL, conta/isolamento, falha/timeout/idempotência e mudança em tempo real; ampliar aos demais casos e baselines conforme tempo.
5. Produzir documentação, validar checkout limpo/build, publicar deploy e executar Lighthouse com três medições por página/perfil se possível.

### O que pode não caber

Todas as combinações de falhas e 12 grupos E2E em desktop/mobile, baselines estáveis para quatro páginas, auditorias Lighthouse completas (24 medições), ajustes até atingir todas as metas, refinamento fiel de cada frame/asset e publicação/validação em ambiente público podem exceder dois dias. São entregáveis do desafio e não devem ser silenciosamente descartados; registrar o que ficou pendente e justificar qualquer meta não atingida.

## Checklist de entrega

### Aplicação e stack

- [x] Fundação visual em React + TypeScript; TanStack Router e TanStack Query configurados; Tailwind e primitives shadcn/ui adaptadas. Axios, REST, Socket.IO/socket.io-client, MSW, Playwright e Lighthouse ainda não integrados ao fluxo funcional.
- [x] Rotas/layouts iniciais e páginas visuais: início, detalhe, carrinho, pagamento, confirmação demonstrativa, login, cadastro, perfil, carteiras e 404.
- [ ] Início, detalhe, carrinho, pagamento, confirmação, login, cadastro, perfil, carteiras e 404; acesso direto/refresh.
- [ ] Fluxos funcionais, guards, recuperação de sessão e isolamento ao logout/troca de usuário.
- [ ] Busca/filtros/ordenação/paginação na URL e histórico; detalhe e favoritos.
- [ ] Carrinho persistente, merge, quantidades, cupom, cotação precisa em ETH.
- [ ] Checkout com carteira/rede simulada, revalidação, nova confirmação, idempotência, estados recuperáveis e recibo snapshot.
- [ ] Eventos socket versionados, deduplicados, reconciliação após reconectar e limpeza de subscriptions.

### Mocks, interface e documentação

- [ ] MSW REST/socket com cenários determinísticos, persistência/reset e configuração no build de demonstração.
- [ ] Estados loading/empty/error/success/background; skeleton shimmer; optimistic update/rollback.
- [ ] Desktop/tablet/mobile (390/768/1440), teclado, foco, semântica, labels, contraste, zoom e movimento reduzido.
- [x] Composição visual da home desktop/mobile refeita e revisada por capturas usando `designFigma.png`; quatro retratos recortados da montagem em `public/artwork/`.
- [ ] Demais frames de `designFigma.png` revisados visualmente; confirmar Figma original/assets-fonte e registrar diferenças/tokens finais.
- [ ] Contratos REST/eventos, política de sessão/carrinho/cache/reconciliação, limitações e decisões documentados em `ARCHITECTURE.md`.
- [ ] README de solução com setup, env, credenciais fictícias, cenários/reset, comandos e reprodução de falhas.
- [ ] Scripts de dev com mocks, build, preview, typecheck, lint, Playwright e Lighthouse.

### Testes, auditoria e publicação

- [ ] 12 grupos Playwright do README; estado isolado; Chromium desktop/mobile; testes REST por MSW e eventos via socket client.
- [ ] Regressão visual início/detalhe/carrinho/pagamento com baselines versionadas.
- [ ] Relatório HTML e traces de falhas.
- [ ] Lighthouse início/detalhe em mobile/desktop, três runs cada, medianas, LCP/CLS/TBT, JSON/HTML, versões/ambiente/condições e análise das metas.
- [ ] Código-fonte, lockfile, assets, mocks, fixtures, testes e configs de auditoria.
- [ ] Deploy público alinhado ao código entregue, acessível na avaliação, com mocks/eventos e refresh de rotas funcionando.
- [ ] Checkout limpo sem serviço privado/backend de produção; link do repositório e URL pública documentados.

## Atualização visual — detalhe do NFT

A tela de detalhe desktop/mobile foi implementada e revisada por capturas locais. Foram conferidos o divisor restrito do cabeçalho e a remoção de likes dos cards, preservando Favoritar no detalhe por exigência do README. O estado/persistência de favoritos, adicionar ao carrinho, escolha real de edição e compra continuam pendentes. Build passou; ainda faltam testes funcionais, estados de API e regressão visual automatizada.

## Refinamento do detalhe — 2026-10-27

Recalibrados largura e alinhamento da coluna direita no desktop, galeria e miniaturas, ritmo vertical dos metadados e ações. No mobile, área de mídia, texto, chips e barra de compra foram dimensionados para a referência enviada em 414×950. A galeria relacionada segue a ordem exibida no design. Resultado revisado em capturas desktop (1442×2252) e mobile (414×950); build aprovado. Os controles de zoom, edição, compartilhar e compra ainda são visuais.

### Ajuste dos cards relacionados e elementos compartilhados

Nome e preço dos NFTs relacionados ficam abaixo da imagem em linhas separadas e com fonte maior. O divisor do cabeçalho aparece apenas na home. O campo de e-mail do rodapé usa um marrom mais claro. Alterações conferidas por captura; ações de compra e favoritos continuam sem integração funcional.

### Correção final dos cards e rodapé

A moldura dos NFTs relacionados agora cobre somente as imagens. Nome e preço ficam fora dela, sobre o fundo da página. Textos do rodapé desktop aumentados levemente. Resultado conferido em captura e `npm run build` aprovado.

### Alinhamento final do rodapé

Os três círculos de benefícios foram alinhados à esquerda com os respectivos títulos e nivelados entre si. O copyright agora é branco e tem espaçamento entre letras ligeiramente maior. Conferência visual e build concluídos.

### Atualização visual do carrinho

A página foi recomposta para as referências desktop/mobile: tabela e resumo lado a lado no desktop, recomendações abaixo; no mobile, cabeçalho de retorno, cartões compactos e resumo de compra fixo no rodapé da tela. Os dados de quantidade, taxas, cupom e totais são demonstração visual. Integração do carrinho, aplicação de cupom e checkout continuam pendentes.

As recomendações do carrinho reutilizam os estilos da seção de coleção relacionada do detalhe do NFT para manter cards, título, grade e espaçamentos consistentes.

### Atualização visual do checkout

Desktop: formulário do perfil do colecionador ao lado do resumo de NFTs, taxas, opções de carteira e confirmação. Mobile: fluxo dedicado de seleção de carteira com endereços salvos, provedores, total e botão fixo inferior. Valores e seleções são demonstrativos; validação, conexão de carteiras e pagamento permanecem pendentes.

### Atualização visual da autenticação

Login e cadastro usam modal desktop escuro sobre a tela de fundo, com abas e dimensões reduzidas. No mobile, o painel mantém o fundo escuro em tela dedicada, com inputs e espaçamentos compactos nos dispositivos estreitos. Capturas de ambas as rotas conferidas; integração de autenticação permanece pendente.

Os modais desktop de login e cadastro receberam um aumento leve de dimensões e controles, mantendo o layout mobile inalterado.

Os campos de login agora usam o mesmo fundo e a mesma borda dos campos de cadastro, inclusive ao receber foco.

O contêiner mobile da home recebe filete marrom contínuo nos cantos e nas laterais para eliminar trechos sem acabamento na borda.

A autenticação mobile ocupa toda a viewport, sem faixas externas nos cantos; campos preenchidos automaticamente mantêm o tema escuro.

No desktop de autenticação, o texto de alternância de conta foi removido e os ícones sociais ganharam as cores de marca; no mobile o link de alternância permanece.

### Carteiras da conta

Tela desktop da carteira principal e da carteira secundária alinhada à referência enviada; layout mobile empilha o formulário e preserva a navegação lateral rolável. Ações de salvar e adicionar ainda não persistem dados.

Os modais desktop de login e cadastro foram ampliados para 370px, com campos e botões maiores; o layout mobile permanece em tela cheia.

Os modais desktop de login e cadastro agora têm até 390px de largura, altura e controles ampliados, com centro vertical em 49% da viewport. O layout mobile permanece em tela cheia.
