import { expect, test } from '@playwright/test'

test('MSW intercepta REST no navegador com os dados demonstrativos', async ({
  page,
}) => {
  await page.goto('/')
  await page.waitForFunction(
    () => document.documentElement.dataset.mockWorkerReady === 'true',
  )
  const response = await page.evaluate(async () => {
    const result = await fetch('/api/nfts?page=1&pageSize=1')
    return { status: result.status, body: await result.json() }
  })

  expect(response.status).toBe(200)
  expect(response.body.items).toHaveLength(1)
  expect(response.body.items[0].id).toBe('emerald-ape-042')
})

test('o estado do carrinho simulado sobrevive ao refresh', async ({ page }) => {
  await page.goto('/')
  await page.waitForFunction(
    () => document.documentElement.dataset.mockWorkerReady === 'true',
  )
  await page.evaluate(async () => {
    await fetch('/api/__mock/reset', { method: 'POST' })
    await fetch('/api/cart/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nftId: 'emerald-ape-042', quantity: 2 }),
    })
  })

  await page.reload()
  await page.waitForFunction(
    () => document.documentElement.dataset.mockWorkerReady === 'true',
  )
  const cart = await page.evaluate(async () =>
    (await fetch('/api/cart')).json(),
  )
  expect(cart.items).toHaveLength(1)
  expect(cart.items[0].quantity).toBe(2)
})

test('catálogo pesquisa NFTs e mantém a busca na URL', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.waitForFunction(
    () => document.documentElement.dataset.mockWorkerReady === 'true',
  )
  await page.getByRole('textbox', { name: 'Buscar NFTs' }).fill('nomad')
  await expect(
    page.getByRole('link', { name: 'Sage Nomad #009', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Violet Nomad #314', exact: true }),
  ).toBeVisible()
  await expect(page).toHaveURL(/search=nomad/)
})

test('contagens das categorias correspondem ao catálogo seed e aos resultados filtrados', async ({
  page,
}) => {
  await page.goto('/')
  await page.waitForFunction(
    () => document.documentElement.dataset.mockWorkerReady === 'true',
  )
  const categoryButton = page
    .getByRole('button', { name: /Arte digital/ })
    .first()
  await expect(categoryButton).toContainText('(3)')
  await categoryButton.click()
  await expect(page.locator('.nft-card')).toHaveCount(3)
  await expect(categoryButton).toHaveAttribute('aria-pressed', 'true')
})

test('preview da primeira arte da home aparece enquanto REST responde', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem('kurio.mock.scenario', 'slow'),
  )
  await page.goto('/')
  const heroPreview = page.locator('.hero-art-link img')
  await expect(heroPreview).toBeVisible()
  await expect
    .poll(() =>
      heroPreview.evaluate((image: HTMLImageElement) => image.naturalWidth),
    )
    .toBeGreaterThan(0)
  const preview = page.locator('.nft-card-loading-preview img')
  await expect(preview).toBeVisible()
  await expect
    .poll(() => preview.evaluate((image: HTMLImageElement) => image.naturalWidth))
    .toBeGreaterThan(0)
  await expect(page.locator('.catalog-loading')).toHaveCount(0)
})

test('filtros de categoria e rede atualizam o catálogo e a URL', async ({
  page,
}) => {
  await page.goto('/')
  await page.waitForFunction(
    () => document.documentElement.dataset.mockWorkerReady === 'true',
  )
  await page.getByRole('button', { name: 'Arte 3D' }).first().click()
  await page.getByRole('button', { name: 'Ethereum' }).first().click()
  await expect(
    page.getByRole('link', { name: 'Neon Vessel #552', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Ivory Baron #088', exact: true }),
  ).toHaveCount(0)
  await expect(page).toHaveURL(/category=Arte\+3D/)
  await expect(page).toHaveURL(/network=Ethereum/)
})

test('detalhe carrega pelo identificador e trata NFT ausente', async ({
  page,
}) => {
  await page.goto('/nft/emerald-ape-042')
  await page.waitForFunction(
    () => document.documentElement.dataset.mockWorkerReady === 'true',
  )
  await expect(
    page.getByRole('heading', { name: 'Emerald Ape #042' }),
  ).toBeVisible()
  await page.goto('/nft/not-a-real-nft')
  await expect(
    page.getByRole('heading', { name: 'NFT não encontrado' }),
  ).toBeVisible()
})

test('detalhe adiciona NFT e quantidade ao carrinho pela API', async ({
  page,
}) => {
  await page.goto('/nft/emerald-ape-042')
  await page.waitForFunction(
    () => document.documentElement.dataset.mockWorkerReady === 'true',
  )
  await page.getByRole('button', { name: 'Aumentar quantidade' }).click()
  await page.getByRole('button', { name: 'COMPRAR' }).click()
  await expect(page).toHaveURL(/\/cart$/)
  const cart = await page.evaluate(async () => {
    const guestId = localStorage.getItem('kurio.guest.id') ?? ''
    return (
      await fetch('/api/cart', { headers: { 'X-Guest-Id': guestId } })
    ).json()
  })
  expect(cart.items).toHaveLength(1)
  expect(cart.items[0]).toMatchObject({
    nftId: 'emerald-ape-042',
    quantity: 2,
  })
})

test('favoritos exigem sessão e autenticado pode adicionar/remover', async ({
  page,
}) => {
  await page.goto('/nft/violet-nomad-314')
  await page.waitForFunction(
    () => document.documentElement.dataset.mockWorkerReady === 'true',
  )
  await page.getByRole('button', { name: 'Favoritar' }).click()
  await expect(page).toHaveURL(/login/)

  await page.evaluate(async () => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex@kurio.test', password: 'Kurio123!' }),
    })
    const session = await response.json()
    localStorage.setItem('kurio.session.token', session.token)
    localStorage.setItem('kurio.session.user', session.user.id)
  })
  await page.goto('/nft/violet-nomad-314')
  const favorite = page.getByRole('button', { name: 'Favoritar' })
  await favorite.click()
  await expect(favorite).toHaveAttribute('aria-pressed', 'true')
  await favorite.click()
  await expect(favorite).toHaveAttribute('aria-pressed', 'false')
})

test('área protegida redireciona ao login, recupera sessão e permite logout', async ({
  page,
}) => {
  await page.goto('/account/profile')
  await expect(page).toHaveURL(/login\?.*returnTo/)
  const authForm = page.locator('.auth-form')
  await authForm
    .getByRole('textbox', { name: 'E-mail' })
    .fill('alex@kurio.test')
  await authForm.locator('input[name="password"]').fill('senha-errada')
  await page.locator('.auth-submit').click()
  await expect(page.getByRole('alert')).toContainText('inválidos')

  await authForm.locator('input[name="password"]').fill('Kurio123!')
  await page.locator('.auth-submit').click()
  await expect(page).toHaveURL(/\/account\/profile$/)
  await expect(page.getByRole('heading', { name: 'Meu perfil' })).toBeVisible()
  await expect(
    page.locator('.profile-form').getByRole('textbox', { name: 'E-mail' }),
  ).toHaveValue('alex@kurio.test')

  await page.getByLabel('Nome completo').fill('Alex Atualizado')
  await page.getByRole('button', { name: 'Salvar alterações' }).click()
  await expect(page.getByRole('status')).toContainText('Perfil atualizado')
  await page.reload()
  await expect(page.getByLabel('Nome completo')).toHaveValue('Alex Atualizado')

  await page.getByRole('button', { name: 'Sair' }).click()
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible()
})

test('cadastro rejeita confirmação divergente e cria perfil com sessão persistente', async ({
  page,
}) => {
  await page.goto('/register')
  const authForm = page.locator('.auth-form')
  await authForm.getByLabel('Nome de usuário').fill('novacolecionadora')
  await authForm
    .getByRole('textbox', { name: 'E-mail' })
    .fill('nova@kurio.test')
  await authForm.locator('input[name="password"]').fill('Collector123!')
  await authForm.locator('input[name="confirmation"]').fill('Collector123?')
  await page.locator('.auth-submit').click()
  await expect(page.getByRole('alert')).toContainText('não coincidem')

  await authForm.locator('input[name="confirmation"]').fill('Collector123!')
  await page.locator('.auth-submit').click()
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('link', { name: 'Minha conta' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('link', { name: 'Minha conta' })).toBeVisible()
})

test('carrinho integra vazio, quantidade, cupom, cotação e remoção', async ({
  page,
}) => {
  await page.goto('/cart')
  await expect(
    page.getByRole('heading', { name: 'Seu carrinho está vazio' }),
  ).toBeVisible()

  await page.goto('/nft/emerald-ape-042')
  await page.getByRole('button', { name: 'COMPRAR' }).click()
  await expect(page).toHaveURL(/\/cart$/)
  await expect(
    page.getByRole('link', { name: 'Emerald Ape #042', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText('1.19 ETH', { exact: true }).first(),
  ).toBeVisible()

  await page
    .getByRole('button', { name: 'Aumentar quantidade de Emerald Ape #042' })
    .click()
  await expect(
    page.getByText('2.38 ETH', { exact: true }).first(),
  ).toBeVisible()
  await page.locator('#desktop-coupon').fill('KURIO10')
  await page.getByRole('button', { name: 'Aplicar' }).first().click()
  await expect(page.getByRole('status')).toContainText('Cupom KURIO10 aplicado')
  await expect(
    page.getByText('(-) 0.238 ETH', { exact: true }).first(),
  ).toBeVisible()
  await expect(page.locator('.summary-total strong').first()).toHaveText(
    '2.158 ETH',
  )

  await page.locator('#desktop-coupon').fill('EXPIRED')
  await page.getByRole('button', { name: 'Aplicar' }).first().click()
  await expect(page.getByRole('alert')).toContainText('expirou')
  await page.getByRole('button', { name: 'Remover', exact: true }).click()
  await page.getByRole('button', { name: 'Remover Emerald Ape #042' }).click()
  await expect(
    page.getByRole('heading', { name: 'Seu carrinho está vazio' }),
  ).toBeVisible()
})

test('checkout cria pedido confirmado e confirmação sobrevive ao refresh', async ({
  page,
}) => {
  await page.goto('/')
  await page.waitForFunction(
    () => document.documentElement.dataset.mockWorkerReady === 'true',
  )
  await page.evaluate(async () => {
    await fetch('/api/__mock/reset', { method: 'POST' })
    await fetch('/api/cart/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nftId: 'emerald-ape-042', quantity: 2 }),
    })
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex@kurio.test', password: 'Kurio123!' }),
    })
    const session = await response.json()
    localStorage.setItem('kurio.session.token', session.token)
    localStorage.setItem('kurio.session.user', session.user.id)
  })
  await page.goto('/checkout')
  await expect(
    page.getByText('Subtotal', { exact: true }).first(),
  ).toBeVisible()
  await expect(
    page.getByText('2.38 ETH', { exact: true }).first(),
  ).toBeVisible()
  const displayName = page
    .locator('.checkout-desktop-layout .checkout-profile-grid input')
    .first()
  await displayName.fill('')
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page).toHaveURL('/checkout')
  expect(
    await displayName.evaluate((input: HTMLInputElement) =>
      input.checkValidity(),
    ),
  ).toBe(false)
  await displayName.fill('Alex Morgan')
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page).toHaveURL(/\/orders\/order-\d+\/confirmation$/)
  await expect(page.getByText(/PEDIDO CONFIRMADO/)).toBeVisible()
  await expect(page.getByText(/Nenhum ETH foi transferido/)).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Sua próxima história começa aqui.' }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Meus pedidos' }).click()
  await expect(page).toHaveURL('/account/orders')
  await expect(page.getByText('Confirmado', { exact: true })).toBeVisible()
})

test('checkout protegido informa carrinho vazio e não cria pedido', async ({
  page,
}) => {
  await page.goto('/')
  await page.waitForFunction(
    () => document.documentElement.dataset.mockWorkerReady === 'true',
  )
  await page.evaluate(async () => {
    await fetch('/api/__mock/reset', { method: 'POST' })
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex@kurio.test', password: 'Kurio123!' }),
    })
    const session = await response.json()
    localStorage.setItem('kurio.session.token', session.token)
    localStorage.setItem('kurio.session.user', session.user.id)
  })
  await page.goto('/checkout')
  await expect(
    page.getByRole('heading', { name: 'Seu carrinho está vazio' }),
  ).toBeVisible()
  const orders = await page.evaluate(async () => {
    const token = localStorage.getItem('kurio.session.token')
    return (
      await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` },
      })
    ).json()
  })
  expect(orders).toHaveLength(0)
})

test('checkout mobile permite selecionar carteira e finalizar pedido', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.waitForFunction(
    () => document.documentElement.dataset.mockWorkerReady === 'true',
  )
  await page.evaluate(async () => {
    await fetch('/api/__mock/reset', { method: 'POST' })
    await fetch('/api/cart/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nftId: 'emerald-ape-042', quantity: 1 }),
    })
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex@kurio.test', password: 'Kurio123!' }),
    })
    const session = await response.json()
    localStorage.setItem('kurio.session.token', session.token)
    localStorage.setItem('kurio.session.user', session.user.id)
  })
  await page.goto('/checkout')
  await expect(
    page.getByRole('heading', { name: 'Pagamento com carteira' }),
  ).toBeVisible()
  await expect(page.locator('.checkout-desktop-layout')).toBeHidden()
  await expect(page.locator('.checkout-saved-wallet').first()).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Confirmar compra' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page).toHaveURL(/\/orders\/order-\d+\/confirmation$/)
  await expect(page.getByText(/PEDIDO CONFIRMADO/)).toBeVisible()
})

test('adiciona carteira secundaria pela interface e persiste apos recarregar', async ({
  page,
}) => {
  await page.goto('/')
  await page.waitForFunction(
    () => document.documentElement.dataset.mockWorkerReady === 'true',
  )
  await page.evaluate(async () => {
    await fetch('/api/__mock/reset', { method: 'POST' })
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sam@kurio.test', password: 'Collect123!' }),
    })
    const session = await response.json()
    localStorage.setItem('kurio.session.token', session.token)
    localStorage.setItem('kurio.session.user', session.user.id)
  })

  await page.goto('/account/wallets')
  await page.getByRole('button', { name: 'Adicionar carteira' }).click()
  await page.getByLabel('Apelido da carteira').fill('Reserva de teste')
  await page
    .getByLabel('Endereço da carteira')
    .fill('0x1234567890abcdef1234567890abcdef12345678')
  await page.getByRole('button', { name: 'Adicionar carteira' }).last().click()
  await expect(page.getByRole('status')).toContainText(
    'Carteira secundária adicionada com sucesso.',
  )
  await expect(page.getByText('Reserva de teste')).toBeVisible()
  await expect(page.getByText('0.25 ETH', { exact: true })).toBeVisible()

  await page.reload()
  await expect(page.getByText('Reserva de teste')).toBeVisible()
  const wallets = await page.evaluate(async () => {
    const token = localStorage.getItem('kurio.session.token')
    return (
      await fetch('/api/wallets', {
        headers: { Authorization: `Bearer ${token}` },
      })
    ).json()
  })
  expect(wallets).toHaveLength(2)
  expect(wallets.find((wallet: { label: string }) => wallet.label === 'Reserva de teste'))
    .toMatchObject({ isPrimary: false, balance: '0.25' })

  const secondary = wallets.find(
    (wallet: { label: string; id: string }) => wallet.label === 'Reserva de teste',
  )
  await page.evaluate(async () => {
    const token = localStorage.getItem('kurio.session.token')
    await fetch('/api/cart/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ nftId: 'emerald-ape-042', quantity: 1 }),
    })
  })
  await page.goto('/checkout')
  const secondaryOption = page
    .locator('.checkout-desktop-layout .checkout-desktop-wallet')
    .filter({ hasText: 'Reserva de teste' })
  await secondaryOption.click()
  await expect(secondaryOption).toHaveClass(/is-selected/)
  const insufficientButton = page.getByRole('button', {
    name: 'Saldo insuficiente',
  })
  await expect(insufficientButton).toBeDisabled()
  const checkoutState = await page.evaluate(async () => {
    const token = localStorage.getItem('kurio.session.token')
    const headers = { Authorization: `Bearer ${token}` }
    const [cart, orders, currentWallets] = await Promise.all([
      fetch('/api/cart', { headers }).then((r) => r.json()),
      fetch('/api/orders', { headers }).then((r) => r.json()),
      fetch('/api/wallets', { headers }).then((r) => r.json()),
    ])
    return { cart, orders, currentWallets }
  })
  expect(checkoutState.cart.items).toHaveLength(1)
  expect(checkoutState.orders).toHaveLength(0)
  expect(
    checkoutState.currentWallets.find(
      (wallet: { label: string }) => wallet.label === 'Reserva de teste',
    ).balance,
  ).toBe('0.25')
})

test('permite recarregar saldo demo na carteira principal e comprar um NFT', async ({
  page,
}) => {
  await page.goto('/')
  await page.waitForFunction(
    () => document.documentElement.dataset.mockWorkerReady === 'true',
  )
  await page.evaluate(async () => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sam@kurio.test',
        password: 'Collect123!',
      }),
    })
    const session = await response.json()
    localStorage.setItem('kurio.session.token', session.token)
    localStorage.setItem('kurio.session.user', session.user.id)
  })

  await page.goto('/account/wallets')
  await page.getByLabel('Valor da recarga demonstrativa em ETH').fill('2.0')
  await page.getByRole('button', { name: 'Adicionar saldo de teste' }).click()
  await expect(page.getByRole('status')).toContainText(
    '2.0 ETH demonstrativo adicionado',
  )
  await expect(page.getByText('10 ETH', { exact: true })).toBeVisible()

  await page.evaluate(async () => {
    const token = localStorage.getItem('kurio.session.token')
    await fetch('/api/cart/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ nftId: 'emerald-ape-042', quantity: 1 }),
    })
  })
  await page.goto('/checkout')
  const buyButton = page.getByRole('button', { name: /Confirmar compra/ })
  await expect(buyButton).toBeEnabled()
  await buyButton.click()
  await expect(page).toHaveURL(/\/orders\/.*\/confirmation$/)
  await expect(page.getByText('Pedido confirmado')).toBeVisible()
})
