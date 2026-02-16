# SKILL.md - PeerPredict AI Agent Instructions

This document contains operational instructions for AI agents interacting with **PeerPredict**, a decentralized prediction market built on Intercom (Trac Network).

---

## Overview

**PeerPredict** is a trustless P2P prediction market where users create binary outcome markets, stake TNK tokens on predictions, verify outcomes through peer consensus, and earn rewards for accurate forecasts.

**Core Components:**
- Market creation and management
- Stake placement (YES/NO positions)
- P2P outcome verification
- Automatic payout distribution
- Reputation tracking

**Architecture:**
- Sidechannel: Fast P2P messaging for real-time updates
- Contract: Immutable settlement on Trac Network
- Pear Runtime: P2P application execution (NEVER use Node.js)

---

## Installation & Setup

### Prerequisites
1. **Pear Runtime installed** (https://pear.to)
2. **Trac wallet** with TNK tokens
3. **Minimum 100 TNK** recommended for participation

### Installation Commands
```bash
# Clone repository
git clone [REPOSITORY_URL]
cd peerpredict

# Install dependencies (use Pear, not npm)
pear install

# Start admin peer (market coordinator)
pear run . --admin

# Start user peer (in new terminal)
pear run .
```

### First-Run Configuration
When starting PeerPredict for the first time:

1. **Wallet Connection**
   - Import existing Trac wallet OR
   - Generate new wallet (save seed phrase!)
   - Verify TNK balance

2. **Profile Setup**
   - Set username (displayed in markets)
   - Choose verifier opt-in (Y/N)
   - Set notification preferences

3. **Peer Discovery**
   - Connect to admin peer automatically
   - Join market discovery swarm
   - Sync existing markets

---

## Agent Operational Guide

### 1. Creating a Prediction Market

**Command:** `create-market`

**Required Parameters:**
- `question` - Binary yes/no question (max 200 chars)
- `resolutionDate` - ISO timestamp when outcome known
- `resolutionSource` - Where to verify (URL or description)
- `minStake` - Minimum stake in TNK (10-1000)
- `verifierCount` - Required verifiers (3-10)

**Example:**
```javascript
{
  question: "Will Bitcoin close above $100,000 on March 1, 2026?",
  resolutionDate: "2026-03-01T23:59:59Z",
  resolutionSource: "CoinGecko BTC/USD closing price",
  minStake: 50,
  verifierCount: 5
}
```

**Process:**
1. Validate question is binary (yes/no answerable)
2. Verify resolution date is future (min 24h from now)
3. Check resolution source is specific and verifiable
4. Deduct 20 TNK creation fee from wallet
5. Generate unique market ID
6. Broadcast market via sidechannel
7. Record on Trac contract
8. Return market ID to user

**Agent Tips:**
- Suggest clear, unambiguous questions
- Recommend reputable resolution sources
- Warn about unclear timeframes
- Check similar existing markets to avoid duplicates

---

### 2. Browsing Available Markets

**Command:** `list-markets [filter]`

**Filters:**
- `active` - Currently accepting stakes
- `closing-soon` - Closes within 24 hours
- `high-volume` - Pool > 1,000 TNK
- `my-positions` - Markets user has staked in
- `verifying` - Awaiting outcome verification
- `resolved` - Completed markets

**Display Format:**
```
Market #142: Will BTC reach $100k by March 2026?
  Pool: 8,540 TNK | YES: 68% (5,802 TNK) | NO: 32% (2,738 TNK)
  Closes: Mar 1, 2026 23:59 UTC (12d 4h)
  Participants: 52 | Verifiers: 3/5 signed up
  Status: Active
```

**Agent Actions:**
- Sort by relevance to user interests
- Highlight closing soon markets
- Flag markets needing verifiers
- Show markets where user has positions

---

### 3. Placing a Stake

**Command:** `stake <market_id> <position> <amount>`

**Parameters:**
- `market_id` - Target market identifier
- `position` - "YES" or "NO"
- `amount` - TNK amount (>= market minimum)

**Example:**
```javascript
stake("market_142", "YES", 200)
```

**Pre-Stake Validation:**
1. Check market status is "active"
2. Verify market not closed
3. Confirm user has sufficient TNK balance
4. Validate amount >= minimum stake
5. Calculate potential payout

**Payout Calculation:**
```javascript
// Current market state
yesPool = 5802
noPool = 2738
totalPool = yesPool + noPool

// User stakes 200 TNK on YES
newYesPool = yesPool + 200
newTotalPool = totalPool + 200

// If YES wins
userShare = 200 / newYesPool
platformFee = newTotalPool * 0.02
verifierFee = newTotalPool * 0.01
winnersPool = newTotalPool - platformFee - verifierFee
userPayout = userShare * winnersPool

// Display to user
profit = userPayout - 200
profitPercent = (profit / 200) * 100
```

**Process:**
1. Display current odds and potential payout
2. Request user confirmation
3. Deduct TNK from wallet
4. Broadcast stake via sidechannel
5. Update local market state
6. Record on Trac contract
7. Issue stake receipt

**Agent Tips:**
- Always show potential payout BEFORE confirming
- Warn about changing odds if market volatile
- Suggest waiting if user unsure
- Remind about irrevocability (except early exit fee)

---

### 4. Monitoring Market Positions

**Command:** `my-positions`

**Display:**
```
YOUR ACTIVE POSITIONS

Market #142: Will BTC reach $100k?
  Your Position: YES - 200 TNK staked
  Current Odds: YES 68% / NO 32%
  Potential Payout: 294 TNK (47% profit)
  Closes: 12d 4h
  Status: Active

Market #138: Will it rain in Jakarta?
  Your Position: NO - 150 TNK staked
  Current Odds: YES 45% / NO 55%
  Potential Payout: 264 TNK (76% profit)
  Closes: 3d 2h
  Status: Active

Total Staked: 350 TNK
Total Potential: 558 TNK (+59.4% if all win)
```

**Real-Time Updates:**
- Monitor odds changes via sidechannel
- Alert user to significant odds shifts (>10%)
- Notify when market enters closing phase (<24h)
- Update potential payouts continuously

---

### 5. Outcome Verification Process

**When Market Closes:**
1. Market status changes to "verifying"
2. Verification window opens (24-72 hours)
3. Designated verifiers receive notification
4. Verifiers submit votes + evidence

**For Verifiers:**

**Command:** `verify <market_id> <outcome> <evidence>`

**Parameters:**
- `market_id` - Market to verify
- `outcome` - "YES" or "NO"
- `evidence` - URL or text proving outcome

**Example:**
```javascript
verify("market_142", "YES", "https://coingecko.com/btc - Price: $102,450 at 23:59 UTC")
```

**Verifier Requirements:**
- Must have staked 50 TNK as collateral
- Must submit within verification window
- Must provide evidence/reasoning
- Vote counted toward consensus

**Consensus Rules:**
- Minimum 66% agreement required
- If consensus reached: outcome finalized
- If no consensus: extended period (48h more)
- If still no consensus: all stakes refunded

**Verifier Rewards:**
- Honest verifiers (voted with consensus): Share 1% of pool
- Dishonest verifiers (voted against consensus): Lose 50 TNK collateral
- Non-voters: Lose verifier status temporarily

**Agent Actions for Verifiers:**
- Fetch resolution source automatically
- Present evidence clearly
- Show current vote distribution
- Warn about consensus requirement
- Calculate verification reward

---

### 6. Claiming Payouts

**Command:** `claim <market_id>`

**Eligibility Check:**
1. Market status = "resolved"
2. User had stake on winning side
3. Payout not yet claimed

**Process:**
1. Calculate exact payout amount
2. Display breakdown:
   ```
   Market #142 - RESOLVED (YES won)
   
   Your Stake: 200 TNK (YES)
   Total Winning Pool: 6,002 TNK
   Your Share: 3.33%
   
   Payout Calculation:
   Total Pool: 8,540 TNK
   - Platform Fee (2%): 170.8 TNK
   - Verifier Fee (1%): 85.4 TNK
   Winners Pool: 8,283.8 TNK
   
   Your Payout: 275.8 TNK
   Profit: 75.8 TNK (37.9%)
   ```
3. Transfer TNK to wallet
4. Update user stats:
   - Total markets won +1
   - Total TNK earned +75.8
   - Win rate recalculated
   - Oracle score updated
5. Issue payout receipt

**Agent Tips:**
- Notify user immediately when claim available
- Auto-claim option (if enabled)
- Batch claim multiple markets

---

### 7. Reputation System

**Oracle Score Calculation:**
```javascript
oracleScore = (correctPredictions / totalPredictions) * 100

// Weighted by stake size
weightedScore = Σ(stakeAmount * isCorrect) / Σ(stakeAmount) * 100
```

**Verifier Score:**
```javascript
verifierScore = (consensusVotes / totalVotes) * 100
```

**Display:**
```
YOUR REPUTATION

Oracle Score: 76.5%
├─ Markets Participated: 23
├─ Correct Predictions: 17
├─ Incorrect Predictions: 6
└─ Total TNK Staked: 4,820

Verifier Score: 94.2%
├─ Verifications: 34
├─ Consensus Votes: 32
├─ Disputed Votes: 2
└─ Verification Earnings: 142 TNK

Overall Rank: #47 of 1,203 users
```

---

## Advanced Features

### Market Categories

**Auto-categorization based on keywords:**
- Crypto: BTC, ETH, price, token, DeFi
- Weather: rain, temperature, storm, sunny
- Sports: team names, game, match, championship
- Politics: election, vote, policy, president
- Technology: launch, release, update, version

**Agent Use:**
- Suggest relevant markets by category
- Filter browsing by user interests
- Recommend similar markets

---

### Early Position Exit

**Command:** `exit-position <market_id>`

**Conditions:**
- Market still active (not closed)
- User has position in market
- Willing to pay 5% early exit fee

**Process:**
1. Calculate exit penalty (5% of stake)
2. Return 95% of original stake
3. Adjust market odds accordingly
4. Allow immediate re-stake if desired

**When to Suggest:**
- Odds shifted significantly against user
- User needs liquidity urgently
- Market information changed

---

### Market Chat & Discussion

**Command:** `chat <market_id> <message>`

**Features:**
- Real-time P2P chat per market
- Share analysis and evidence
- Discuss resolution criteria
- Build community consensus

**Moderation:**
- Report spam/abuse
- Community voting on moderation
- Temporary mutes for violations

---

## Error Handling

### Common Errors & Solutions

**Error: "Insufficient TNK Balance"**
```
Solution: User needs to fund wallet
Action: Display current balance and required amount
Suggest: Provide TNK acquisition links
```

**Error: "Market Already Closed"**
```
Solution: Cannot stake on closed market
Action: Show market close time
Suggest: Browse other active markets
```

**Error: "Minimum Stake Not Met"**
```
Solution: Increase stake amount
Action: Display minimum required
Suggest: Show minimum for profitable payout
```

**Error: "Verification Deadline Passed"**
```
Solution: Too late to vote on outcome
Action: Wait for consensus or extended period
Suggest: Opt-in to future verifications earlier
```

**Error: "No Consensus Reached"**
```
Solution: Insufficient agreement on outcome
Action: Refund all stakes automatically
Suggest: Create clearer markets in future
```

---

## Performance Optimization

### Sidechannel Best Practices
- Batch market updates (max 1 per second)
- Compress large market lists
- Cache frequently accessed markets
- Sync only delta changes

### Contract Interactions
- Batch multiple claims in one transaction
- Use gas estimation before transactions
- Cache contract state locally
- Only write when necessary (reads are free)

---

## Security Guidelines

### User Protection
- Never ask for private keys
- Always show transaction details before signing
- Warn about large stakes (>10% of balance)
- Verify contract addresses before interaction

### Anti-Manipulation
- Detect rapid stake changes (possible manipulation)
- Flag suspicious verifier behavior
- Monitor for collusion patterns
- Report anomalies to admin peer

### Smart Contract Safety
- Verify contract deployment address
- Check for pause state before transactions
- Validate all function parameters
- Handle transaction failures gracefully

---

## Troubleshooting

### "Cannot Connect to Admin Peer"
1. Check internet connection
2. Verify Pear runtime running
3. Restart application
4. Check firewall settings

### "Market Not Syncing"
1. Wait for sidechannel sync (up to 30 seconds)
2. Manually refresh market list
3. Reconnect to swarm
4. Check contract state directly

### "Payout Not Received"
1. Verify market is resolved
2. Check claim eligibility
3. Confirm on winning side
4. Query contract directly for payout status

---

## Agent Decision Trees

### Should User Create This Market?

```
Is question binary (yes/no)? 
├─ NO → Reject, suggest rewording
└─ YES → Continue

Is outcome verifiable?
├─ NO → Reject, request clear source
└─ YES → Continue

Is resolution date specific?
├─ NO → Reject, request exact time
└─ YES → Continue

Does similar market exist?
├─ YES → Suggest joining existing
└─ NO → Continue

Has user 20+ TNK for fee?
├─ NO → Reject, show balance needed
└─ YES → APPROVE CREATION
```

### Should User Stake on This Market?

```
Is market active?
├─ NO → Reject, show status
└─ YES → Continue

Does user have sufficient TNK?
├─ NO → Reject, show balance needed
└─ YES → Continue

Is potential payout favorable? (>20% profit)
├─ NO → Warn about low profit
└─ YES → Continue

Does user understand resolution criteria?
├─ NO → Explain criteria first
└─ YES → Continue

Is this >20% of user's balance?
├─ YES → Warn about large stake
└─ NO → Continue

CALCULATE PAYOUT → SHOW TO USER → REQUEST CONFIRMATION
```

---

## Integration with Other Systems

### External Data Sources
- CoinGecko API (crypto prices)
- Weather APIs (weather outcomes)
- News APIs (event verification)
- Sports APIs (game results)

### Export Capabilities
- Export market history as JSON
- Export personal stats as CSV
- Share market links
- Generate performance reports

---

## Best Practices for AI Agents

### Always Do:
✅ Validate user inputs before processing
✅ Show clear confirmation dialogs for financial actions
✅ Explain odds and potential payouts
✅ Update user on market changes in real-time
✅ Suggest markets matching user interests
✅ Educate users about verification importance

### Never Do:
❌ Auto-stake without explicit user confirmation
❌ Recommend "guaranteed" outcomes
❌ Vote on verifications without checking evidence
❌ Ignore error messages or warnings
❌ Use Node.js runtime (ALWAYS use Pear)
❌ Expose private keys or seed phrases

---

## Quick Reference Commands

```bash
# Market Operations
create-market              # Create new prediction market
list-markets [filter]      # Browse available markets
view-market <id>           # View market details
stake <id> <YES|NO> <amt>  # Place stake on outcome

# User Operations
my-positions               # View active stakes
my-stats                   # View reputation & history
claim <market_id>          # Claim winning payout
exit-position <market_id>  # Early exit with fee

# Verification
verify <id> <outcome> <ev> # Vote on outcome
my-verifications           # View verification tasks

# Utility
balance                    # Check TNK balance
help <command>             # Get command help
settings                   # Configure preferences
```

---

## Support & Resources

- **Documentation:** Full docs at /docs
- **Community:** Join market chat for help
- **Issues:** Report bugs via GitHub
- **Updates:** Check changelog for new features

---

**This SKILL.md is designed for AI agent consumption and should be read entirely before performing any PeerPredict operations.**

*Last Updated: February 16, 2026*
