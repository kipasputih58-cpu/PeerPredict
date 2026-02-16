# PeerPredict - Decentralized Prediction Market

**A trustless P2P prediction market built on Intercom (Trac Network)**

[![Trac Network](https://img.shields.io/badge/Built%20on-Trac%20Network-blue)](https://trac.network)

**Trac Address:** trac1qasf9s8x7xes4mj8gl7aj8h0wycckcepq8n0axvv30lfp874qpgstywg0l

---

## 🎯 What is PeerPredict?

PeerPredict is a decentralized prediction market platform where users can:
- Create prediction markets on any topic
- Stake TNK tokens on predicted outcomes
- Verify results through peer consensus (no central oracle)
- Earn rewards for accurate predictions
- Build reputation as a forecaster

Unlike centralized prediction platforms, PeerPredict uses **peer-to-peer verification** and **Intercom's sidechannel** for fast, low-cost market operations with final settlement on Trac Network.

---

## 🌟 Key Features

### 1. **Create Custom Markets**
Anyone can create a prediction market on any binary outcome:
- "Will BTC reach $100k by March 2026?"
- "Will it rain in Jakarta tomorrow?"
- "Will Project X launch by deadline?"

### 2. **Stake TNK on Outcomes**
- Place predictions by staking TNK tokens
- Choose YES or NO position
- See live odds based on market participation
- Minimum stake: 10 TNK

### 3. **P2P Outcome Verification**
- No central oracle needed
- Multiple peers vote on the actual outcome
- Consensus mechanism prevents manipulation
- Verifiers earn small fees

### 4. **Automatic Payouts**
- Winners automatically receive their share
- Payout = (Your Stake / Total Winning Stake) × Total Pool
- Losers lose their stake (distributed to winners)
- 2% platform fee supports network

### 5. **Reputation System**
- Track prediction accuracy over time
- Earn "Oracle Score" for correct predictions
- Verifier reputation for honest outcome voting
- Leaderboard for top forecasters

---

## 🏗️ Architecture

PeerPredict leverages Intercom's dual-layer architecture:

**Sidechannel Layer (Fast & Free):**
- Market creation announcements
- Real-time stake updates
- Peer discovery for verification
- Live odds calculation
- Chat/discussion about markets

**Contract Layer (Final Settlement):**
- Immutable market records
- Stake escrow
- Outcome verification results
- Payout distribution
- Reputation scores

---

## 📋 How It Works

### Creating a Market

1. **Define the Market**
   - Question: Binary yes/no question
   - Resolution Date: When outcome will be known
   - Resolution Source: Where to verify (URL, event, etc.)
   - Verification Period: 24-72 hours after resolution date

2. **Set Parameters**
   - Minimum Stake: 10-1000 TNK
   - Verifier Count: 3-10 peers required for consensus
   - Market Duration: Auto-close at resolution date

3. **Publish Market**
   - Market ID generated
   - Announced via sidechannel
   - Recorded on Trac contract

### Placing Predictions

1. **Browse Available Markets**
   - View active markets
   - See current odds
   - Check resolution criteria

2. **Stake Your Position**
   - Choose YES or NO
   - Enter stake amount (minimum 10 TNK)
   - Sign transaction

3. **Monitor Market**
   - Live odds update as others stake
   - Chat with other participants
   - Change position before close (with fee)

### Outcome Verification

1. **Resolution Period Begins**
   - Market closes to new stakes
   - Verification window opens
   - Verifiers can submit votes

2. **Peer Voting**
   - Designated verifiers vote YES/NO
   - Submit evidence/reasoning
   - Consensus threshold: 66% agreement

3. **Outcome Finalized**
   - Consensus reached → outcome confirmed
   - No consensus → extended verification or refund
   - Result recorded immutably on Trac

### Claiming Rewards

1. **Winners Notified**
   - Automatic detection of winning position
   - Calculate individual payout share

2. **Claim Payout**
   - One-click claim button
   - TNK transferred to wallet
   - Reputation score updated

3. **Verifier Rewards**
   - Honest verifiers earn 1% of pool
   - Split among all consensus voters

---

## 🚀 Quick Start Guide

### Prerequisites

- **Pear Runtime** (required - do NOT use Node.js)
- **Trac Wallet** with TNK tokens
- **Intercom Framework** installed

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/peerpredict.git
cd peerpredict

# Install dependencies via Pear
pear install
```

### Running the Application

**Step 1: Start the Admin Peer (Market Coordinator)**

```bash
pear run . --admin
```

This starts the market coordinator that:
- Manages market registry
- Coordinates verification rounds
- Distributes payouts
- Maintains global state

**Step 2: Start User Peers (Participants)**

```bash
# In a new terminal
pear run .
```

Each user peer can:
- Create new markets
- Browse and join markets
- Place predictions
- Vote on outcomes
- Claim rewards

### First-Time Setup

1. **Connect Wallet**
   - Import or create Trac wallet
   - Fund with TNK tokens (minimum 100 TNK recommended)

2. **Set Profile**
   - Username (displayed in markets)
   - Verifier opt-in (earn fees by verifying)

3. **Browse Markets**
   - See active prediction markets
   - Filter by category, closing date, pool size

---

## 📊 Example Markets

### Market 1: Crypto Price Prediction
```
Question: Will Bitcoin (BTC) close above $95,000 on February 28, 2026?
Resolution Source: CoinGecko BTC/USD price at 23:59 UTC Feb 28
Pool: 5,420 TNK
YES odds: 62%
NO odds: 38%
Closes: Feb 28, 2026 23:59 UTC
Status: Active
```

### Market 2: Project Launch
```
Question: Will Trac Network mainnet launch before March 31, 2026?
Resolution Source: Official Trac Network announcement
Pool: 1,280 TNK
YES odds: 78%
NO odds: 22%
Closes: Mar 31, 2026 23:59 UTC
Status: Active
```

### Market 3: Weather Prediction
```
Question: Will it rain in Jakarta on February 20, 2026?
Resolution Source: Weather.com Jakarta historical data
Pool: 340 TNK
YES odds: 45%
NO odds: 55%
Closes: Feb 20, 2026 23:59 UTC
Status: Active
```

---

## 🎮 User Interface

### Dashboard View
```
╔═══════════════════════════════════════════════════════════╗
║  PeerPredict - Decentralized Prediction Market            ║
╠═══════════════════════════════════════════════════════════╣
║  Wallet: 0x742d...4a8f  |  Balance: 1,420 TNK            ║
║  Oracle Score: 76.5%    |  Markets: 12  |  Won: 8        ║
╠═══════════════════════════════════════════════════════════╣
║  [Create Market]  [My Positions]  [Verify Outcomes]      ║
╠═══════════════════════════════════════════════════════════╣
║  ACTIVE MARKETS                                           ║
║  ┌─────────────────────────────────────────────────────┐ ║
║  │ 🔥 Will BTC reach $100k by March?                   │ ║
║  │    Pool: 8,540 TNK  |  YES: 68%  NO: 32%           │ ║
║  │    Closes in 12d 4h  |  [View Details]              │ ║
║  └─────────────────────────────────────────────────────┘ ║
║  ┌─────────────────────────────────────────────────────┐ ║
║  │ ⚡ Trac mainnet launch before April?                │ ║
║  │    Pool: 2,100 TNK  |  YES: 82%  NO: 18%           │ ║
║  │    Closes in 41d 8h  |  [View Details]              │ ║
║  └─────────────────────────────────────────────────────┘ ║
╚═══════════════════════════════════════════════════════════╝
```

### Market Detail View
```
╔═══════════════════════════════════════════════════════════╗
║  Market #142: Will BTC reach $100k by March 2026?        ║
╠═══════════════════════════════════════════════════════════╣
║  Created: Feb 10, 2026 by @satoshi_fan                   ║
║  Closes: Mar 01, 2026 23:59 UTC (12d 4h remaining)       ║
║  Resolution: CoinGecko BTC/USD price                      ║
║  Verifiers: 5 required (3 already signed up)             ║
╠═══════════════════════════════════════════════════════════╣
║  CURRENT ODDS                                             ║
║  ┌──────────────────┬──────────────────┐                 ║
║  │  YES: 68%        │  NO: 32%         │                 ║
║  │  5,802 TNK       │  2,738 TNK       │                 ║
║  │  34 participants │  18 participants │                 ║
║  └──────────────────┴──────────────────┘                 ║
║                                                           ║
║  YOUR POSITION                                            ║
║  ┌─────────────────────────────────────┐                 ║
║  │  Not yet staked                     │                 ║
║  │  [Stake YES] [Stake NO]             │                 ║
║  └─────────────────────────────────────┘                 ║
║                                                           ║
║  PAYOUT CALCULATOR                                        ║
║  If you stake 100 TNK on YES and win:                    ║
║  → Potential payout: 147 TNK (47% profit)                ║
╠═══════════════════════════════════════════════════════════╣
║  [💬 Market Chat]  [📊 History]  [⚠️ Report Issue]       ║
╚═══════════════════════════════════════════════════════════╝
```

---

## 🔐 Security Features

### Anti-Manipulation
- Minimum stake requirements prevent spam
- Whale protection: Position size limits
- Time-locked stakes (no instant withdrawal)
- Verifier collateral requirement

### Fair Verification
- Random verifier selection from opt-in pool
- Verifiers must stake 50 TNK as collateral
- Dishonest voters lose collateral
- Evidence submission required
- Dispute resolution mechanism

### Smart Contract Security
- All payouts mathematically guaranteed
- No admin withdrawal function
- Time-locked funds
- Emergency pause for verified exploits only

---

## 📈 Tokenomics

### Fee Structure
- **Market Creation:** 20 TNK (prevents spam)
- **Platform Fee:** 2% of winning pool
- **Verifier Reward:** 1% of total pool (split among verifiers)
- **Early Exit Fee:** 5% if changing position before close

### Payout Formula
```
Winner Payout = (Your Stake / Total Winning Stakes) × (Total Pool - Fees)

Example:
Total Pool: 10,000 TNK
Your Stake: 500 TNK (on YES)
Total YES Stakes: 6,000 TNK
Outcome: YES wins

Your Payout = (500 / 6,000) × (10,000 - 300 fees)
Your Payout = 0.0833 × 9,700
Your Payout = 808 TNK (61.6% profit!)
```

---

## 🎯 Use Cases

### 1. **Crypto Market Predictions**
- Price targets for BTC, ETH, altcoins
- Exchange listings
- Protocol launches
- DeFi events

### 2. **Project Milestones**
- Development deadlines
- Partnership announcements
- Token generation events
- Mainnet launches

### 3. **Real-World Events**
- Weather forecasts
- Sports outcomes
- Political events
- Award show winners

### 4. **Community Governance**
- Vote on protocol decisions
- Signal community sentiment
- Predict proposal outcomes
- Coordinate expectations

### 5. **Research & Forecasting**
- Scientific predictions
- Technology adoption rates
- Market trends
- Social phenomena

---

## 🛠️ Technical Details

### Built With
- **Intercom Framework** - P2P messaging & state sync
- **Trac Network** - Smart contract settlement
- **Pear Runtime** - P2P application runtime
- **Hyperbee** - Distributed database
- **Hyperswarm** - P2P networking

### File Structure
```
peerpredict/
├── contract/              # Trac smart contracts
│   ├── PeerPredict.sol   # Main market contract
│   └── Verification.sol  # Outcome verification logic
├── features/             # Core application logic
│   ├── markets.js       # Market creation & management
│   ├── stakes.js        # Stake placement & tracking
│   ├── verify.js        # Verification system
│   └── payouts.js       # Reward distribution
├── index.js             # Main application entry
├── SKILL.md             # AI agent instructions
├── README.md            # This file
└── package.json         # Dependencies
```

### State Management
```javascript
// Market State
{
  id: "market_142",
  question: "Will BTC reach $100k by March 2026?",
  creator: "0x742d...4a8f",
  created: 1739203200,
  closes: 1740960000,
  resolutionSource: "CoinGecko BTC/USD",
  yesPool: 5802,
  noPool: 2738,
  participants: 52,
  status: "active", // active, closed, verifying, resolved
  outcome: null, // null, "yes", "no"
  verifiers: ["0xabc...", "0xdef...", "0x123..."]
}
```

---

## 📸 Proof of Concept
screenshot avaliable



## 🤝 Contributing

This is a competition entry for the **Trac Network Intercom Vibe Competition**.

### Competition Rules Met:
✅ Forked from Intercom  
✅ Built unique prediction market app  
✅ Trac address in README  
✅ SKILL.md updated for AI agents  
✅ Proof of concept provided  

---

## 📜 License

MIT License - See LICENSE file for details

---

## 🔗 Links

- [Trac Network](https://trac.network)
- [Intercom Framework](https://github.com/Trac-Systems/intercom)
- [Competition Details](https://github.com/Trac-Systems/awesome-intercom)
- [Pear Runtime](https://pear.to)

---

## ⚠️ Disclaimer

This is experimental software. Use at your own risk. Not financial advice. Prediction markets may be regulated in your jurisdiction - check local laws.

---

**Built with ❤️ for the Trac Network community**

*Last Updated: February 16, 2026*
