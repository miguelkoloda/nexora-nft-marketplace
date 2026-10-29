import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from '@playwright/test'
import { launch } from 'chrome-launcher'
import lighthouse from 'lighthouse'
import desktopConfig from 'lighthouse/core/config/desktop-config.js'
import { ReportGenerator } from 'lighthouse/report/generator/report-generator.js'

const outputDirectory = 'artifacts/lighthouse'
const adminHeaders = { 'X-Demo-Admin': 'local-demo-only-token' }
const childProcesses = []
const measurements = []
let chrome

function startProcess(args) {
  const child = spawn(process.execPath, args, {
    cwd: process.cwd(),
    stdio: 'ignore',
    windowsHide: true,
  })
  childProcesses.push(child)
  return child
}

async function waitFor(url) {
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      await delay(250)
    }
  }
  throw new Error(`Serviço não iniciou: ${url}`)
}

function median(values) {
  const ordered = [...values].sort((a, b) => a - b)
  const middle = Math.floor(ordered.length / 2)
  return ordered.length % 2
    ? ordered[middle]
    : (ordered[middle - 1] + ordered[middle]) / 2
}

function medianAvailable(values) {
  const available = values.filter(Number.isFinite)
  return available.length ? median(available) : null
}

try {
  await mkdir(outputDirectory, { recursive: true })
  startProcess(['--experimental-strip-types', 'server/realtime/index.ts'])
  startProcess(['scripts/browser-preview-server.mjs'])
  await Promise.all([
    waitFor('http://127.0.0.1:5188/__demo/health'),
    waitFor('http://127.0.0.1:5187'),
  ])
  await fetch('http://127.0.0.1:5188/__demo/reset', {
    method: 'POST',
    headers: adminHeaders,
  })

  const versionProbe = await chromium.launch({ headless: true })
  const chromeVersion = versionProbe.version()
  await versionProbe.close()
  chrome = await launch({
    chromePath: chromium.executablePath(),
    chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage'],
  })
  const lighthouseVersion = JSON.parse(
    await readFile('node_modules/lighthouse/package.json', 'utf8'),
  ).version

  for (const route of ['/', '/nft/emerald-ape-042']) {
    for (const formFactor of ['desktop', 'mobile']) {
      for (let run = 1; run <= 3; run += 1) {
        const url = `http://127.0.0.1:5187${route}`
        const result = await lighthouse(
          url,
          {
            port: chrome.port,
            output: 'json',
            logLevel: 'error',
            onlyCategories: [
              'performance',
              'accessibility',
              'best-practices',
              'seo',
            ],
          },
          formFactor === 'desktop' ? desktopConfig : undefined,
        )
        if (!result)
          throw new Error(`Lighthouse não retornou resultado para ${url}`)
        const filename = `${route === '/' ? 'home' : 'nft-detail'}-${formFactor}-${run}`
        await writeFile(
          `${outputDirectory}/${filename}.json`,
          ReportGenerator.generateReport(result.lhr, 'json'),
        )
        await writeFile(
          `${outputDirectory}/${filename}.html`,
          ReportGenerator.generateReport(result.lhr, 'html'),
        )
        const categories = Object.fromEntries(
          Object.entries(result.lhr.categories).map(([name, category]) => [
            name,
            category.score === null ? null : Math.round(category.score * 100),
          ]),
        )
        const audits = result.lhr.audits
        const lcpDetails =
          audits['largest-contentful-paint-element']?.details?.items ?? []
        const lcpElement = lcpDetails[0]?.items?.[0]?.node
        const lcpPhases = lcpDetails[1]?.items ?? []
        const resourceGroups = audits['resource-summary']?.details?.items ?? []
        const lcpPhase = (phase) =>
          lcpPhases.find((item) => item.phase === phase)?.timing ?? null
        const row = {
          route,
          formFactor,
          run,
          categories,
          lcpMs: audits['largest-contentful-paint']?.numericValue ?? null,
          fcpMs: audits['first-contentful-paint']?.numericValue ?? null,
          inpMs: audits['interaction-to-next-paint']?.numericValue ?? null,
          cls: audits['cumulative-layout-shift']?.numericValue ?? null,
          tbtMs: audits['total-blocking-time']?.numericValue ?? null,
          lcpLoadDelayMs: lcpPhase('Load Delay'),
          lcpRenderDelayMs: lcpPhase('Render Delay'),
          scriptTransferBytes:
            resourceGroups.find((group) => group.label === 'Script')
              ?.transferSize ?? null,
          lcpSelector: lcpElement?.selector ?? null,
          lcpLabel: lcpElement?.nodeLabel ?? null,
          report: `${filename}.html`,
        }
        measurements.push(row)
        process.stdout.write(`${JSON.stringify(row)}\n`)
      }
    }
  }

  const summary = []
  for (const route of ['/', '/nft/emerald-ape-042']) {
    for (const formFactor of ['desktop', 'mobile']) {
      const rows = measurements.filter(
        (entry) => entry.route === route && entry.formFactor === formFactor,
      )
      summary.push({
        route,
        formFactor,
        medianCategories: Object.fromEntries(
          ['performance', 'accessibility', 'best-practices', 'seo'].map(
            (category) => [
              category,
              median(rows.map((entry) => entry.categories[category])),
            ],
          ),
        ),
        medianLcpMs: median(rows.map((entry) => entry.lcpMs)),
        medianFcpMs: median(rows.map((entry) => entry.fcpMs)),
        medianInpMs: medianAvailable(rows.map((entry) => entry.inpMs)),
        medianCls: median(rows.map((entry) => entry.cls)),
        medianTbtMs: median(rows.map((entry) => entry.tbtMs)),
        medianLcpLoadDelayMs: medianAvailable(
          rows.map((entry) => entry.lcpLoadDelayMs),
        ),
        medianLcpRenderDelayMs: medianAvailable(
          rows.map((entry) => entry.lcpRenderDelayMs),
        ),
        medianScriptTransferBytes: median(
          rows.map((entry) => entry.scriptTransferBytes),
        ),
      })
    }
  }
  const manifest = {
    generatedAt: new Date().toISOString(),
    node: process.version,
    lighthouse: lighthouseVersion,
    chrome: chromeVersion,
    viewportRuns: 3,
    measurements,
    summary,
  }
  await writeFile(
    `${outputDirectory}/summary.json`,
    JSON.stringify(manifest, null, 2),
  )
  process.stdout.write(`Relatório agregado: ${outputDirectory}/summary.json\n`)
} finally {
  await fetch('http://127.0.0.1:5188/__demo/shutdown', {
    method: 'POST',
    headers: adminHeaders,
  }).catch(() => undefined)
  await fetch('http://127.0.0.1:5187/__test/shutdown', {
    method: 'POST',
  }).catch(() => undefined)
  try {
    await chrome?.kill()
  } catch {
    // O Chrome já pode ter sido encerrado após uma falha de coleta.
  }
  childProcesses.forEach((child) => {
    if (child.exitCode === null) child.kill()
    child.unref()
  })
}

process.exit(0)
