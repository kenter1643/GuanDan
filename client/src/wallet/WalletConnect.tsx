import { useEffect, useState } from 'react'
import { connectInjectedWallet, subscribeWallets, walletLabels } from './providers'
import type { WalletBrand, WalletChoice } from './providers'
import './wallet.css'

const brands: WalletBrand[] = ['binance', 'okx', 'tokenpocket']
export function WalletConnect() {
  const [available, setAvailable] = useState<WalletChoice[]>([])
  const [pending, setPending] = useState<WalletBrand | null>(null)
  const [connected, setConnected] = useState<{ brand: WalletBrand; address: string; chainId: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => subscribeWallets(setAvailable), [])
  async function connect(brand: WalletBrand) {
    setError(null)
    setConnected(null)
    const choice = available.find(w => w.brand === brand)
    if (!choice) {
      setError('未检测到对应钱包。电脑请安装浏览器插件；手机可在钱包内置 DApp 浏览器打开此页面。')
      return
    }
    setPending(brand)
    try {
      const { address, chainId } = await connectInjectedWallet(choice)
      setConnected({ brand, address, chainId })
    } catch (e) {
      setError(e instanceof Error ? e.message : '连接钱包失败或用户拒绝授权')
    } finally {
      setPending(null)
    }
  }
  return (
    <section className="wallet-connect" aria-label="Web3 钱包连接">
      <h3>连接 Web3 钱包</h3>
      <p>支持币安钱包、OKX Wallet 与 TokenPocket（EVM 模式）。连接不需要转账或支付 Gas。</p>
      <div className="wallet-connect-options">
        {brands.map(brand => (
          <button key={brand} type="button" disabled={pending !== null}
            onClick={() => void connect(brand)}>
            {pending === brand ? '等待钱包确认…' : walletLabels[brand]}
            <small>{available.some(w => w.brand === brand) ? '已检测到' : '未检测到'}</small>
          </button>
        ))}
      </div>
      {error && <p className="wallet-connect-error" role="alert">{error}</p>}
      {connected && (
        <div className="wallet-connect-result" role="status">
          <strong>钱包已连接（仅本次页面会话）</strong>
          <code>{connected.address}</code>
          <span>链 ID：{parseInt(connected.chainId, 16)}</span>
          {connected.chainId !== '0x38' && <span>后续 TapeAPI 读取将使用 BNB Chain（56），当前仅连接钱包，不自动切链。</span>}
        </div>
      )}
      <p className="wallet-connect-notice">
        钱包连接 ≠ 注册登录。账号签名认证尚未开放；当前仍请使用上方账号密码登录。
        不会请求助记词、私钥、代币授权或链上交易。
      </p>
    </section>
  )
}
