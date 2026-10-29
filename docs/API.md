# Camada REST simulada

## Ativação e configuração

O MSW inicia antes do React e intercepta as chamadas em desenvolvimento por padrão. Builds comuns de produção deixam os mocks desligados; `VITE_ENABLE_MOCKS=true` é um opt-in explícito para build de demonstração/teste, e `VITE_ENABLE_MOCKS=false` desativa a simulação. `VITE_API_BASE_URL` altera a base do Axios; o padrão de navegador é `/api`.

O arquivo `public/mockServiceWorker.js` é gerado pelo MSW. O banco simulado mantém dados em memória e grava o estado no armazenamento local do navegador quando disponível; o reset restaura as fixtures iniciais. Em Node, os testes usam estado em memória e chamam `resetMockDatabase()` antes de cada caso.

## Credenciais fictícias

| E-mail            | Senha         |
| ----------------- | ------------- |
| `alex@kurio.test` | `Kurio123!`   |
| `sam@kurio.test`  | `Collect123!` |

As fixtures persistem somente hashes SHA-256 das senhas. A implementação é uma simulação para demonstração e não substitui autenticação ou armazenamento seguro de produção.

## Recursos REST

Todas as rotas usam o prefixo `/api`. Erros seguem `{ code, message, fields? }`; o cliente Axios os converte para `ApiError` com status, código e erros por campo.

| Recurso             | Operações                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| NFTs                | `GET /nfts`, `GET /nfts/:id`; busca, categoria, rede, faixa ETH, ordenação e paginação por query string |
| Coleções            | `GET /collections`                                                                                      |
| Sessão              | `POST /auth/login`, `POST /auth/register`, `GET /auth/session`, `POST /auth/logout`                     |
| Perfil              | `GET/PATCH /profile`, `PUT /profile/avatar`, `PUT /profile/password`                                    |
| Favoritos           | `GET /favorites`, `PUT/DELETE /favorites/:nftId`                                                        |
| Carrinho            | `GET /cart`, `POST /cart/items`, `PATCH/DELETE /cart/items/:nftId`, `POST/DELETE /cart/coupon`          |
| Cotação             | `POST /checkout/quote`                                                                                  |
| Carteiras           | `GET/POST /wallets`, `PATCH /wallets/:walletId`                                                         |
| Pedidos             | `POST /orders` com `Idempotency-Key`, `GET /orders`, `GET /orders/:orderId`                             |
| Reset demonstrativo | `POST /__mock/reset`                                                                                    |

Login e cadastro retornam token bearer. O Axios persiste token/identificador do usuário no navegador e envia `Authorization` e `X-Guest-Id`; autenticação transfere itens do carrinho visitante para a conta. Favoritos, carrinho autenticado, perfil, carteiras e pedidos são separados por usuário.

## Erros e cenários

Envie `X-Mock-Scenario` para controlar a resposta sem alterar os componentes:

| Cenário                | Resultado                                                                 |
| ---------------------- | ------------------------------------------------------------------------- |
| `slow`                 | Adiciona latência de 650 ms                                               |
| `network-error`        | Simula falha de conexão                                                   |
| `server-error`         | HTTP 503 determinístico                                                   |
| `session-expired`      | HTTP 401 para recursos que exigem sessão                                  |
| `payment-declined`     | Cria pedido recusado e preserva o carrinho                                |
| `order-pending`        | Cria pedido pendente                                                      |
| `timeout-after-create` | Registra pedido e simula timeout; repetir a chave recupera o mesmo pedido |
| `price-changed`         | Altera preço antes de criar pedido e retorna conflito                  |
| `stock-changed`         | Esgota edição antes de criar pedido e retorna conflito                |

Cupons demonstrativos: `KURIO10` (10% de desconto) e `EXPIRED` (expirado); outros códigos são inválidos. NFTs, cotação, pedido e carrinho compartilham o mesmo banco. Valores ETH são strings decimais; cálculos usam unidades inteiras de 10⁻¹⁸ ETH.

## Limites do estado documentado
As telas de catalogo, detalhe, autenticacao, perfil e carrinho ja consomem a camada REST e os hooks descritos acima. A secao Checkout e pedidos, ao final deste documento, registra a integracao desta etapa. Socket.IO, cotacao fiat e persistencia de nota/codigo de indicacao nao fazem parte do contrato integrado.

## Atualização: autenticação e carrinho via interface

A cotação `POST /api/checkout/quote` agora aceita também a identidade de visitante enviada em `X-Guest-Id`. A cotação é vinculada ao proprietário do carrinho; a criação do pedido permanece autenticada e valida que a cotação pertence à conta. Após login, o carrinho do visitante é mesclado e uma nova cotação da conta é carregada.

Login e cadastro usam `useLogin` e `useRegister`. Login social e recuperação de senha permanecem indisponíveis, e os respectivos botões estão desativados. As rotas de perfil, carteiras, checkout e confirmação verificam a sessão; erros 401 limpam a credencial no cliente Axios e redirecionam para login preservando o caminho permitido.

A tela de perfil carrega e salva dados do usuário, permite trocar senha e oferece logout que remove dados privados do cache. A tela do carrinho carrega a API, permite alterar quantidades, remover itens, aplicar/remover cupom e mostra subtotal, desconto, taxa e total da cotação em strings ETH. O carrinho refaz a consulta ao ser aberto para conferir preços e disponibilidade atuais.

## Checkout e pedidos (2026-10-28)

`GET/POST /api/wallets` e `PATCH /api/wallets/:walletId` isolam carteiras pelo usuÃ¡rio da sessÃ£o. A tela permite salvar a carteira principal, cadastrar uma carteira adicional, promovÃª-la a principal e conferir o saldo simulado. Ao cadastrar a primeira carteira, ela Ã© definida como principal; a seguinte recebe saldo demonstrativo de `0.25 ETH`. O saldo nÃ£o vem de uma blockchain e nÃ£o deve ser tratado como saldo real.

O checkout usa `useCart`, `useCheckoutQuote`, `useProfile`, `useWallets` e `useCreateOrder`. `POST /api/orders` recebe `quoteId` e `walletId`; o servidor valida a sessao, propriedade/validade da cotacao, carteira, estoque e preco atual. O pedido guarda snapshot de itens, quantidades, valores unitarios e de linha, subtotal, desconto, taxa, total, carteira, status e identificacao simulada.

Antes do envio a pagina atualiza a cotacao. Se itens ou totais diferirem do resumo mostrado, exibe o resumo novo e exige outra confirmacao. Chave idempotente e ID da cotacao ficam juntos em `sessionStorage`, por usuario, versao do carrinho e carteira. Um retry apos timeout reutiliza a mesma tentativa. O carrinho e preservado quando a resposta se perde; no retry a API recupera o mesmo pedido e limpa os itens. Pedido recusado preserva o carrinho.

`GET /api/orders` abastece `/account/orders`; `GET /api/orders/:orderId` abastece `/orders/:orderId/confirmation` inclusive apos refresh. Ambos retornam apenas pedidos do usuario autenticado. O resultado distingue pendente, confirmado e recusado; somente `confirmed` mostra mensagem de confirmacao. A interface identifica que a operacao e simulada e que nenhum ETH real e transferido.

Os cenarios `price-changed` e `stock-changed` exercitam validacao no servidor; `timeout-after-create` simula resposta perdida apos gravar o pedido. Os valores continuam em ETH e usam unidades inteiras via implementacao decimal existente. Este contrato nao inclui cotacao cambial. Nota opcional e codigo de indicacao mostrados no visual nao fazem parte de `OrderInput` e nao sao persistidos.

## Comunicacao em tempo real (2026-10-28)

O preview browser nao implementa nem encaminha o protocolo WebSocket. Nos modos Playwright, `VITE_REALTIME_URL` aponta o `socket.io-client` diretamente ao sidecar em `127.0.0.1:5188`, iniciado por `webServer` em `playwright.browser.config.ts` e `playwright.e2e.config.ts`. MSW fica responsavel por REST e persistencia demonstrativa. `POST /api/__mock/realtime/nft` e `/api/__mock/realtime/order` sao endpoints de fixture para alterar estado MSW; eles nao substituem eventos Socket.IO. Eventos que devem atualizar a interface passam pelo sidecar real e seus testes.

### Cenários de teste no navegador

Com os mocks ativos, a aplicação lê `kurio.mock.scenario` do `localStorage` e envia o cenário permitido pelo cabeçalho `X-Mock-Scenario`. Isso permite testar falhas por meio da interface sem adicionar caminhos de negócio nos componentes. `POST /api/__mock/reset` ignora o cenário. Essa opção só tem efeito no modo mock; não use esses valores com backend real.

`npm run test:e2e` constrói a aplicação e executa os casos de `tests/browser` e `tests/e2e` em Chromium com preview de produção. Cada novo cenário E2E reinicia o banco MSW e o estado Socket.IO antes de interagir com a UI. Nenhum serviço ou conta externa é usado. O teardown global encerra o sidecar e o preview; o teste de indisponibilidade pausa e retoma o socket em vez de encerrar o servidor no meio da suíte. O HTML fica em `playwright-report-e2e`, com trace e screenshot preservados nas falhas.

Os dois primeiros casos de `tests/browser/msw.browser.spec.ts` são smoke tests de rede MSW no browser e não interagem com a interface. Os demais casos browser e E2E fazem asserções visíveis na UI. O relatório de execução diferencia essas categorias.

O projeto inclui um servidor Socket.IO local separado da aplicacao Vite e dos handlers REST do MSW. Em desenvolvimento, inicie `npm run dev` e `npm run realtime:dev` em terminais separados. A aplicacao usa `http://127.0.0.1:5173` e o servidor de eventos usa `http://127.0.0.1:5188`. O servidor aceita `REALTIME_HOST`, `REALTIME_PORT`, `REALTIME_ALLOWED_ORIGIN` e `REALTIME_DEMO_ADMIN_TOKEN`; o cliente pode apontar para outro endereco com `VITE_REALTIME_URL` e desabilitar a sincronizacao de estado com `VITE_REALTIME_STATE_SYNC=false`.

Eventos servidor → cliente:

| Evento | Payload | Escopo |
| --- | --- | --- |
| `nft.updated` | `{ eventId, sequence, nftId, price, availableQuantity, version, occurredAt }` | Publico; preco ETH em string e estoque inteiro nao negativo |
| `order.updated` | `{ eventId, sequence, orderId, userId, status, transactionId, version, occurredAt }` | Sala privada derivada da sessao autenticada |

Exemplo de `nft.updated`: `{"eventId":"nft:emerald-ape-042:1","sequence":1,"nftId":"emerald-ape-042","price":"2.75","availableQuantity":4,"version":1,"occurredAt":"2026-10-28T12:00:00.000Z"}`. O estado e deterministico ate ser alterado por outro cenario ou resetado. Para demonstrar atualizacao, envie `POST http://127.0.0.1:5188/__demo/trigger` com `X-Demo-Admin: local-demo-only-token` e corpo `{"event":"nft.updated","nftId":"emerald-ape-042","price":"2.75","availableQuantity":4}`. Para pedidos, o corpo tambem exige `sessionToken`, `orderId` e `status`; o servidor deriva a sala do usuario a partir da identidade assinada, nunca de um userId enviado pelo socket. `GET /__demo/health` identifica a simulacao. `POST /__demo/reset` reinicia os eventos e `POST /__demo/shutdown` encerra o processo local para testar indisponibilidade. Endpoints administrativos sao apenas para demonstracao local.

O singleton em `src/realtime/client.ts` centraliza a conexao; `RealtimeProvider` gerencia reconexao, listeners e estado de conexao. Um evento com versao nova atualiza catalogo, detalhe e carrinho no TanStack Query e invalida cotacoes relacionadas. O MSW le snapshots publicos de NFTs e, em chamadas autenticadas, snapshots de pedidos do usuario antes de responder catalogo, detalhe, carrinho/cotacao ou pedidos. A API REST continua sendo a fonte inicial e valida preco e estoque no checkout. Se o servidor cair, a interface indica erro/desconexao, tenta reconectar e continua atendendo pela API REST; eventos podem ficar indisponiveis ate a reconexao.

### Limites de seguranca da simulacao

O servidor valida assinatura e expiracao do token Socket.IO, deriva o usuario da identidade assinada e nao aceita um identificador enviado pelo socket para escolher sala. Snapshots privados sao filtrados pelo usuario do token, e o MSW verifica novamente a propriedade do pedido antes de aplicar mudancas. Testes cobrem duas sessoes simultaneas e token expirado.

No modo local, `POST /__demo/session-token` assina no servidor um token Socket de curta duracao com uma chave aleatoria gerada em memoria ao iniciar o processo. A rota aceita um `userId` do mock e, portanto, serve apenas para demonstracao; ela nao autentica a identidade real do usuario. O token REST e opaco e separado. O endpoint de emissao fica desativado quando `NODE_ENV=production`.

Em producao, o servidor Socket.IO exige JWT HS256 emitido por um backend confiavel e valida assinatura, `sub` e `exp` usando `REALTIME_JWT_SECRET`, mantido exclusivamente no ambiente do servidor. O backend emissor deve autenticar o usuario e autorizar a inscricao; o sidecar sozinho nao substitui essa autorizacao nem um armazenamento de pedidos real. Configure `REALTIME_ALLOWED_ORIGIN` com a lista exata de origins permitidos; tanto o Socket.IO quanto as respostas HTTP do sidecar usam essa lista. Nunca use `VITE_*` para segredos. A demo administrativa local e os dados em memoria nao sao uma fronteira de seguranca para ativos reais.

O frontend de producao nao inicia MSW por padrao e o cliente Axios usa `/api` como base relativa quando `VITE_API_BASE_URL` nao esta definido. O socket de producao fica desativado sem `VITE_REALTIME_URL`; enderecos locais usados por testes/auditoria nao sao defaults de producao. Literais `localhost` observados no bundle final pertencem a fallbacks genéricos de URL do TanStack Router/Axios, não a endpoints configurados pelo Nexora.

### Validacao Socket.IO

`npm run test:realtime` executa testes do protocolo, reconexao, validacao de versoes, limpeza de listeners e isolamento de pedidos. `npm run test:mock-browser` cobre a propagacao de preco/estoque para a interface e a API REST, e a continuidade da API quando o servidor de eventos cai. A suite browser constroi a aplicacao e usa um preview local. `npm run build` usa importacao dinamica por rota para separar as telas; os tamanhos e resultados Lighthouse medidos nesta etapa estao registrados em `docs/PROGRESSO.md` e `artifacts/lighthouse/summary.json`.

### Ajustes de versao e execucao da suite browser

Versoes de eventos sao monotonicas tambem apos reiniciar o processo local; o identificador e a versao do recurso impedem que um estado antigo volte sobre uma atualizacao recente. `test:mock-browser` faz build de producao e serve `dist` por `scripts/browser-preview-server.mjs`; o ultimo teste fecha esse preview para nao deixar a porta de teste aberta no Windows.

O servidor e os testes realtime usam a remocao nativa de tipos do Node; requerem Node.js 22.6 ou superior.
