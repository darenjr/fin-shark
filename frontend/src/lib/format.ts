export function formatSGD(amount: number): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}
