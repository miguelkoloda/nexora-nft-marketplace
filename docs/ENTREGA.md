# Otimização final e preparação de entrega

Auditoria realizada em 29/10/2026, sem publicar serviços ou alterar checkout/carteira.

## Performance

Inspeção do elemento LCP confirmou que a primeira arte NFT, `emerald-ape`, era servida como PNG de 435.169 bytes, apesar de ser uma imagem local quadrada de 450 × 450. Foi criada uma variante WebP visualmente equivalente de 44.266 bytes (89,8% menor). O componente tenta WebP e usa PNG como fallback; o HTML faz preload somente da variante LCP. As outras artes não foram convertidas nesta rodada e a imagem LCP não recebeu lazy loading.

Lighthouse 12.8.2 / Chrome 156, três execuções por rota e perfil, em build local de auditoria:

| Rota / perfil | Performance antes → depois | LCP antes → depois | A11y depois | CLS depois | TBT depois |
|---|---:|---:|---:|---:|---:|
| Início desktop | 96 → 97 | 1413 → 1187 ms | 100 | 0.00057 | 0 ms |
| Início mobile | 70 → 79 | 5896 → 4313 ms | 100 | 0.00029 | 154 ms |
| Detalhe desktop | 96 → 98 | 1319 → 1069 ms | 100 | 0.01668 | 0 ms |
| Detalhe mobile | 73 → 81 | 5780 → 4191 ms | 100 | 0.01744 | 143 ms |

O LCP mobile melhorou 1,58 s (26,8%) na home e 1,59 s (27,5%) no detalhe, mas ainda supera a meta de 2,5 s. O atraso restante é dominado pela renderização após a descoberta da imagem e pela inicialização/dados do modo demonstrativo. O detalhe mantém CLS superior ao da home, embora abaixo de 0,1. Um experimento de inicialização assíncrona dos mocks piorou as métricas e foi removido.

Os valores anteriores estão em `artifacts/lighthouse/before-final-optimization.json`; as 12 medições finais e suas medianas estão em `artifacts/lighthouse/summary.json`. São medições locais sob throttling Lighthouse, não previsões de produção.

## Build e validação do modo demo

`npm run build` sem flags de mock passou e gera produção com MSW desligado por padrão. Esse build requer uma API REST real para os fluxos de dados. Para avaliar a versão demonstrativa, o build foi produzido com `VITE_ENABLE_MOCKS=true` e `VITE_REALTIME_URL=http://127.0.0.1:5188`; os 18 testes Playwright de browser foram executados diretamente contra `dist` servido pelo preview: **18/18 passaram**. A cobertura inclui REST, busca/filtros, rotas de detalhe, login/cadastro mock, sessão, favoritos, carrinho, carteiras, checkout mobile, recibo e recarga, falhas e reconexão Socket.IO.

O armazenamento demonstrativo sobrevive recargas locais no mesmo navegador; não sincroniza usuários ou navegadores e não persiste em banco. Os 40 testes E2E adicionais incluem cenários de histórico, eventos privados, recuperação e idempotência no modo browser-test. A validação foi automatizada e local; não houve inspeção manual de browser nem teste de URL pública.

## Deploy preparado

[`render.yaml`](../render.yaml) configura um site estático Vite com rewrite SPA e um serviço Node independente para Socket.IO. Render documenta suporte a sites estáticos com rewrites e WebSockets em Web Services; o serviço deve usar HTTPS/WSS e origin restrita ([Static Sites](https://render.com/docs/static-sites), [WebSockets](https://render.com/docs/websocket), [Web Services](https://render.com/docs/web-services), [Blueprint spec](https://render.com/docs/blueprint-spec)).

O sidecar prioriza `PORT` definido pelo provedor, depois `REALTIME_PORT` e finalmente 5188; o host de produção padrão é `0.0.0.0`. O projeto declara Node >=22.6 para a remoção nativa de tipos usada no comando de start. O Blueprint usa plano `free`, que pode suspender o serviço após inatividade; escolha um plano sempre ativo apenas depois de conferir preço e necessidade.

Depois de importar o Blueprint manualmente:

1. Configure `REALTIME_ALLOWED_ORIGIN` no sidecar com a origem HTTPS exata do frontend.
2. Configure `VITE_REALTIME_URL` no site com a URL HTTPS do sidecar e faça novo deploy do site para incorporar o valor ao bundle.
3. Faça acesso direto e refresh em `/` e `/nft/emerald-ape-042`; verifique conexões, logs e console na infraestrutura publicada.

O Blueprint deixa MSW explicitamente ativo no site para demonstração e gera `REALTIME_JWT_SECRET` apenas no servidor. Ele não cria API REST nem emissor confiável de JWT; eventos privados do pedido não podem usar a identidade do login mock. Dados do catálogo/pedido continuam locais ao navegador e o sidecar não fornece durabilidade. Para produção real, integre API/banco persistentes e autenticação que emita JWT, desative MSW e mantenha segredos fora de qualquer `VITE_*`. Nenhum serviço foi provisionado e nenhuma URL foi inventada.

## Requisitos e pendências

- **Implementado para demonstração:** catálogo, pesquisa, filtros/ordenação/paginação por URL, detalhe, favoritos, carrinho, cupons, cadastro/login mock, perfil/carteiras mock, checkout/recibo, cenários de erro, atualizações Socket.IO e testes Playwright responsivos. E2E browser-test: 40/40; browser mock contra build de produção: 18/18.
- **Parcial:** estado apenas MSW/localStorage; Socket.IO usa sidecar real, não o binding MSW específico requerido; checkout/carteira simulados; acessibilidade Lighthouse e Playwright não substituem auditoria WCAG manual; LCP mobile continua 4,2–4,3 s.
- **Ausente ou externo:** deploy publicado, API REST/banco persistente, autenticação real/emissor JWT, pagamento/blockchain reais, integração abrangente shadcn/ui, binding MSW Socket.IO, upload de avatar e auditoria axe/WCAG completa. Login social, recuperação de senha e conversão fiat não fazem parte das integrações obrigatórias do desafio.

## Comandos

Desenvolvimento local, em terminais separados:

```bash
npm ci
npm run realtime:dev
npm run dev
```

Build demonstrativo de produção no PowerShell:

```powershell
$env:VITE_ENABLE_MOCKS = 'true'
$env:VITE_REALTIME_URL = 'http://127.0.0.1:5188'
npm run build
Remove-Item Env:VITE_ENABLE_MOCKS
Remove-Item Env:VITE_REALTIME_URL
```

Depois execute `npm run realtime:dev` e `npm run preview -- --host 127.0.0.1` em terminais separados. Para executar os testes de browser contra esse `dist` sem rebuild de modo de teste, use `npx playwright test --config=playwright.browser.config.ts`.

## Rodada final: Vercel e medição pós-ajustes (29/10/2026)

Foi adicionado `vercel.json` com rewrite SPA para `/index.html`, necessário para abrir e atualizar diretamente rotas como `/nft/emerald-ape-042`. O Vercel detecta o preset Vite; o build é `npm run build` e a saída é `dist`. O passo a passo e as variáveis ficam no README. A configuração segue a documentação oficial de [Vite no Vercel](https://vercel.com/docs/frameworks/frontend/vite) e [rewrites](https://vercel.com/docs/routing/rewrites).

A home agora usa uma única consulta inicial de catálogo e, apenas no modo mock, mantém a primeira arte seed visível enquanto o REST simulado carrega; o restante do conteúdo permanece em skeleton. Foram adicionados teste de browser para esse estado e coleta de FCP, transferência de scripts, elemento LCP e fases do LCP no auditor Lighthouse.

Lighthouse 12.8.2 / Chrome 156, três medições por rota e perfil. Esta rodada compara a build local anterior a estas alterações com a build de auditoria atual; não representa produção publicada:

| Rota / perfil | Performance antes → depois | LCP mediano antes → depois | FCP mediano depois | TBT mediano depois |
|---|---:|---:|---:|---:|
| Home desktop | 97 → 98 | 1187 → 983 ms | 675 ms | 0 ms |
| Home mobile | 79 → 81 | 4313 → 4169 ms | 2538 ms | 166 ms |
| Detalhe desktop | 98 → 98 | 1069 → 1116 ms | 637 ms | 0 ms |
| Detalhe mobile | 81 → 82 | 4191 → 4082 ms | 2537 ms | 135 ms |

A melhora mobile foi modesta: ~144 ms na home e ~109 ms no detalhe, com variação entre amostras. A meta de LCP mobile de 2,5 s continua não atingida. O LCP da home desktop é a arte do hero; no mobile é a primeira arte do catálogo; no detalhe é a imagem principal. Em todos, o atraso de rede para o recurso foi zero na auditoria e predominou o atraso de renderização. Lighthouse de navegação não reportou INP (`null`); TBT é apenas uma métrica de laboratório e não substitui INP de usuários reais. Resultados detalhados antes/depois estão em `artifacts/lighthouse/before-vercel-optimization.json` e `artifacts/lighthouse/summary.json`.

## Socket.IO e limites da hospedagem

O projeto tem Vite frontend e um processo Node/Socket.IO standalone. O rewrite SPA não hospeda esse processo, API REST, nem armazenamento compartilhado. O demo pode usar `VITE_ENABLE_MOCKS=true`; `VITE_REALTIME_URL` só deve apontar para um serviço Socket.IO realmente publicado. Não coloque segredos em variáveis `VITE_*`. A plataforma Vercel documenta suporte atual a WebSockets em Functions, com limites de duração e necessidade de coordenação externa para estado compartilhado; adaptar este servidor standalone exige trabalho de arquitetura e não é feito por esta configuração ([WebSockets](https://vercel.com/kb/guide/do-vercel-serverless-functions-support-websocket-connections), [limites](https://vercel.com/docs/limits)).

## Validações desta rodada e publicação manual

- `npm run typecheck`: passou.
- `npm run lint`: passou.
- `npm run test:api`: 25/25.
- `npm run test:realtime`: 8/8.
- `npm run test:e2e`: 41/41, incluindo 12 snapshots visuais.
- Build demo com `VITE_ENABLE_MOCKS=true` e `VITE_REALTIME_URL=http://127.0.0.1:5188`: passou; `npx playwright test --config=playwright.browser.config.ts` contra o `dist`: 19/19.
- `npm run build` padrão, sem opt-in de mocks: passou.
- `vercel.json` JSON e rewrite verificados; `git diff --check` passou (aviso Git de conversão LF/CRLF no README).

Para publicar manualmente quando decidir: importe o repositório no painel Vercel; use Framework Preset Vite, raiz do projeto, build `npm run build` e output `dist`; configure apenas as variáveis públicas adequadas ao ambiente antes do deploy. Para demo, `VITE_ENABLE_MOCKS=true`; para backend real, configure `VITE_API_BASE_URL` e `VITE_REALTIME_URL` com serviços publicados. Depois confira `/`, `/nft/emerald-ape-042` e refresh direto nessa rota, além de console/rede. Esta rodada não publicou deploy nem alterou configurações externas.
