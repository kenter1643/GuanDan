/**
 * EIP-1193 injected wallet discovery.  EIP-6963 takes precedence over
 * legacy globals when multiple extensions are installed.
 *
 * IMPORTANT: provider labels are self-reported and cannot be used as
 * cryptographic wallet-brand authentication.
 */
export type WalletBrand = 'binance' | 'okx' | 'tokenpocket'
export interface EIP1193Provider {
  request(args: { method: string; params?: unknown[] | object }): Promise<unknown>
  on?(event: string, listener: (...args: unknown[]) => void): void
  removeListener?(event: string, listener: (...args: unknown[]) => void): void
}
export interface WalletChoice {
  brand: WalletBrand
  label: string
  provider: EIP1193Provider
  source: 'eip6963' | 'legacy'
  rdns?: string
}
type Announcement = {
  info?: { uuid?: string; name?: string; rdns?: string }
  provider?: EIP1193Provider
}
type WalletWindow = Window & {
  ethereum?: EIP1193Provider
  okxwallet?: EIP1193Provider
  tokenpocket?: { ethereum?: EIP1193Provider }
  BinanceChain?: EIP1193Provider
  binancew3w?: { ethereum?: EIP1193Provider }
}

const labels: Record<WalletBrand, string> = {
  binance: '币安钱包 Binance Wallet',
  okx: '欧易 OKX Wallet',
  tokenpocket: 'TokenPocket (TP)',
}
export const walletLabels = labels
const isProvider = (p: unknown): p is EIP1193Provider =>
  !!p && typeof p === 'object' && typeof (p as EIP1193Provider).request === 'function'

export function detectBrand(name: string, rdns = ''): WalletBrand | null {
  const s = `${name} ${rdns}`.toLowerCase()
  if (/tokenpocket|token pocket/.test(s)) return 'tokenpocket'
  if (/okx|okex/.test(s)) return 'okx'
  if (/binance/.test(s)) return 'binance'
  return null
}

export function subscribeWallets(onUpdate: (wallets: WalletChoice[]) => void): () => void {
  const win = window as WalletWindow
  const discoveries = new Map<string, WalletChoice>()
  const push = () => {
    const grouped = new Map<WalletBrand, WalletChoice>()
    for (const wallet of discoveries.values()) grouped.set(wallet.brand, wallet)
    // Explicitly indexed legacy namespaces are safer than an ambiguous window.ethereum.
    const legacy: [WalletBrand, unknown][] = [
      ['binance', win.binancew3w?.ethereum || win.BinanceChain],
      ['okx', win.okxwallet],
      ['tokenpocket', win.tokenpocket?.ethereum],
    ]
    for (const [brand, provider] of legacy) {
      if (isProvider(provider) && !grouped.has(brand)) {
        grouped.set(brand, { brand, label: labels[brand], provider, source: 'legacy' })
      }
    }
    onUpdate([...grouped.values()])
  }
  const announced = (evt: Event) => {
    const detail = (evt as CustomEvent<Announcement>).detail
    if (!detail?.info || !isProvider(detail.provider)) return
    const brand = detectBrand(detail.info.name || '', detail.info.rdns || '')
    if (!brand) return
    const key = detail.info.uuid || `${brand}:${detail.info.rdns || ''}`
    discoveries.set(key, {
      brand, provider: detail.provider, label: labels[brand],
      source: 'eip6963', rdns: detail.info.rdns,
    })
    push()
  }
  window.addEventListener('eip6963:announceProvider', announced)
  window.dispatchEvent(new Event('eip6963:requestProvider'))
  push()
  return () => window.removeEventListener('eip6963:announceProvider', announced)
}

export function validEvmAddress(value: unknown): value is string {
  return typeof value === 'string' && /^0x[a-fA-F0-9]{40}$/.test(value)
}

export async function connectInjectedWallet(wallet: WalletChoice): Promise<{ address: string; chainId: string }> {
  const accounts = await wallet.provider.request({ method: 'eth_requestAccounts' })
  if (!Array.isArray(accounts) || !validEvmAddress(accounts[0])) throw new Error('钱包未提供有效 EVM 地址')
  const chain = await wallet.provider.request({ method: 'eth_chainId' })
  if (typeof chain !== 'string' || !/^0x[0-9a-f]+$/i.test(chain)) throw new Error('无法读取钱包网络')
  return { address: accounts[0], chainId: chain.toLowerCase() }
}
