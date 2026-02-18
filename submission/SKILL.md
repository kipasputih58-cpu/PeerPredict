# PeerPredict - Intercom Agent Skill

## Overview

PeerPredict is a decentralized prediction market with native Trac wallet integration. This skill enables the Intercom Agent to interact with all features including wallet management, betting, and voting.

---

## Trac Wallet Support

PeerPredict uses Bitcoin-style P2PKH addresses compatible with Trac:
- P2PKH addresses (start with `1`)
- P2SH addresses (start with `3`)  
- Bech32 addresses (start with `bc1`)
- Trac native addresses (start with `trac1`)

---

## Agent Activation Triggers

Activate PeerPredict when user mentions:
- Wallet, balance, Trac tokens
- Create prediction, betting, voting
- Deposit, withdraw, transfer
- Prediction market questions

---

## API Reference

Base URL: `http://localhost:3000/api`

---

## Wallet Commands

### Get Wallet Info
```
GET /api/wallet
```
Response:
```json
{
  "address": "14YdinSWon9XYnetYCvUEKwpvbuEii3qkU",
  "balance": 1000,
  "availableBalance": 1000,
  "lockedBalance": 0,
  "connected": false
}
```

### Connect Trac Wallet
```
POST /api/wallet/connect
{"address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"}
```

### Validate Trac Address
```
POST /api/wallet/validate
{"address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"}
```
Response: `{"valid": true}`

### Deposit Trac
```
POST /api/wallet/deposit
{"amount": 100}
```

### Withdraw Trac
```
POST /api/wallet/withdraw
{"amount": 50, "toAddress": "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2"}
```

### Transfer Trac
```
POST /api/wallet/transfer
{"amount": 25, "toAddress": "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2"}
```

---

## Prediction Commands

### Create Prediction
```
POST /api/prediction/create
{
  "question": "Will BTC hit $100k by 2025?",
  "options": ["Yes", "No"],
  "initialStake": 100,
  "initialChoice": "Yes"
}
```

### List Predictions
```
GET /api/predictions?filter=active
```
Filters: `all`, `active`, `resolved`, `voted`

### Vote/Bet
```
POST /api/prediction/vote
{
  "predictionId": "pred-abc123",
  "choice": "Yes",
  "stake": 50
}
```

### Resolve Prediction
```
POST /api/prediction/resolve
{
  "predictionId": "pred-abc123",
  "outcome": "Yes"
}
```

### Claim Winnings
```
POST /api/prediction/claim
{"predictionId": "pred-abc123"}
```

---

## Example Interactions

### Example 1: Create and Bet
```
User: "Create a prediction: Will Trac hit $10?"

Agent: 🔮 Creating prediction...

✨ Prediction Created!
Question: "Will Trac hit $10?"
ID: pred-abc123
Options: Yes, No

Would you like to place an initial bet?
```

### Example 2: Check Balance
```
User: "What's my Trac balance?"

Agent: 💰 Trac Wallet

Address: 14YdinSWon9XYnetYCvUEKwpvbuEii3qkU
Balance: 1400 Trac
Available: 1300 Trac
Locked in bets: 100 Trac
```

### Example 3: Place Bet
```
User: "Bet 50 Trac on Yes for pred-abc123"

Agent: 🗳️ Bet Placed!

Prediction: "Will Trac hit $10?"
Your Vote: Yes
Stake: 50 Trac

Current Odds:
• Yes: 75% (150 Trac)
• No: 25% (50 Trac)
```

---

## Technical Notes

### Address Format
- Uses Base58Check encoding
- Version byte 0x00 for P2PKH
- Supports standard Bitcoin address validation

### P2P Network
- Hyperswarm for peer discovery
- Real-time state synchronization
- Automatic peer connection

### Balance Management
- Total balance vs available balance
- Locked balance for active bets
- Automatic stake deduction

---

*SKILL.md - PeerPredict Intercom Agent Integration*
*Version 2.0 - Trac Wallet Support*
