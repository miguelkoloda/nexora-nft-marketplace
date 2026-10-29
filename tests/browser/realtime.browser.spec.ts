import { expect, test } from '@playwright/test'

test.afterEach(async () => {
  await fetch('http://127.0.0.1:5188/__demo/resume', {
    method: 'POST',
    headers: { 'X-Demo-Admin': 'local-demo-only-token' },
  }).catch(() => undefined)
})

test('endpoint MSW persiste a atualização de NFT na API simulada', async ({
  page,
}) => {
  await page.goto('/')
  await page.waitForFunction(
    () => document.documentElement.dataset.mockWorkerReady === 'true',
  )

  const result = await page.evaluate(async () => {
    const response = await fetch('/api/__mock/realtime/nft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nftId: 'emerald-ape-042',
        price: '8.25',
        availableQuantity: 2,
      }),
    })
    const nft = await fetch('/api/nfts/emerald-ape-042').then((r) => r.json())
    return { ok: response.ok, nft }
  })
  expect(result.ok).toBe(true)
  expect(result.nft).toMatchObject({ price: '8.25', availableQuantity: 2 })
})

test('eventos de preco atualizam o catalogo e continuam disponiveis via REST', async ({
  page,
}) => {
  await fetch('http://127.0.0.1:5188/__demo/reset', {
    method: 'POST',
    headers: { 'X-Demo-Admin': 'local-demo-only-token' },
  })
  await page.goto('/')
  await page.waitForFunction(
    () => document.documentElement.dataset.mockWorkerReady === 'true',
  )
  await page.evaluate(async () =>
    fetch('/api/__mock/reset', { method: 'POST' }),
  )
  await expect(page.locator('.realtime-status')).toHaveAttribute(
    'title',
    /connected/,
  )
  const trigger = await fetch('http://127.0.0.1:5188/__demo/trigger', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Demo-Admin': 'local-demo-only-token',
    },
    body: JSON.stringify({
      event: 'nft.updated',
      nftId: 'emerald-ape-042',
      price: '8.25',
      availableQuantity: 2,
    }),
  })
  expect(trigger.ok).toBe(true)
  const rest = await page.evaluate(async () =>
    (await fetch('/api/nfts/emerald-ape-042')).json(),
  )
  expect(rest.price).toBe('8.25')
  expect(rest.availableQuantity).toBe(2)
  await expect(
    page
      .locator('.nft-card')
      .filter({ hasText: 'Emerald Ape #042' })
      .locator('.nft-price'),
  ).toContainText('8.25')
})

test('falha do Socket.IO nao impede carregamento REST do catalogo', async ({
  page,
}) => {
  await fetch('http://127.0.0.1:5188/__demo/pause', {
    method: 'POST',
    headers: { 'X-Demo-Admin': 'local-demo-only-token' },
  })
  await page.goto('/')
  await page.waitForFunction(
    () => document.documentElement.dataset.mockWorkerReady === 'true',
  )
  await expect(
    page.getByRole('link', { name: 'Emerald Ape #042', exact: true }),
  ).toBeVisible()
  await expect(page.locator('.realtime-status')).toHaveAttribute(
    'title',
    /Tempo real em simulação: (error|disconnected)/,
  )
})

test('cliente Socket.IO do preview reconecta e volta a atualizar a interface', async ({
  page,
}) => {
  await fetch('http://127.0.0.1:5188/__demo/reset', {
    method: 'POST',
    headers: { 'X-Demo-Admin': 'local-demo-only-token' },
  })
  await page.goto('/')
  await page.waitForFunction(
    () => document.documentElement.dataset.mockWorkerReady === 'true',
  )
  await expect(page.locator('.realtime-status')).toHaveAttribute(
    'title',
    /Tempo real em simulação: connected/,
  )

  await fetch('http://127.0.0.1:5188/__demo/pause', {
    method: 'POST',
    headers: { 'X-Demo-Admin': 'local-demo-only-token' },
  })
  await expect(page.locator('.realtime-status')).toHaveAttribute(
    'title',
    /Tempo real em simulação: disconnected/,
  )
  await fetch('http://127.0.0.1:5188/__demo/resume', {
    method: 'POST',
    headers: { 'X-Demo-Admin': 'local-demo-only-token' },
  })
  await expect(page.locator('.realtime-status')).toHaveAttribute(
    'title',
    /Tempo real em simulação: connected/,
  )

  const update = await fetch('http://127.0.0.1:5188/__demo/trigger', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Demo-Admin': 'local-demo-only-token',
    },
    body: JSON.stringify({
      event: 'nft.updated',
      nftId: 'emerald-ape-042',
      price: '8.25',
      availableQuantity: 2,
    }),
  })
  expect(update.ok).toBe(true)
  await expect(
    page
      .locator('.nft-card')
      .filter({ hasText: 'Emerald Ape #042' })
      .locator('.nft-price'),
  ).toContainText('8.25')
})
