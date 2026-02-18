# 🔮 PeerPredict

<div align="center">

**Decentralized Prediction Market with Trac Wallet Integration**

*Trac Systems Intercom Competition Entry*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform: Pear](https://img.shields.io/badge/Platform-Pear%20%28Holepunch%29-blue)](https://pear.io)
[![Network: Trac](https://img.shields.io/badge/Network-Trac-orange)](https://trac.network)

</div>

---
## Trac Address (for payouts)
trac1qasf9s8x7xes4mj8gl7aj8h0wycckcepq8n0axvv30lfp874qpgstywg0l


## 📋 Overview

**PeerPredict** is a decentralized prediction market application with native **Trac wallet integration**. Built on the Pear runtime (Holepunch) for P2P communication.

### ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🔗 **Trac Wallet** | Native Trac address support (Bitcoin-style P2PKH) |
| 💰 **Deposit/Withdraw** | Trac token management |
| 🔄 **Transfer** | Send Trac to other addresses |
| 🎲 **Betting/Staking** | Bet Trac tokens on predictions |
| 🗳️ **Voting** | Vote with real stakes |
| 🏆 **Winnings & Claim** | Automatic payout calculation |
| 🌐 **P2P Network** | Real-time sync via Hyperswarm |
| 📱 **Termux Compatible** | Runs on Android |

---

## 🔗 Trac Wallet Support

PeerPredict uses **Bitcoin-style P2PKH addresses** compatible with Trac:

| Address Type | Format | Example |
|--------------|--------|---------|
| P2PKH | Starts with `1` | `1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa` |
| P2SH | Starts with `3` | `3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy` |
| Bech32 | Starts with `bc1` | `bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq` |
| Trac Native | Starts with `trac1` | trac1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# Clone repository
git clone https://github.com/kipasputih58-cpu/peerpredict.git
cd peerpredict

# Install dependencies
npm install

# Start application
npm start
```

### Browser Access
```
http://localhost:3000
```


## 💻 CLI Commands

### Wallet Commands

| Command | Description | Example |
|---------|-------------|---------|
| `balance` | Show Trac balance | `balance` |
| `connect <address>` | Connect Trac wallet | `connect 1A1zP1...` |
| `deposit <amount>` | Deposit Trac | `deposit 100` |
| `withdraw <amt> <addr>` | Withdraw Trac | `withdraw 50 1BvBM...` |
| `transfer <amt> <addr>` | Transfer Trac | `transfer 25 1BvBM...` |
| `history [type]` | Transaction history | `history deposit` |

### Prediction Commands

| Command | Description | Example |
|---------|-------------|---------|
| `create <question>` | Create prediction | `create Will BTC hit 100k?` |
| `vote <id> <choice> <stake>` | Vote with stake | `vote pred-abc Yes 50` |
| `resolve <id> <outcome>` | Resolve prediction | `resolve pred-abc Yes` |
| `claim <id>` | Claim winnings | `claim pred-abc` |
| `list [filter]` | List predictions | `list active` |
| `show <id>` | Prediction details | `show pred-abc` |

---

## 🌐 API Endpoints

### Wallet

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/wallet` | GET | Get wallet info |
| `/api/wallet/connect` | POST | Connect Trac wallet |
| `/api/wallet/validate` | POST | Validate Trac address |
| `/api/wallet/deposit` | POST | Deposit Trac |
| `/api/wallet/withdraw` | POST | Withdraw Trac |
| `/api/wallet/transfer` | POST | Transfer Trac |
| `/api/wallet/transactions` | GET | Transaction history |

### Predictions

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/predictions` | GET | List predictions |
| `/api/prediction/:id` | GET | Get prediction |
| `/api/prediction/create` | POST | Create prediction |
| `/api/prediction/vote` | POST | Cast vote |
| `/api/prediction/resolve` | POST | Resolve prediction |
| `/api/prediction/claim` | POST | Claim winnings |

---

## 🔧 Technical Architecture

### Wallet Address Generation

```javascript
// Bitcoin-style P2PKH address (Trac compatible)
const privateKey = randomBytes(32)
const publicKeyHash = SHA256(RIPEMD160(privateKey))
const address = Base58Check(version: 0x00 + publicKeyHash + checksum)
// Result: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa
```

### Payout Calculation

```javascript
// Winner gets proportional share
payout = originalStake + (originalStake / totalWinningStake) * totalLosingStake

// Example:
// Total Yes: 100 Trac, Total No: 50 Trac
// Your Yes stake: 25 Trac
// Payout = 25 + (25/100) * 50 = 37.5 Trac
```

---

## 🏆 Trac Systems Intercom Competition

### Submission Info

| Field | Value |
|-------|-------|
| **Project Name** | PeerPredict |
| **Category** | Decentralized Application |
| **Platform** | Pear (Holepunch) |
| **Network** | Trac |
| **Trac Address** | trac1qasf9s8x7xes4mj8gl7aj8h0wycckcepq8n0axvv30lfp874qpgstywg0l |

---

## 📜 License

MIT License

---

<div align="center">

**Built for Trac Systems Intercom Competition**

*Powered by Pear (Holepunch) P2P Technology*

</div>
