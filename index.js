#!/usr/bin/env pear

/**
 * PeerPredict - Decentralized Prediction Market
 * Built on Intercom (Trac Network)
 * 
 * Main application entry point
 */

import Hyperswarm from 'hyperswarm'
import Hyperbee from 'hyperbee'
import Hypercore from 'hypercore'
import crypto from 'hypercore-crypto'
import b4a from 'b4a'

// Constants
const MARKET_TOPIC = b4a.from('peerpredict-markets', 'utf-8')
const STAKE_TOPIC = b4a.from('peerpredict-stakes', 'utf-8')
const VERIFY_TOPIC = b4a.from('peerpredict-verify', 'utf-8')

// Global state
let swarm = null
let marketDb = null
let stakeDb = null
let isAdmin = false

/**
 * Initialize PeerPredict application
 */
async function init() {
  console.log('🎯 PeerPredict - Decentralized Prediction Market')
  console.log('━'.repeat(60))
  
  // Check if running as admin peer
  isAdmin = process.argv.includes('--admin')
  
  if (isAdmin) {
    console.log('🔧 Starting as ADMIN peer (market coordinator)')
  } else {
    console.log('👤 Starting as USER peer')
  }
  
  // Initialize databases
  await initDatabases()
  
  // Initialize P2P swarm
  await initSwarm()
  
  // Start appropriate interface
  if (isAdmin) {
    await startAdminInterface()
  } else {
    await startUserInterface()
  }
}

/**
 * Initialize Hyperbee databases
 */
async function initDatabases() {
  console.log('📊 Initializing databases...')
  
  // Market database
  const marketCore = new Hypercore('./data/markets')
  await marketCore.ready()
  marketDb = new Hyperbee(marketCore, {
    keyEncoding: 'utf-8',
    valueEncoding: 'json'
  })
  
  // Stake database
  const stakeCore = new Hypercore('./data/stakes')
  await stakeCore.ready()
  stakeDb = new Hyperbee(stakeCore, {
    keyEncoding: 'utf-8',
    valueEncoding: 'json'
  })
  
  console.log('✓ Databases initialized')
}

/**
 * Initialize Hyperswarm P2P network
 */
async function initSwarm() {
  console.log('🌐 Connecting to P2P network...')
  
  swarm = new Hyperswarm()
  
  // Join market discovery swarm
  const discovery = swarm.join(MARKET_TOPIC, {
    server: isAdmin,
    client: !isAdmin
  })
  
  await discovery.flushed()
  
  // Handle peer connections
  swarm.on('connection', handlePeerConnection)
  
  console.log('✓ Connected to network')
  console.log(`  Peers: ${swarm.connections.size}`)
}

/**
 * Handle new peer connection
 */
function handlePeerConnection(conn, info) {
  console.log(`🤝 New peer connected: ${info.publicKey.toString('hex').slice(0, 8)}...`)
  
  conn.on('data', async (data) => {
    try {
      const message = JSON.parse(data.toString())
      await handleMessage(conn, message)
    } catch (err) {
      console.error('Error handling message:', err)
    }
  })
  
  conn.on('error', (err) => {
    console.error('Connection error:', err)
  })
  
  conn.on('close', () => {
    console.log('👋 Peer disconnected')
  })
}

/**
 * Handle incoming P2P messages
 */
async function handleMessage(conn, message) {
  switch (message.type) {
    case 'CREATE_MARKET':
      await handleCreateMarket(conn, message.data)
      break
      
    case 'PLACE_STAKE':
      await handlePlaceStake(conn, message.data)
      break
      
    case 'VERIFY_OUTCOME':
      await handleVerifyOutcome(conn, message.data)
      break
      
    case 'CLAIM_PAYOUT':
      await handleClaimPayout(conn, message.data)
      break
      
    case 'SYNC_MARKETS':
      await handleSyncMarkets(conn)
      break
      
    default:
      console.log(`Unknown message type: ${message.type}`)
  }
}

/**
 * Handle market creation
 */
async function handleCreateMarket(conn, data) {
  console.log('📝 Creating new market...')
  
  const { question, resolutionDate, resolutionSource, minStake, verifierCount } = data
  
  // Validate market data
  if (!validateMarketData(data)) {
    conn.write(JSON.stringify({
      type: 'ERROR',
      message: 'Invalid market data'
    }))
    return
  }
  
  // Generate market ID
  const marketId = `market_${Date.now()}`
  
  // Create market object
  const market = {
    id: marketId,
    question,
    resolutionDate,
    resolutionSource,
    minStake,
    verifierCount,
    creator: data.creator,
    created: Date.now(),
    closes: new Date(resolutionDate).getTime(),
    yesPool: 0,
    noPool: 0,
    participants: [],
    status: 'active',
    outcome: null,
    verifiers: []
  }
  
  // Save to database
  await marketDb.put(marketId, market)
  
  // Broadcast to network
  broadcastToAll({
    type: 'MARKET_CREATED',
    data: market
  })
  
  console.log(`✓ Market created: ${marketId}`)
  
  // Send confirmation
  conn.write(JSON.stringify({
    type: 'MARKET_CREATED',
    data: market
  }))
}

/**
 * Handle stake placement
 */
async function handlePlaceStake(conn, data) {
  console.log('💰 Processing stake...')
  
  const { marketId, position, amount, user } = data
  
  // Get market
  const marketEntry = await marketDb.get(marketId)
  if (!marketEntry) {
    conn.write(JSON.stringify({
      type: 'ERROR',
      message: 'Market not found'
    }))
    return
  }
  
  const market = marketEntry.value
  
  // Validate stake
  if (market.status !== 'active') {
    conn.write(JSON.stringify({
      type: 'ERROR',
      message: 'Market is not active'
    }))
    return
  }
  
  if (amount < market.minStake) {
    conn.write(JSON.stringify({
      type: 'ERROR',
      message: `Minimum stake is ${market.minStake} TNK`
    }))
    return
  }
  
  // Update market pools
  if (position === 'YES') {
    market.yesPool += amount
  } else {
    market.noPool += amount
  }
  
  // Add participant
  if (!market.participants.includes(user)) {
    market.participants.push(user)
  }
  
  // Save stake
  const stakeId = `${marketId}_${user}_${Date.now()}`
  await stakeDb.put(stakeId, {
    marketId,
    user,
    position,
    amount,
    timestamp: Date.now()
  })
  
  // Update market
  await marketDb.put(marketId, market)
  
  // Broadcast update
  broadcastToAll({
    type: 'STAKE_PLACED',
    data: {
      marketId,
      user,
      position,
      amount,
      newOdds: calculateOdds(market)
    }
  })
  
  console.log(`✓ Stake placed: ${amount} TNK on ${position}`)
  
  // Send confirmation
  conn.write(JSON.stringify({
    type: 'STAKE_CONFIRMED',
    data: {
      marketId,
      position,
      amount,
      odds: calculateOdds(market)
    }
  }))
}

/**
 * Handle outcome verification
 */
async function handleVerifyOutcome(conn, data) {
  console.log('✅ Processing verification vote...')
  
  const { marketId, outcome, evidence, verifier } = data
  
  // Get market
  const marketEntry = await marketDb.get(marketId)
  if (!marketEntry) {
    return
  }
  
  const market = marketEntry.value
  
  // Add verifier vote
  market.verifiers.push({
    address: verifier,
    vote: outcome,
    evidence,
    timestamp: Date.now()
  })
  
  // Check for consensus
  if (market.verifiers.length >= market.verifierCount) {
    const consensus = checkConsensus(market.verifiers)
    
    if (consensus) {
      market.outcome = consensus
      market.status = 'resolved'
      
      console.log(`✓ Consensus reached: ${consensus}`)
      
      // Broadcast resolution
      broadcastToAll({
        type: 'MARKET_RESOLVED',
        data: {
          marketId,
          outcome: consensus
        }
      })
    }
  }
  
  // Update market
  await marketDb.put(marketId, market)
}

/**
 * Handle payout claim
 */
async function handleClaimPayout(conn, data) {
  console.log('💸 Processing payout claim...')
  
  const { marketId, user } = data
  
  // Get market and user stake
  const marketEntry = await marketDb.get(marketId)
  const market = marketEntry.value
  
  // Calculate payout
  const payout = calculatePayout(market, user)
  
  if (payout > 0) {
    console.log(`✓ Payout: ${payout} TNK`)
    
    conn.write(JSON.stringify({
      type: 'PAYOUT_READY',
      data: {
        marketId,
        amount: payout
      }
    }))
  }
}

/**
 * Sync markets with peer
 */
async function handleSyncMarkets(conn) {
  const markets = []
  
  for await (const entry of marketDb.createReadStream()) {
    markets.push(entry.value)
  }
  
  conn.write(JSON.stringify({
    type: 'MARKETS_SYNCED',
    data: markets
  }))
}

/**
 * Broadcast message to all connected peers
 */
function broadcastToAll(message) {
  const data = JSON.stringify(message)
  
  for (const conn of swarm.connections) {
    try {
      conn.write(data)
    } catch (err) {
      console.error('Broadcast error:', err)
    }
  }
}

/**
 * Calculate market odds
 */
function calculateOdds(market) {
  const total = market.yesPool + market.noPool
  
  if (total === 0) {
    return { yes: 50, no: 50 }
  }
  
  return {
    yes: Math.round((market.yesPool / total) * 100),
    no: Math.round((market.noPool / total) * 100)
  }
}

/**
 * Check for verification consensus
 */
function checkConsensus(verifiers) {
  const votes = { YES: 0, NO: 0 }
  
  for (const v of verifiers) {
    votes[v.vote]++
  }
  
  const total = verifiers.length
  const threshold = Math.ceil(total * 0.66)
  
  if (votes.YES >= threshold) return 'YES'
  if (votes.NO >= threshold) return 'NO'
  
  return null
}

/**
 * Calculate user payout
 */
function calculatePayout(market, user) {
  // Implementation would query stake DB
  // and calculate proportional share
  return 0 // Placeholder
}

/**
 * Validate market creation data
 */
function validateMarketData(data) {
  if (!data.question || data.question.length === 0) return false
  if (!data.resolutionDate) return false
  if (!data.resolutionSource) return false
  if (data.minStake < 10) return false
  if (data.verifierCount < 3 || data.verifierCount > 10) return false
  
  return true
}

/**
 * Start admin interface
 */
async function startAdminInterface() {
  console.log('━'.repeat(60))
  console.log('🎯 Admin Peer Running')
  console.log('━'.repeat(60))
  console.log('Coordinating markets, verification, and payouts')
  console.log('Connected peers will sync with this admin peer')
  console.log('')
  console.log('Press Ctrl+C to stop')
  
  // Auto-close markets that reach resolution date
  setInterval(async () => {
    await checkAndCloseMarkets()
  }, 60000) // Check every minute
}

/**
 * Start user interface
 */
async function startUserInterface() {
  console.log('━'.repeat(60))
  console.log('🎯 PeerPredict User Interface')
  console.log('━'.repeat(60))
  console.log('')
  console.log('Commands:')
  console.log('  list-markets     - Browse active markets')
  console.log('  create-market    - Create new prediction market')
  console.log('  stake <id>       - Place stake on market')
  console.log('  my-positions     - View your positions')
  console.log('  verify <id>      - Verify market outcome')
  console.log('  claim <id>       - Claim payout')
  console.log('  help             - Show help')
  console.log('  exit             - Quit application')
  console.log('')
  
  // In a real implementation, this would be an interactive CLI
  // or GUI interface using the Pear framework
}

/**
 * Check and close markets that reached resolution date
 */
async function checkAndCloseMarkets() {
  const now = Date.now()
  
  for await (const entry of marketDb.createReadStream()) {
    const market = entry.value
    
    if (market.status === 'active' && now >= market.closes) {
      market.status = 'verifying'
      await marketDb.put(market.id, market)
      
      console.log(`⏰ Market ${market.id} closed - now verifying`)
      
      broadcastToAll({
        type: 'MARKET_CLOSED',
        data: {
          marketId: market.id
        }
      })
    }
  }
}

/**
 * Graceful shutdown
 */
async function shutdown() {
  console.log('\n👋 Shutting down...')
  
  if (swarm) {
    await swarm.destroy()
  }
  
  if (marketDb) {
    await marketDb.close()
  }
  
  if (stakeDb) {
    await stakeDb.close()
  }
  
  console.log('✓ Goodbye!')
  process.exit(0)
}

// Handle shutdown signals
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

// Start application
init().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
