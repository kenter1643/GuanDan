import { useEffect, useState } from 'react'
import { connectInjectedWallet, subscribeWallets, walletLabels } from './providers'
import type { WalletBrand, WalletChoice } from './providers'
import './wallet.css'

type WalletLoginUser = { id: number; username: string; displayName: string; avatarId: number; coins: number }
type Props = {
  serverUrl: string
  serverPassword?: string
  onLogin: (token: string, username: string, user: WalletLoginUser) => void
}
const brands: WalletBrand[] = ['binance','okx','tokenpocket']
const messages: Record<string,string> = {
  WALLET_VERIFIER_UNAVAILABLE: '服务器尚未安装钱包验签模块，暂不能用钱包注册/登录。',
  CHALLENGE_EXPIRED: '签名挑战已过期或已使用，请重试。',
  INVALID_SIGNATURE: '签名无效或钱包地址不匹配。',
  ORIGIN_MISMATCH: '登录来源不匹配，请重新连接。',
  RATE_LIMITED: '请求太频繁，请稍后再试。',
  SERVER_PASSWORD_INCORRECT: '服务器密码不正确。',
}

export function WalletConnect({ serverUrl, serverPassword, onLogin }: Props) {
  const [available, setAvailable] = useState<WalletChoice[]>([])
  const [pending, setPending] = useState<WalletBrand | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loginReady, setLoginReady] = useState(false)
  useEffect(() => subscribeWallets(setAvailable), [])
  useEffect(() => {
    let alive = true
    fetch(`${serverUrl.replace(/\/$/, '')}/api/server/info`)
      .then(r => r.ok ? r.json() : null)
      .then(info => { if (alive) setLoginReady(info?.walletLoginAvailable === true) })
      .catch(() => { if (alive) setLoginReady(false) })
    return () => { alive = false }
  }, [serverUrl])

  async function post(url: string, data: unknown) {
    const result = await fetch(`${serverUrl.replace(/\/$/, '')}/api/auth/wallet/${url}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await result.json()
    if (!result.ok) throw new Error(messages[json.error] || json.error || '服务器认证失败')
    return json
  }

  async function login(brand: WalletBrand) {
    if (!loginReady) { setError('钱包登录服务尚未启用（缺少服务器签名验签模块）。'); return }
    const choice = available.find(x => x.brand === brand)
    if (!choice) {
      setError('未检测到该钱包。请安装扩展，或使用钱包 App 的 DApp 浏览器打开页面。')
      return
    }
    setError(null)
    setPending(brand)
    try {
      const { address, chainId } = await connectInjectedWallet(choice)
      const challenge = await post('challenge', {
        address, chainId: parseInt(chainId, 16), serverPassword,
      })
      if (typeof challenge.message !== 'string' || typeof challenge.challengeId !== 'string')
        throw new Error('服务器挑战无效')
      // Only sign the server-issued message. No transfer, token approval or gas.
      const signature = await choice.provider.request({
        method: 'personal_sign', params: [challenge.message, address],
      })
      if (typeof signature !== 'string') throw new Error('钱包未返回有效签名')
      const result = await post('verify', {
        challengeId: challenge.challengeId, signature, serverPassword,
      })
      if (!result.token || !result.user?.username) throw new Error('登录结果无效')
      onLogin(result.token, result.user.username, result.user)
    } catch (e) {
      setError(e instanceof Error ? e.message : '钱包登录失败或用户取消签名')
    } finally {
      setPending(null)
    }
  }

  return <section className="wallet-connect" aria-label="钱包注册与登录">
    <h3>钱包登录 Tape Games</h3>
    <p>第一次签名即注册，以后使用同一个钱包签名登录；无需支付 Gas，也不需要 X 账号。</p>
    {!loginReady && <p className="wallet-connect-error">当前服务器的钱包登录尚未启用；可以继续用原账号密码登录。</p>}
    <div className="wallet-connect-options">
      {brands.map(brand => (
        <button type="button" key={brand} disabled={pending !== null || !loginReady} onClick={() => void login(brand)}>
          {pending === brand ? '等待签名确认…' : walletLabels[brand]}
          <small>{available.some(w => w.brand === brand) ? '可连接' : '未检测到'}</small>
        </button>
      ))}
    </div>
    {error && <p className="wallet-connect-error" role="alert">{error}</p>}
    <p className="wallet-connect-notice">钱包签名证明地址所有权，不会转走资产。登录后可以在「设置」里修改昵称、选择头像。不要向任何人提供私钥或助记词。</p>
  </section>
}
