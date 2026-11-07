# Tape Games：钱包即账号（不使用付费 X OAuth）

## 目标
Binance Wallet / OKX Wallet / TokenPocket (EVM) 点击连接 → 签一次免费的文本消息 → 服务端验证签名 → 首次自动注册、再次登录现有账号 → 设置中自定义昵称、选择头像。

钱包持有不等于链上支付；无需 Gas、充值、代币授权，任何页面不得索取助记词或私钥。钱包品牌名称只用于界面，不能当作安全认证依据。

## 已提交代码
- 三钱包 EIP-1193 / EIP-6963 发现，调用 `eth_requestAccounts` + `personal_sign`。
- 两个服务端接口 `POST /api/auth/wallet/challenge`、`POST /api/auth/wallet/verify`。
- 服务端产生 EIP-4361 格式的短时随机挑战；约 5 分钟后过期。
- 挑战和 EVM 钱包账号写入 SQLite；验签通过之后**在同一数据库事务中**消费挑战与创建/查询用户。
- `wallet_accounts.address` 唯一约束；同一 EVM 地址只对应一个游戏账号（跨 EVM 链视为同一地址身份）。
- 复用现有 HMAC 登录 Token、Socket.IO 用户名身份、资料更新接口。
- 钱包账号在设置页保留昵称和头像，隐藏密码修改入口；原有用户名/密码账号仍可使用。

## 重大阻塞：验签依赖目前不可用

此项目当前没有锁定 `viem`。为了避免错误声称“登录成功”，服务器在没有验签模块时**返回 HTTP 503 / WALLET_VERIFIER_UNAVAILABLE**，绝不因为提交一个钱包地址就建立账号。

需要在可以访问 npm registry 的开发环境执行：

```bash
npm install --workspace @tongzhuo/core-server viem@^2
npm ci
npm run test
npm -w client run build
```

然后把 `packages/core/server/package.json`、`package-lock.json` 由 npm 自动生成的变更提交到本 PR，再测试真实签名。**不可手写假签名验证，也不能忽略 npm 锁文件。** 当前运行环境 npm registry DNS 失败，因此无法完成这些依赖安装与测试；PR 在此之前不得合并上线。

依赖就绪后后台使用 viem 的 `verifyMessage`，适用于传统 EOA `personal_sign`。合约钱包 EIP-1271 不在这一版支持范围内。生产部署需审计挑战失效、来源校验、域名配置、限流及 Token 生命周期。

## 玩家可自行设置的资料

现有 `/api/profile/update` 支持 `displayName`（昵称）及 `avatarId`（内置头像方案）。这一阶段**不是上传任意图片头像**。用户上传裁切头像需后续增加安全的图片处理与存储模块。

## 待验收

1. 并发首登同一钱包不能生成多个账户。
2. 相同地址使用三种钱包之一签名，必须登录同一个账号。
3. 不同地址不能互相冒领。
4. 过期 nonce / 已使用 nonce / 签名伪造 / 非法来源均拒绝。
5. 账户创建后关闭浏览器、重新连接钱包仍能登录原账号。
6. 选择内置头像及修改昵称，退出重登后仍然保持。
7. 4 人以不同钱包账号进入掼蛋房间进行多人联机验收。
8. HTTPS 正式部署，手机钱包 DApp 浏览器和浏览器扩展分别实测。

**与 TapeAPI V3 的边界**：钱包登录不依赖 TapeAPI，不请求外部付费服务。TapeAPI 3.0 的身份/回执服务后续再按需接入。
