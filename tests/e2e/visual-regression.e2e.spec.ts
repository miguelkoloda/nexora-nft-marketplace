import { expect, test, type Page } from '@playwright/test'

const demoAdmin = { 'X-Demo-Admin': 'local-demo-only-token' }

async function prepare(page: Page) {
  await fetch('http://127.0.0.1:5188/__demo/reset', {
    method: 'POST',
    headers: demoAdmin,
  })
  await page.goto('/')
  await page.waitForFunction(
    () => document.documentElement.dataset.mockWorkerReady === 'true',
  )
  await page.evaluate(async () => {
    await fetch('/api/__mock/reset', { method: 'POST' })
  })
  await page.reload()
  await page.waitForFunction(
    () => document.documentElement.dataset.mockWorkerReady === 'true',
  )
  await expect(page.locator('.catalog-loading')).toHaveCount(0)
  await expect(page.locator('.nft-card').first()).toBeVisible()
  await expect
    .poll(() =>
      page.locator('.nft-card img').evaluateAll((images) =>
        images.every((image) => (image as HTMLImageElement).naturalWidth > 0),
      ),
    )
    .toBe(true)
  await page.emulateMedia({ reducedMotion: 'reduce' })
}

async function addItem(page: Page) {
  await page.goto('/nft/emerald-ape-042')
  await page.getByRole('button', { name: 'COMPRAR' }).click()
  await expect(page).toHaveURL(/\/cart$/)
}

async function login(page: Page) {
  await page.goto('/login')
  const form = page.locator('.auth-form')
  await form.getByRole('textbox', { name: 'E-mail' }).fill('alex@kurio.test')
  await form.locator('input[name="password"]').fill('Kurio123!')
  await form.getByRole('button', { name: 'Entrar' }).click()
  await expect(
    page
      .getByRole('link', { name: 'Minha conta' })
      .or(page.locator('.mobile-nav').getByRole('link', { name: 'Perfil' })),
  ).toBeVisible()
}

async function capture(page: Page, name: string) {
  await page.mouse.move(1, 1)
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur()
  })
  await page.evaluate(async () => {
    await Promise.all(
      Array.from(document.images, async (image) => {
        image.loading = 'eager'
        try {
          await image.decode()
        } catch {
          return
        }
      }),
    )
    await document.fonts.ready
  })
  await expect(page).toHaveScreenshot(`${name}.png`, {
    fullPage: false,
    animations: 'disabled',
    caret: 'hide',
    mask: [page.locator('.realtime-status')],
    maskColor: '#6d4a34',
  })
}

for (const viewport of [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
]) {
  test(`baseline home ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await prepare(page)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await capture(page, `home-${viewport.name}`)
  })

  test(`baseline detalhe ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await prepare(page)
    await page.goto('/nft/emerald-ape-042')
    await expect(
      page.getByRole('heading', { name: 'Emerald Ape #042' }),
    ).toBeVisible()
    if (viewport.name === 'tablet') {
      const rightEdges = await page.evaluate(() =>
        [
          document.querySelector('.header-login'),
          document.querySelector('.detail-price-line > span'),
        ].map((element) => element?.getBoundingClientRect().right ?? 0),
      )
      expect(
        rightEdges.every((right) => right <= viewport.width),
        `Elementos excedem a viewport: ${rightEdges.join(', ')}`,
      ).toBe(true)
    }
    await capture(page, `detail-${viewport.name}`)
  })

  test(`baseline carrinho ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await prepare(page)
    await addItem(page)
    await expect(
      page.getByRole('link', { name: 'Emerald Ape #042', exact: true }),
    ).toBeVisible()
    await capture(page, `cart-${viewport.name}`)
  })

  test(`baseline pagamento ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await prepare(page)
    await addItem(page)
    await login(page)
    await page.goto('/checkout')
    await expect(
      page.getByRole('heading', {
        name:
          viewport.name === 'mobile'
            ? 'Pagamento com carteira'
            : 'Seus NFTs',
      }),
    ).toBeVisible()
    await capture(page, `checkout-${viewport.name}`)
  })
}
