const DECIMALS = 18
const SCALE = 10n ** BigInt(DECIMALS)

export function parseEther(value: string): bigint {
  const normalized = value.trim()
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,18})?$/.test(normalized)) {
    throw new Error(`Valor ETH inválido: ${value}`)
  }
  const [whole, fraction = ''] = normalized.split('.')
  return BigInt(whole) * SCALE + BigInt(fraction.padEnd(DECIMALS, '0') || '0')
}

export function formatEther(value: bigint): string {
  const negative = value < 0n
  const absolute = negative ? -value : value
  const whole = absolute / SCALE
  const fraction = (absolute % SCALE)
    .toString()
    .padStart(DECIMALS, '0')
    .replace(/0+$/, '')
  return `${negative ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`
}

export function multiplyEther(value: string, quantity: number): string {
  if (!Number.isSafeInteger(quantity) || quantity < 0) {
    throw new Error('A quantidade deve ser um inteiro não negativo.')
  }
  return formatEther(parseEther(value) * BigInt(quantity))
}

export function percentageOf(value: string, percentage: number): string {
  if (!Number.isSafeInteger(percentage) || percentage < 0 || percentage > 100) {
    throw new Error('A porcentagem deve estar entre 0 e 100.')
  }
  return formatEther((parseEther(value) * BigInt(percentage)) / 100n)
}
