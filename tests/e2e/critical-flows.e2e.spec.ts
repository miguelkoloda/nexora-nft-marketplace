import { expect, test, type Page } from '@playwright/test'

const demoAdmin = { 'X-Demo-Admin': 'local-demo-only-token' }

async function waitForMocks(page: Page) {
  await page.waitForFunction(
    () => document.documentElement.dataset.mockWorkerReady === 'true',
  )
}

async function resetDemo(page: Page) {
  await fetch('http://127.0.0.1:5188/__demo/reset', {
    method: 'POST',
    headers: demoAdmin,
  })
  await page.goto('/')
  await waitForMocks(page)
  await page.evaluate(async () => {
    localStorage.removeItem('kurio.mock.scenario')
    await fetch('/api/__mock/reset', { method: 'POST' })
  })
  await page.reload()
  await waitForMocks(page)
}

async function login(
  page: Page,
  email = 'alex@kurio.test',
  password = 'Kurio123!',
) {
  await page.goto('/login')
  const form = page.locator('.auth-form')
  await form.getByRole('textbox', { name: 'E-mail' }).fill(email)
  await form.locator('input[name="password"]').fill(password)
  await form.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('link', { name: 'Minha conta' })).toBeVisible()
}

async function addEmeraldToCart(page: Page) {
  await page.goto('/nft/emerald-ape-042')
  await page.getByRole('button', { name: 'COMPRAR' }).click()
  await expect(page).toHaveURL(/\/cart$/)
}

test.beforeEach(async ({ page }) => resetDemo(page))

test('ordena e pagina o catálogo preservando o estado na URL', async ({
  page,
}) => {
  await page
    .getByRole('combobox', { name: 'Ordenar NFTs' })
    .selectOption('price-asc')
  await expect(page).toHaveURL(/sort=price-asc/)
  const firstCard = page.locator('.market-content .nft-grid .nft-card').first()
  await expect(
    firstCard.getByRole('link', { name: 'Golden Signal #160', exact: true }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Página 2' }).click()
  await expect(page).toHaveURL(/page=2/)
  await expect(page.getByRole('button', { name: 'Página 2' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await page.goBack()
  await expect(page).toHaveURL(/sort=price-asc/)
  await expect(page.getByRole('button', { name: 'Página 1' })).toHaveAttribute(
    'aria-current',
    'page',
  )
})

test('validação do formulário de login e erro de credenciais ocorrem na interface', async ({
  page,
}) => {
  await page.goto('/login')
  const form = page.locator('.auth-form')
  const email = form.getByRole('textbox', { name: 'E-mail' })
  expect(
    await email.evaluate((element: HTMLInputElement) => element.required),
  ).toBe(true)
  await email.fill('alex@kurio.test')
  await form.locator('input[name="password"]').fill('incorreta')
  await form.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('alert')).toContainText('inválidos')
  await login(page)
  await expect(page.getByRole('link', { name: 'Minha conta' })).toBeVisible()
})

test('favoritos e carrinho ficam isolados ao trocar de usuário', async ({
  page,
}) => {
  await login(page)
  await page.goto('/nft/violet-nomad-314')
  const favorite = page.getByRole('button', { name: 'Favoritar' })
  await favorite.click()
  await expect(favorite).toHaveAttribute('aria-pressed', 'true')
  await addEmeraldToCart(page)
  await page.goto('/account/profile')
  await page.getByRole('button', { name: 'Sair' }).click()

  await login(page, 'sam@kurio.test', 'Collect123!')
  await page.goto('/nft/violet-nomad-314')
  await expect(page.getByRole('button', { name: 'Favoritar' })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
  await page.goto('/cart')
  await expect(
    page.getByRole('heading', { name: 'Seu carrinho está vazio' }),
  ).toBeVisible()
})

test('pagamento recusado mantém o carrinho e não declara sucesso', async ({
  page,
}) => {
  await addEmeraldToCart(page)
  await login(page)
  await page.goto('/checkout')
  await page.evaluate(() =>
    localStorage.setItem('kurio.mock.scenario', 'payment-declined'),
  )
  await page.getByRole('button', { name: 'Confirmar compra' }).first().click()
  await expect(page).toHaveURL(/\/orders\/order-\d+\/confirmation$/)
  await expect(page.getByText(/PAGAMENTO RECUSADO/)).toBeVisible()
  await expect(page.getByText(/Pedido confirmado/)).toHaveCount(0)
  await page.goto('/cart')
  await expect(
    page.getByRole('link', { name: 'Emerald Ape #042', exact: true }),
  ).toBeVisible()
})

test('duplo clique durante a confirmação registra somente um pedido', async ({
  page,
}) => {
  await addEmeraldToCart(page)
  await login(page)
  await page.goto('/checkout')
  await page.evaluate(() => localStorage.setItem('kurio.mock.scenario', 'slow'))
  const confirm = page.getByRole('button', {
    name: 'Confirmar compra',
  }).first()
  await confirm.evaluate((button: HTMLButtonElement) => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  await expect(page).toHaveURL(/\/orders\/order-\d+\/confirmation$/)

  const orderCount = await page.evaluate(async () => {
    const token = localStorage.getItem('kurio.session.token')
    const response = await fetch('/api/orders', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return (await response.json()).length
  })
  expect(orderCount).toBe(1)
})

test('mudança de preço no checkout exige revisão antes de tentar novamente', async ({
  page,
}) => {
  await addEmeraldToCart(page)
  await login(page)
  await page.goto('/checkout')
  await page.evaluate(() =>
    localStorage.setItem('kurio.mock.scenario', 'price-changed'),
  )
  await page.getByRole('button', { name: 'Confirmar compra' }).first().click()
  await expect(page.getByRole('alert')).toContainText('preço de um NFT mudou')
  await expect(
    page.locator('.checkout-desktop-layout .checkout-order-total'),
  ).toContainText('9.99 ETH')
  await expect(page).toHaveURL('/checkout')
})

test('status de pedido pendente atualiza pela interface via Socket.IO', async ({
  page,
}) => {
  await addEmeraldToCart(page)
  await login(page)
  await page.goto('/checkout')
  await expect(page.locator('.realtime-status')).toHaveAttribute(
    'title',
    /connected/,
  )
  await page.evaluate(() =>
    localStorage.setItem('kurio.mock.scenario', 'order-pending'),
  )
  await page.getByRole('button', { name: 'Confirmar compra' }).first().click()
  await expect(page).toHaveURL(/\/orders\/(order-\d+)\/confirmation$/)
  await expect(page.getByText(/PEDIDO PENDENTE/)).toBeVisible()
  const orderId = new URL(page.url()).pathname.match(
    /orders\/(order-\d+)\//,
  )?.[1]
  const sessionToken = await page.evaluate(() =>
    localStorage.getItem('kurio.realtime.token'),
  )
  expect(orderId).toBeTruthy()
  expect(sessionToken).toBeTruthy()

  const eventResponse = await fetch('http://127.0.0.1:5188/__demo/trigger', {
    method: 'POST',
    headers: { ...demoAdmin, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'order.updated',
      sessionToken,
      orderId,
      status: 'confirmed',
    }),
  })
  expect(eventResponse.ok).toBe(true)
  await expect(page.getByText(/PEDIDO CONFIRMADO/)).toBeVisible()
})

test('endpoint MSW atualiza o status persistido do pedido da sessao', async ({
  page,
}) => {
  await addEmeraldToCart(page)
  await login(page)
  await page.goto('/checkout')
  await page.evaluate(() =>
    localStorage.setItem('kurio.mock.scenario', 'order-pending'),
  )
  await page.getByRole('button', { name: 'Confirmar compra' }).first().click()
  await expect(page).toHaveURL(/\/orders\/(order-\d+)\/confirmation$/)
  await expect(page.getByText(/PEDIDO PENDENTE/)).toBeVisible()
  const orderId = new URL(page.url()).pathname.match(
    /orders\/(order-\d+)\//,
  )?.[1]
  const sessionToken = await page.evaluate(() =>
    localStorage.getItem('kurio.session.token'),
  )
  expect(orderId).toBeTruthy()
  expect(sessionToken).toBeTruthy()

  const event = await page.evaluate(
    async ({ orderId, sessionToken }) => {
      const response = await fetch('/api/__mock/realtime/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ orderId, status: 'confirmed' }),
      })
      return { ok: response.ok, status: response.status }
    },
    { orderId, sessionToken },
  )
  expect(event.ok).toBe(true)
  const order = await page.evaluate(async ({ orderId, sessionToken }) =>
    fetch(`/api/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${sessionToken}` },
    }).then((response) => response.json()),
  { orderId, sessionToken })
  expect(order.status).toBe('confirmed')
})
