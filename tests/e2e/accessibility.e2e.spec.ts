import { expect, test, type Page } from '@playwright/test'

async function waitForMocks(page: Page) {
  await page.waitForFunction(
    () => document.documentElement.dataset.mockWorkerReady === 'true',
  )
}

async function login(page: Page) {
  await page.goto('/login')
  const form = page.locator('.auth-form')
  await form.getByRole('textbox', { name: 'E-mail' }).fill('alex@kurio.test')
  await form.locator('input[name="password"]').fill('Kurio123!')
  await form.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('link', { name: 'Minha conta' })).toBeVisible()
}

async function unnamedVisibleControls(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const controls = Array.from(
      document.querySelectorAll<HTMLElement>(
        'a[href], button, input:not([type="hidden"]), select, textarea',
      ),
    )
    return controls.flatMap((element) => {
      if (
        !element.checkVisibility() ||
        element.closest('[aria-hidden="true"], [inert]')
      )
        return []
      const label = element.closest('label')?.textContent?.trim() ?? ''
      const labelledBy = element.getAttribute('aria-labelledby')
      const referencedLabel = labelledBy
        ? (document.getElementById(labelledBy)?.textContent?.trim() ?? '')
        : ''
      const name =
        element.getAttribute('aria-label') ||
        referencedLabel ||
        element.getAttribute('title') ||
        label ||
        element.textContent?.trim() ||
        (element instanceof HTMLInputElement
          ? element.labels?.[0]?.textContent?.trim()
          : '')
      return name
        ? []
        : [`${element.tagName.toLowerCase()}.${element.className}`]
    })
  })
}

test('skip link, foco visível e contenção de foco do diálogo funcionam por teclado', async ({
  page,
}) => {
  await page.goto('/')
  await waitForMocks(page)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(page.locator('.skip-link')).toBeFocused()
  const focusOutline = await page
    .locator('.skip-link')
    .evaluate((element) => getComputedStyle(element).outlineStyle)
  expect(focusOutline).toBe('solid')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#main-content$/)
  await expect(page.getByRole('main')).toBeFocused()

  await page.goto('/login')
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  for (let index = 0; index < 12; index += 1) {
    await page.keyboard.press('Tab')
    expect(
      await page.evaluate(() =>
        Boolean(document.activeElement?.closest('[role="dialog"]')),
      ),
    ).toBe(true)
  }
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

test('controles visíveis têm nome acessível nas rotas principais', async ({
  page,
}) => {
  const routes = ['/', '/nft/emerald-ape-042', '/cart', '/login']
  for (const route of routes) {
    await page.goto(route)
    await waitForMocks(page)
    if (route === '/login') {
      await expect(page.getByRole('dialog')).toBeVisible()
    } else {
      await expect(page.getByRole('main')).toBeVisible()
    }
    expect(await unnamedVisibleControls(page), `rota ${route}`).toEqual([])
  }

  await login(page)
  const privateRoutes = ['/account/profile', '/account/orders']
  for (const route of privateRoutes) {
    await page.goto(route)
    await expect(page.getByRole('main')).toBeVisible()
    expect(await unnamedVisibleControls(page), `rota ${route}`).toEqual([])
  }

  await page.goto('/nft/emerald-ape-042')
  await page.getByRole('button', { name: 'COMPRAR' }).click()
  await expect(page).toHaveURL(/\/cart$/)
  await page.goto('/checkout')
  await expect(page.getByRole('main')).toBeVisible()
  expect(await unnamedVisibleControls(page), 'rota /checkout').toEqual([])
  await page.getByRole('button', { name: 'Confirmar compra' }).first().click()
  await expect(page).toHaveURL(/\/orders\/order-\d+\/confirmation$/)
  expect(
    await unnamedVisibleControls(page),
    'rota /orders/:orderId/confirmation',
  ).toEqual([])
})
