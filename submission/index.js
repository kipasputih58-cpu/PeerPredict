#!/usr/bin/env node

/**
 * PeerPredict - Decentralized Prediction Market with Trac Wallet Integration
 * Trac Systems Intercom Competition Entry
 * 
 * Features:
 * - P2P Network via Hyperswarm
 * - Trac-Compatible Wallet System (Bitcoin-style addresses)
 * - Wallet Connect for browser extension wallets
 * - Deposit & Withdraw functionality
 * - Betting/Staking on predictions
 * - Vote with real balance stakes
 * - Rewards & Claim system
 * - Transaction history
 */

import Hyperswarm from 'hyperswarm'
import Corestore from 'corestore'
import Hyperbee from 'hyperbee'
import b4a from 'b4a'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import readline from 'readline'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ============================================================================
// Configuration
// ============================================================================

const TOPIC_KEY = 'peerpredict-trac-systems-2024-v1-final'
const TOPIC_HASH = crypto.createHash('sha256').update(TOPIC_KEY).digest()
const STORAGE_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.peerpredict')
const WALLET_FILE = path.join(STORAGE_DIR, 'wallet.json')
const DEFAULT_STAKE = 10
const MIN_DEPOSIT = 1
const MAX_DEPOSIT = 1000000
const FEE_PERCENTAGE = 0.01

// ============================================================================
// Base58Check Encoding (Bitcoin/Trac compatible)
// ============================================================================

const BASE58_ALPHABABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

function base58Encode (buffer) {
  const digits = [0]
  for (let i = 0; i < buffer.length; i++) {
    let carry = buffer[i]
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8
      digits[j] = carry % 58
      carry = (carry / 58) | 0
    }
    while (carry) {
      digits.push(carry % 58)
      carry = (carry / 58) | 0
    }
  }
  let result = ''
  for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
    result += BASE58_ALPHABABET[0]
  }
  for (let i = digits.length - 1; i >= 0; i--) {
    result += BASE58_ALPHABABET[digits[i]]
  }
  return result
}

function base58Decode (string) {
  const bytes = [0]
  for (let i = 0; i < string.length; i++) {
    const value = BASE58_ALPHABABET.indexOf(string[i])
    if (value === -1) throw new Error('Invalid base58 character')
    let carry = value
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58
      bytes[j] = carry & 0xff
      carry = (carry >> 8) | 0
    }
    while (carry) {
      bytes.push(carry & 0xff)
      carry = (carry >> 8) | 0
    }
  }
  const result = Buffer.alloc(bytes.length)
  for (let i = 0; i < bytes.length; i++) {
    result[i] = bytes[bytes.length - 1 - i]
  }
  return result
}

function doubleSha256 (buffer) {
  return crypto.createHash('sha256').update(crypto.createHash('sha256').update(buffer).digest()).digest()
}

function toBase58Check (payload, version) {
  const versionBuffer = Buffer.from([version])
  const payloadBuffer = Buffer.isBuffer(payload) ? payload : Buffer.from(payload, 'hex')
  const data = Buffer.concat([versionBuffer, payloadBuffer])
  const checksum = doubleSha256(data).slice(0, 4)
  return base58Encode(Buffer.concat([data, checksum]))
}

function fromBase58Check (address) {
  const buffer = base58Decode(address)
  const payload = buffer.slice(1, -4)
  const checksum = buffer.slice(-4)
  const expectedChecksum = doubleSha256(buffer.slice(0, -4)).slice(0, 4)
  if (!checksum.equals(expectedChecksum)) {
    throw new Error('Invalid checksum')
  }
  const version = buffer[0]
  return { version, payload }
}

// ============================================================================
// Trac-Compatible Wallet Class
// ============================================================================

class Wallet {
  constructor () {
    this.address = null
    this.privateKey = null
    this.publicKey = null
    this.balance = 0
    this.lockedBalance = 0
    this.transactions = []
    this.createdAt = null
    this.connected = false // For external wallet connection
    this.externalAddress = null // For wallet connect
  }

  /**
   * Generate new Trac-compatible wallet (Bitcoin-style P2PKH address)
   * Uses version byte 0x00 for mainnet (addresses start with '1')
   */
  generate () {
    // Generate 32-byte private key
    this.privateKey = crypto.randomBytes(32).toString('hex')
    
    // Derive public key using elliptic curve (secp256k1 simulation)
    // For production, use proper secp256k1 library
    const publicKeyHash = this._derivePublicKeyHash(this.privateKey)
    
    // Create P2PKH address (starts with '1' like Bitcoin mainnet)
    this.address = toBase58Check(publicKeyHash, 0x00)
    
    this.balance = 1000 // Starting balance in Trac tokens
    this.lockedBalance = 0
    this.transactions = []
    this.createdAt = Date.now()

    this.addTransaction({
      type: 'reward',
      amount: 1000,
      description: 'Welcome bonus - 1000 Trac tokens',
      timestamp: Date.now()
    })

    return this
  }

  /**
   * Connect external wallet (Trac wallet extension, etc.)
   */
  connectExternal (address) {
    if (!this._validateAddress(address)) {
      throw new Error('Invalid Trac address format')
    }
    
    this.externalAddress = address
    this.address = address
    this.connected = true
    this.privateKey = null // External wallet manages private key
    
    // Load or create wallet state for this address
    this.load()
    
    return this
  }

  /**
   * Derive public key hash (simulated - use proper secp256k1 in production)
   */
  _derivePublicKeyHash (privateKeyHex) {
    // In production: use secp256k1 to derive public key
    // For demo: use SHA256 + RIPEMD160 of private key
    const privateKeyBuffer = Buffer.from(privateKeyHex, 'hex')
    const hash1 = crypto.createHash('sha256').update(privateKeyBuffer).digest()
    const hash2 = crypto.createHash('ripemd160').update(hash1).digest()
    return hash2
  }

  /**
   * Validate Trac address format
   */
  _validateAddress (address) {
    try {
      // Check basic format
      if (!address || typeof address !== 'string') return false
      
      // Accept P2PKH (starts with 1), P2SH (starts with 3), or Bech32 (starts with bc1)
      if (address.match(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/)) return true
      if (address.match(/^bc1[a-z0-9]{39,59}$/i)) return true
      if (address.match(/^trac1[a-z0-9]{39,59}$/i)) return true // Trac native
      
      // Try to decode as Base58Check
      const decoded = fromBase58Check(address)
      return [0x00, 0x05].includes(decoded.version) // P2PKH or P2SH
    } catch (err) {
      return false
    }
  }

  load () {
    try {
      // Use address-specific wallet file for external wallets
      const walletFile = this.connected 
        ? path.join(STORAGE_DIR, `wallet_${this.address}.json`)
        : WALLET_FILE
        
      if (fs.existsSync(walletFile)) {
        const data = JSON.parse(fs.readFileSync(walletFile, 'utf8'))
        if (!this.connected) {
          this.address = data.address
          this.privateKey = data.privateKey
        }
        this.balance = data.balance || 0
        this.lockedBalance = data.lockedBalance || 0
        this.transactions = data.transactions || []
        this.createdAt = data.createdAt
        return true
      }
    } catch (err) {
      console.error('Failed to load wallet:', err.message)
    }
    return false
  }

  save () {
    try {
      if (!fs.existsSync(STORAGE_DIR)) {
        fs.mkdirSync(STORAGE_DIR, { recursive: true })
      }
      
      const walletFile = this.connected 
        ? path.join(STORAGE_DIR, `wallet_${this.address}.json`)
        : WALLET_FILE
      
      const data = {
        address: this.address,
        privateKey: this.connected ? null : this.privateKey,
        balance: this.balance,
        lockedBalance: this.lockedBalance,
        transactions: this.transactions,
        createdAt: this.createdAt,
        connected: this.connected
      }
      
      fs.writeFileSync(walletFile, JSON.stringify(data, null, 2))
      return true
    } catch (err) {
      console.error('Failed to save wallet:', err.message)
      return false
    }
  }

  getAvailableBalance () {
    return this.balance - this.lockedBalance
  }

  addTransaction (tx) {
    const transaction = {
      id: 'tx-' + crypto.randomBytes(6).toString('hex'),
      ...tx,
      timestamp: tx.timestamp || Date.now()
    }
    this.transactions.unshift(transaction)
    
    if (this.transactions.length > 100) {
      this.transactions = this.transactions.slice(0, 100)
    }
    
    this.save()
    return transaction
  }

  deposit (amount, txHash = null) {
    if (amount < MIN_DEPOSIT) {
      throw new Error(`Minimum deposit is ${MIN_DEPOSIT} Trac`)
    }
    if (amount > MAX_DEPOSIT) {
      throw new Error(`Maximum deposit is ${MAX_DEPOSIT} Trac`)
    }

    this.balance += amount
    
    const tx = this.addTransaction({
      type: 'deposit',
      amount,
      txHash: txHash || 'trac-' + crypto.randomBytes(8).toString('hex'),
      description: `Deposited ${amount} Trac tokens`,
      status: 'confirmed'
    })

    return tx
  }

  withdraw (amount, toAddress) {
    if (!this._validateAddress(toAddress)) {
      throw new Error('Invalid Trac destination address')
    }
    if (amount > this.getAvailableBalance()) {
      throw new Error('Insufficient available balance')
    }
    if (amount < MIN_DEPOSIT) {
      throw new Error(`Minimum withdrawal is ${MIN_DEPOSIT} Trac`)
    }

    this.balance -= amount
    
    const tx = this.addTransaction({
      type: 'withdraw',
      amount: -amount,
      toAddress,
      description: `Withdrew ${amount} Trac to ${toAddress.slice(0, 8)}...`,
      status: 'pending'
    })

    return tx
  }

  transfer (amount, toAddress) {
    if (!this._validateAddress(toAddress)) {
      throw new Error('Invalid Trac destination address')
    }
    if (amount > this.getAvailableBalance()) {
      throw new Error('Insufficient balance')
    }

    this.balance -= amount
    
    const tx = this.addTransaction({
      type: 'transfer',
      amount: -amount,
      toAddress,
      description: `Sent ${amount} Trac to ${toAddress.slice(0, 8)}...`,
      status: 'confirmed'
    })

    return tx
  }

  lock (amount) {
    if (amount > this.getAvailableBalance()) {
      throw new Error('Insufficient available balance')
    }
    this.lockedBalance += amount
    this.save()
    return true
  }

  unlock (amount) {
    this.lockedBalance = Math.max(0, this.lockedBalance - amount)
    this.save()
    return true
  }

  addWinnings (amount, predictionId) {
    const fee = Math.floor(amount * FEE_PERCENTAGE)
    const netAmount = amount - fee
    
    this.balance += netAmount
    this.lockedBalance = Math.max(0, this.lockedBalance - amount)
    
    this.addTransaction({
      type: 'winnings',
      amount: netAmount,
      fee,
      predictionId,
      description: `Won ${netAmount} Trac (fee: ${fee} Trac)`,
      status: 'confirmed'
    })

    this.save()
    return netAmount
  }

  deductBet (amount, predictionId, choice) {
    if (amount > this.getAvailableBalance()) {
      throw new Error('Insufficient available balance')
    }

    this.balance -= amount
    this.lockedBalance += amount
    
    this.addTransaction({
      type: 'bet',
      amount: -amount,
      predictionId,
      choice,
      description: `Bet ${amount} Trac on "${choice}"`,
      status: 'confirmed'
    })

    this.save()
    return true
  }

  getInfo () {
    return {
      address: this.address,
      balance: this.balance,
      availableBalance: this.getAvailableBalance(),
      lockedBalance: this.lockedBalance,
      totalTransactions: this.transactions.length,
      createdAt: this.createdAt,
      connected: this.connected
    }
  }

  getTransactions (limit = 20, type = null) {
    let txs = this.transactions
    if (type) {
      txs = txs.filter(tx => tx.type === type)
    }
    return txs.slice(0, limit)
  }
}

// ============================================================================
// Prediction Class
// ============================================================================

class Prediction {
  constructor (id, question, options, createdBy, deadline = null) {
    this.id = id
    this.question = question
    this.options = options || ['Yes', 'No']
    this.createdBy = createdBy
    this.deadline = deadline || (Date.now() + 7 * 24 * 60 * 60 * 1000)
    this.createdAt = Date.now()
    this.updatedAt = Date.now()
    this.resolved = false
    this.resolution = null
    this.resolvedAt = null
    this.resolvedBy = null
    this.votes = []
    this.totalStake = 0
    this.optionStakes = {}
    
    for (const opt of this.options) {
      this.optionStakes[opt] = 0
    }
  }

  addVote (voterAddress, choice, stake) {
    if (this.resolved) {
      throw new Error('Prediction already resolved')
    }
    if (!this.options.includes(choice)) {
      throw new Error(`Invalid choice. Options: ${this.options.join(', ')}`)
    }

    const existingIndex = this.votes.findIndex(v => v.voterAddress === voterAddress)
    
    const vote = {
      voterAddress,
      choice,
      stake,
      timestamp: Date.now()
    }

    if (existingIndex >= 0) {
      const oldVote = this.votes[existingIndex]
      this.optionStakes[oldVote.choice] -= oldVote.stake
      this.votes[existingIndex] = vote
    } else {
      this.votes.push(vote)
    }

    this.optionStakes[choice] = (this.optionStakes[choice] || 0) + stake
    this.totalStake = this.votes.reduce((sum, v) => sum + v.stake, 0)
    this.updatedAt = Date.now()

    return vote
  }

  getVote (voterAddress) {
    return this.votes.find(v => v.voterAddress === voterAddress)
  }

  resolve (outcome, resolvedBy) {
    if (this.resolved) {
      throw new Error('Already resolved')
    }
    if (!this.options.includes(outcome)) {
      throw new Error(`Invalid outcome. Options: ${this.options.join(', ')}`)
    }

    this.resolved = true
    this.resolution = outcome
    this.resolvedAt = Date.now()
    this.resolvedBy = resolvedBy
    this.updatedAt = Date.now()

    return this.calculateResults()
  }

  calculateResults () {
    const results = {
      outcome: this.resolution,
      totalStake: this.totalStake,
      winningStake: 0,
      losingStake: 0,
      winners: [],
      losers: [],
      payouts: {}
    }

    for (const vote of this.votes) {
      if (vote.choice === this.resolution) {
        results.winningStake += vote.stake
        results.winners.push({
          address: vote.voterAddress,
          stake: vote.stake
        })
      } else {
        results.losingStake += vote.stake
        results.losers.push({
          address: vote.voterAddress,
          stake: vote.stake
        })
      }
    }

    if (results.winningStake > 0) {
      for (const winner of results.winners) {
        const share = winner.stake / results.winningStake
        const winnings = Math.floor(share * results.losingStake + winner.stake)
        results.payouts[winner.address] = winnings
      }
    }

    return results
  }

  getStats () {
    const stats = {
      totalVotes: this.votes.length,
      totalStake: this.totalStake,
      optionStats: {}
    }

    for (const opt of this.options) {
      const votes = this.votes.filter(v => v.choice === opt)
      stats.optionStats[opt] = {
        votes: votes.length,
        stake: this.optionStakes[opt] || 0,
        percentage: this.totalStake > 0 
          ? Math.round((this.optionStakes[opt] || 0) / this.totalStake * 100) 
          : 0
      }
    }

    return stats
  }

  toJSON () {
    return {
      id: this.id,
      question: this.question,
      options: this.options,
      createdBy: this.createdBy,
      deadline: this.deadline,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      resolved: this.resolved,
      resolution: this.resolution,
      resolvedAt: this.resolvedAt,
      resolvedBy: this.resolvedBy,
      votes: this.votes,
      totalStake: this.totalStake,
      optionStakes: this.optionStakes
    }
  }
}

// ============================================================================
// PeerPredict Core Class
// ============================================================================

class PeerPredict {
  constructor () {
    this.swarm = null
    this.corestore = null
    this.bee = null
    this.wallet = null
    this.peerId = null
    this.peers = new Map()
    this.predictions = new Map()
    this.isRunning = false
    this.rl = null
    this.server = null
  }

  async init () {
    console.log('\n🚀 Initializing PeerPredict...')
    
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true })
    }

    this.wallet = new Wallet()
    if (!this.wallet.load()) {
      this.wallet.generate()
      this.wallet.save()
      console.log('💼 New Trac wallet created!')
    } else {
      console.log('💼 Trac wallet loaded!')
    }

    this.peerId = this.wallet.address
    console.log(`📍 Your Trac Address: ${this.peerId}`)
    console.log(`💰 Balance: ${this.wallet.balance} Trac (${this.wallet.getAvailableBalance()} available)`)

    this.corestore = new Corestore(path.join(STORAGE_DIR, 'corestore'))
    await this.corestore.ready()

    const core = this.corestore.get({ name: 'predictions' })
    await core.ready()
    this.bee = new Hyperbee(core, {
      keyEncoding: 'utf-8',
      valueEncoding: 'json'
    })
    await this.bee.ready()

    await this.loadPredictions()

    this.swarm = new Hyperswarm()
    this.setupSwarmEvents()

    const discovery = this.swarm.join(TOPIC_HASH, { server: true, client: true })
    await discovery.flushed()

    console.log('🌐 Joined P2P network')
    console.log('✅ PeerPredict initialized!\n')
    
    this.isRunning = true
  }

  setupSwarmEvents () {
    this.swarm.on('connection', (connection, info) => {
      const peerId = info.publicKey ? b4a.toString(info.publicKey, 'hex').slice(0, 16) : 'unknown'
      
      console.log(`🔗 Peer connected: ${peerId}`)
      this.peers.set(peerId, { connection, info, joined: Date.now() })

      this.sendState(connection)

      connection.on('data', (data) => {
        this.handleMessage(data, connection, peerId)
      })

      connection.on('close', () => {
        console.log(`🔌 Peer disconnected: ${peerId}`)
        this.peers.delete(peerId)
      })

      connection.on('error', (err) => {
        console.log(`⚠️ Connection error: ${err.message}`)
        this.peers.delete(peerId)
      })
    })
  }

  async loadPredictions () {
    try {
      for await (const { key, value } of this.bee.createReadStream()) {
        if (key.startsWith('prediction:')) {
          const pred = new Prediction(value.id, value.question, value.options, value.createdBy, value.deadline)
          pred.createdAt = value.createdAt
          pred.updatedAt = value.updatedAt
          pred.resolved = value.resolved
          pred.resolution = value.resolution
          pred.resolvedAt = value.resolvedAt
          pred.resolvedBy = value.resolvedBy
          pred.votes = value.votes || []
          pred.totalStake = value.totalStake || 0
          pred.optionStakes = value.optionStakes || {}
          this.predictions.set(pred.id, pred)
        }
      }
      console.log(`📚 Loaded ${this.predictions.size} prediction(s)`)
    } catch (err) {
      console.log('📝 Starting fresh')
    }
  }

  async savePrediction (prediction) {
    await this.bee.put(`prediction:${prediction.id}`, prediction.toJSON())
  }

  sendState (connection) {
    const state = {
      type: 'sync',
      peerId: this.peerId,
      predictions: Array.from(this.predictions.entries()).map(([id, p]) => [id, p.toJSON()]),
      timestamp: Date.now()
    }
    connection.write(JSON.stringify(state))
  }

  handleMessage (data, connection, fromPeerId) {
    try {
      const message = JSON.parse(b4a.toString(data))
      
      switch (message.type) {
        case 'sync':
          this.handleSync(message)
          break
        case 'create':
          this.handleCreate(message)
          break
        case 'vote':
          this.handleVote(message)
          break
        case 'resolve':
          this.handleResolve(message)
          break
        case 'deposit':
          this.handleDeposit(message)
          break
      }
    } catch (err) {
      // Ignore parse errors
    }
  }

  async handleSync (message) {
    if (!message.predictions) return
    
    for (const [id, predData] of message.predictions) {
      if (!this.predictions.has(id) || this.predictions.get(id).updatedAt < predData.updatedAt) {
        const pred = new Prediction(predData.id, predData.question, predData.options, predData.createdBy, predData.deadline)
        pred.createdAt = predData.createdAt
        pred.updatedAt = predData.updatedAt
        pred.resolved = predData.resolved
        pred.resolution = predData.resolution
        pred.resolvedAt = predData.resolvedAt
        pred.resolvedBy = predData.resolvedBy
        pred.votes = predData.votes || []
        pred.totalStake = predData.totalStake || 0
        pred.optionStakes = predData.optionStakes || {}
        this.predictions.set(id, pred)
        await this.savePrediction(pred)
      }
    }
  }

  async handleCreate (message) {
    if (!message.prediction) return
    
    const predData = message.prediction
    const pred = new Prediction(predData.id, predData.question, predData.options, predData.createdBy, predData.deadline)
    pred.createdAt = predData.createdAt
    pred.updatedAt = predData.updatedAt
    pred.resolved = predData.resolved
    pred.resolution = predData.resolution
    pred.resolvedAt = predData.resolvedAt
    pred.resolvedBy = predData.resolvedBy
    pred.votes = predData.votes || []
    pred.totalStake = predData.totalStake || 0
    pred.optionStakes = predData.optionStakes || {}
    this.predictions.set(pred.id, pred)
    await this.savePrediction(pred)
    console.log(`📝 New prediction: "${pred.question}"`)
  }

  async handleVote (message) {
    if (!message.vote) return
    
    const pred = this.predictions.get(message.vote.predictionId)
    if (!pred) return

    pred.votes.push(message.vote)
    pred.optionStakes[message.vote.choice] = (pred.optionStakes[message.vote.choice] || 0) + message.vote.stake
    pred.totalStake = pred.votes.reduce((sum, v) => sum + v.stake, 0)
    pred.updatedAt = Date.now()
    
    await this.savePrediction(pred)
    console.log(`🗳️ Vote from ${message.vote.voterAddress.slice(0, 8)}...: ${message.vote.choice}`)
  }

  async handleResolve (message) {
    if (!message.resolution) return
    
    const pred = this.predictions.get(message.resolution.predictionId)
    if (!pred || pred.resolved) return

    pred.resolved = true
    pred.resolution = message.resolution.outcome
    pred.resolvedAt = message.resolution.timestamp
    pred.resolvedBy = message.resolution.resolvedBy
    pred.updatedAt = Date.now()
    
    await this.savePrediction(pred)
    console.log(`✅ Resolved: "${pred.question}" → ${message.resolution.outcome}`)
  }

  handleDeposit (message) {
    console.log(`💰 Deposit: ${message.amount} Trac from ${message.address?.slice(0, 8)}...`)
  }

  broadcast (message) {
    const data = JSON.stringify(message)
    for (const [peerId, peer] of this.peers) {
      try {
        peer.connection.write(data)
      } catch (err) {
        this.peers.delete(peerId)
      }
    }
  }

  // Wallet Operations
  getWalletInfo () {
    return this.wallet.getInfo()
  }

  getTransactions (limit, type) {
    return this.wallet.getTransactions(limit, type)
  }

  deposit (amount, txHash = null) {
    const tx = this.wallet.deposit(amount, txHash)
    
    this.broadcast({
      type: 'deposit',
      address: this.wallet.address,
      amount,
      txId: tx.id
    })

    return tx
  }

  withdraw (amount, toAddress) {
    return this.wallet.withdraw(amount, toAddress)
  }

  transfer (amount, toAddress) {
    return this.wallet.transfer(amount, toAddress)
  }

  connectWallet (address) {
    this.wallet.connectExternal(address)
    this.peerId = this.wallet.address
    console.log(`🔗 Connected external wallet: ${address}`)
    return this.wallet.getInfo()
  }

  // Prediction Operations
  async createPrediction (question, options = ['Yes', 'No'], deadline = null, initialStake = 0, initialChoice = null) {
    const id = 'pred-' + crypto.randomBytes(6).toString('hex')
    
    const prediction = new Prediction(id, question, options, this.peerId, deadline)

    if (initialStake > 0 && initialChoice) {
      if (initialStake > this.wallet.getAvailableBalance()) {
        throw new Error('Insufficient balance for initial stake')
      }
      
      this.wallet.deductBet(initialStake, id, initialChoice)
      prediction.addVote(this.peerId, initialChoice, initialStake)
    }

    this.predictions.set(id, prediction)
    await this.savePrediction(prediction)

    this.broadcast({ type: 'create', prediction: prediction.toJSON(), from: this.peerId })

    console.log(`\n✨ Created: "${question}"`)
    console.log(`   ID: ${id}`)
    if (initialStake > 0) {
      console.log(`   Your stake: ${initialStake} Trac on "${initialChoice}"`)
    }

    return prediction
  }

  async castVote (predictionId, choice, stake) {
    const pred = this.predictions.get(predictionId)
    if (!pred) {
      throw new Error('Prediction not found')
    }
    if (pred.resolved) {
      throw new Error('Prediction already resolved')
    }
    if (stake > this.wallet.getAvailableBalance()) {
      throw new Error('Insufficient balance')
    }

    const existingVote = pred.getVote(this.peerId)
    if (existingVote) {
      const stakeDiff = stake - existingVote.stake
      if (stakeDiff > this.wallet.getAvailableBalance()) {
        throw new Error('Insufficient balance to increase stake')
      }
      
      this.wallet.deductBet(stakeDiff, predictionId, choice)
      pred.addVote(this.peerId, choice, stake)
    } else {
      this.wallet.deductBet(stake, predictionId, choice)
      pred.addVote(this.peerId, choice, stake)
    }

    await this.savePrediction(pred)

    this.broadcast({
      type: 'vote',
      vote: {
        predictionId,
        voterAddress: this.peerId,
        choice,
        stake,
        timestamp: Date.now()
      },
      from: this.peerId
    })

    console.log(`\n🗳️ Voted: ${choice} with ${stake} Trac`)
    return pred
  }

  async resolvePrediction (predictionId, outcome) {
    const pred = this.predictions.get(predictionId)
    if (!pred) {
      throw new Error('Prediction not found')
    }
    if (pred.resolved) {
      throw new Error('Already resolved')
    }

    const results = pred.resolve(outcome, this.peerId)
    await this.savePrediction(pred)

    if (results.payouts[this.peerId]) {
      this.wallet.addWinnings(results.payouts[this.peerId], predictionId)
    }

    this.broadcast({
      type: 'resolve',
      resolution: {
        predictionId,
        outcome,
        timestamp: pred.resolvedAt,
        resolvedBy: this.peerId
      },
      results,
      from: this.peerId
    })

    console.log(`\n✅ Resolved: "${pred.question}"`)
    console.log(`   Outcome: ${outcome}`)
    console.log(`   Winners: ${results.winners.length}`)
    console.log(`   Total Payout: ${Object.values(results.payouts).reduce((a, b) => a + b, 0)} Trac`)

    return { prediction: pred, results }
  }

  claimWinnings (predictionId) {
    const pred = this.predictions.get(predictionId)
    if (!pred) {
      throw new Error('Prediction not found')
    }
    if (!pred.resolved) {
      throw new Error('Prediction not yet resolved')
    }

    const results = pred.calculateResults()
    const payout = results.payouts[this.peerId]

    if (!payout) {
      throw new Error('No winnings to claim')
    }

    const alreadyClaimed = this.wallet.transactions.some(
      tx => tx.type === 'winnings' && tx.predictionId === predictionId
    )
    if (alreadyClaimed) {
      throw new Error('Winnings already claimed')
    }

    this.wallet.addWinnings(payout, predictionId)
    
    console.log(`\n🎉 Claimed ${payout} Trac from "${pred.question}"`)
    return payout
  }

  listPredictions (filter = 'all') {
    let predictions = Array.from(this.predictions.values())
    
    if (filter === 'active') {
      predictions = predictions.filter(p => !p.resolved)
    } else if (filter === 'resolved') {
      predictions = predictions.filter(p => p.resolved)
    } else if (filter === 'voted') {
      predictions = predictions.filter(p => p.votes.some(v => v.voterAddress === this.peerId))
    }

    return predictions
  }

  getPrediction (predictionId) {
    const pred = this.predictions.get(predictionId)
    if (!pred) return null
    
    return {
      prediction: pred,
      stats: pred.getStats(),
      userVote: pred.getVote(this.peerId)
    }
  }

  showStatus () {
    return {
      peerId: this.peerId,
      connectedPeers: this.peers.size,
      totalPredictions: this.predictions.size,
      activePredictions: Array.from(this.predictions.values()).filter(p => !p.resolved).length,
      resolvedPredictions: Array.from(this.predictions.values()).filter(p => p.resolved).length,
      wallet: this.wallet.getInfo()
    }
  }

  // HTTP API Server
  async startServer (port = 3000) {
    const http = await import('http')
    
    this.server = http.createServer(async (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

      if (req.method === 'OPTIONS') {
        res.writeHead(200)
        res.end()
        return
      }

      const url = new URL(req.url, `http://${req.headers.host}`)

      try {
        if (url.pathname === '/' || url.pathname === '/index.html') {
          const htmlPath = path.join(__dirname, 'index.html')
          if (fs.existsSync(htmlPath)) {
            res.writeHead(200, { 'Content-Type': 'text/html' })
            fs.createReadStream(htmlPath).pipe(res)
            return
          }
        }

        // API Routes
        if (url.pathname === '/api/status') {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(this.showStatus()))
          return
        }

        if (url.pathname === '/api/wallet') {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(this.getWalletInfo()))
          return
        }

        if (url.pathname === '/api/wallet/transactions') {
          const limit = parseInt(url.searchParams.get('limit')) || 50
          const type = url.searchParams.get('type')
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(this.getTransactions(limit, type)))
          return
        }

        if (url.pathname === '/api/wallet/deposit' && req.method === 'POST') {
          const body = await readBody(req)
          const { amount, txHash } = JSON.parse(body)
          const tx = this.deposit(parseFloat(amount), txHash)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(tx))
          return
        }

        if (url.pathname === '/api/wallet/withdraw' && req.method === 'POST') {
          const body = await readBody(req)
          const { amount, toAddress } = JSON.parse(body)
          const tx = this.withdraw(parseFloat(amount), toAddress)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(tx))
          return
        }

        if (url.pathname === '/api/wallet/transfer' && req.method === 'POST') {
          const body = await readBody(req)
          const { amount, toAddress } = JSON.parse(body)
          const tx = this.transfer(parseFloat(amount), toAddress)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(tx))
          return
        }

        if (url.pathname === '/api/wallet/connect' && req.method === 'POST') {
          const body = await readBody(req)
          const { address } = JSON.parse(body)
          const info = this.connectWallet(address)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(info))
          return
        }

        if (url.pathname === '/api/wallet/validate' && req.method === 'POST') {
          const body = await readBody(req)
          const { address } = JSON.parse(body)
          const wallet = new Wallet()
          const valid = wallet._validateAddress(address)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ valid }))
          return
        }

        if (url.pathname === '/api/predictions') {
          const filter = url.searchParams.get('filter') || 'all'
          const predictions = this.listPredictions(filter)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(predictions.map(p => p.toJSON())))
          return
        }

        if (url.pathname.match(/^\/api\/prediction\/pred-/)) {
          const id = url.pathname.replace('/api/prediction/', '')
          const data = this.getPrediction(id)
          if (!data) {
            res.writeHead(404, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Not found' }))
            return
          }
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(data))
          return
        }

        if (url.pathname === '/api/prediction/create' && req.method === 'POST') {
          const body = await readBody(req)
          const { question, options, deadline, initialStake, initialChoice } = JSON.parse(body)
          const pred = await this.createPrediction(
            question,
            options || ['Yes', 'No'],
            deadline ? parseInt(deadline) : null,
            initialStake ? parseFloat(initialStake) : 0,
            initialChoice
          )
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(pred.toJSON()))
          return
        }

        if (url.pathname === '/api/prediction/vote' && req.method === 'POST') {
          const body = await readBody(req)
          const { predictionId, choice, stake } = JSON.parse(body)
          const pred = await this.castVote(predictionId, choice, parseFloat(stake))
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(pred.toJSON()))
          return
        }

        if (url.pathname === '/api/prediction/resolve' && req.method === 'POST') {
          const body = await readBody(req)
          const { predictionId, outcome } = JSON.parse(body)
          const result = await this.resolvePrediction(predictionId, outcome)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(result))
          return
        }

        if (url.pathname === '/api/prediction/claim' && req.method === 'POST') {
          const body = await readBody(req)
          const { predictionId } = JSON.parse(body)
          const payout = this.claimWinnings(predictionId)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ success: true, payout }))
          return
        }

        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Not found' }))

      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: err.message }))
      }
    })

    return new Promise((resolve) => {
      this.server.listen(port, () => {
        console.log(`\n🌐 Server running at http://localhost:${port}`)
        resolve()
      })
    })
  }

  // CLI Interface
  async startCLI () {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    console.log('\n' + '═'.repeat(60))
    console.log('   🔮 PeerPredict - Decentralized Prediction Market')
    console.log('   Trac Systems Intercom Competition Entry')
    console.log('═'.repeat(60))

    this.showCLIHelp()
    await this.commandLoop()
  }

  showCLIHelp () {
    console.log(`
📖 Commands:
   
   WALLET:
   balance              - Show wallet balance
   connect <address>    - Connect external Trac wallet
   deposit <amount>     - Deposit tokens
   withdraw <amt> <to>  - Withdraw tokens
   transfer <amt> <to>  - Transfer to another address
   history [type]       - Transaction history
   
   PREDICTIONS:
   create <question>    - Create prediction
   vote <id> <choice> <stake> - Vote on prediction
   resolve <id> <outcome> - Resolve prediction
   claim <id>           - Claim winnings
   list [filter]        - List predictions
   show <id>            - Prediction details
   
   NETWORK:
   status               - Network status
   help                 - Show this help
   exit                 - Exit application
`)
  }

  async commandLoop () {
    const ask = () => {
      this.rl.question('\n🔮 PeerPredict> ', async (input) => {
        const trimmed = input.trim()
        if (!trimmed) {
          ask()
          return
        }

        try {
          await this.executeCommand(trimmed)
        } catch (err) {
          console.log(`❌ Error: ${err.message}`)
        }

        if (this.isRunning) ask()
      })
    }

    ask()
  }

  async executeCommand (input) {
    const parts = input.split(' ')
    const cmd = parts[0].toLowerCase()
    const args = parts.slice(1)

    switch (cmd) {
      case 'balance':
        const info = this.getWalletInfo()
        console.log(`\n💰 Trac Wallet: ${info.address}`)
        console.log(`   Total: ${info.balance} Trac`)
        console.log(`   Available: ${info.availableBalance} Trac`)
        console.log(`   Locked: ${info.lockedBalance} Trac`)
        break

      case 'connect':
        if (!args[0]) {
          console.log('Usage: connect <trac-address>')
          return
        }
        this.connectWallet(args[0])
        console.log(`✅ Connected wallet: ${args[0]}`)
        break

      case 'deposit':
        if (!args[0]) {
          console.log('Usage: deposit <amount>')
          return
        }
        const depTx = this.deposit(parseFloat(args[0]))
        console.log(`\n✅ Deposited ${args[0]} Trac`)
        console.log(`   TX: ${depTx.id}`)
        break

      case 'withdraw':
        if (args.length < 2) {
          console.log('Usage: withdraw <amount> <trac-address>')
          return
        }
        const wdTx = this.withdraw(parseFloat(args[0]), args[1])
        console.log(`\n✅ Withdrawal pending`)
        console.log(`   TX: ${wdTx.id}`)
        break

      case 'transfer':
        if (args.length < 2) {
          console.log('Usage: transfer <amount> <trac-address>')
          return
        }
        const tfTx = this.transfer(parseFloat(args[0]), args[1])
        console.log(`\n✅ Transferred ${args[0]} Trac to ${args[1].slice(0, 8)}...`)
        break

      case 'history':
        const txs = this.getTransactions(20, args[0])
        console.log(`\n📜 Transactions:`)
        for (const tx of txs) {
          const sign = tx.amount >= 0 ? '+' : ''
          console.log(`   ${tx.type}: ${sign}${tx.amount} Trac - ${tx.description}`)
        }
        break

      case 'create':
        if (!args.length) {
          console.log('Usage: create <question>')
          return
        }
        await this.createPrediction(args.join(' '))
        break

      case 'vote':
        if (args.length < 3) {
          console.log('Usage: vote <id> <choice> <stake>')
          return
        }
        await this.castVote(args[0], args[1], parseFloat(args[2]))
        break

      case 'resolve':
        if (args.length < 2) {
          console.log('Usage: resolve <id> <outcome>')
          return
        }
        await this.resolvePrediction(args[0], args[1])
        break

      case 'claim':
        if (!args[0]) {
          console.log('Usage: claim <prediction-id>')
          return
        }
        this.claimWinnings(args[0])
        break

      case 'list':
        const preds = this.listPredictions(args[0] || 'all')
        console.log(`\n📊 Predictions (${args[0] || 'all'}):`)
        for (const p of preds) {
          const status = p.resolved ? `✅ ${p.resolution}` : '🔵 Active'
          console.log(`   ${p.id}: "${p.question.slice(0, 40)}..."`)
          console.log(`      ${status} | ${p.votes.length} votes | ${p.totalStake} Trac`)
        }
        break

      case 'show':
        if (!args[0]) {
          console.log('Usage: show <prediction-id>')
          return
        }
        const data = this.getPrediction(args[0])
        if (!data) {
          console.log('❌ Not found')
          return
        }
        console.log(`\n📋 ${data.prediction.question}`)
        console.log(`   ID: ${data.prediction.id}`)
        console.log(`   Status: ${data.prediction.resolved ? 'Resolved: ' + data.prediction.resolution : 'Active'}`)
        console.log(`   Total: ${data.stats.totalStake} Trac | ${data.stats.totalVotes} votes`)
        for (const [opt, stat] of Object.entries(data.stats.optionStats)) {
          console.log(`   ${opt}: ${stat.percentage}% (${stat.stake} Trac)`)
        }
        if (data.userVote) {
          console.log(`   Your vote: ${data.userVote.choice} (${data.userVote.stake} Trac)`)
        }
        break

      case 'status':
        const status = this.showStatus()
        console.log(`\n🌐 Network Status:`)
        console.log(`   Address: ${status.peerId}`)
        console.log(`   Peers: ${status.connectedPeers}`)
        console.log(`   Predictions: ${status.totalPredictions} (${status.activePredictions} active)`)
        console.log(`   Balance: ${status.wallet.balance} Trac`)
        break

      case 'help':
        this.showCLIHelp()
        break

      case 'exit':
      case 'quit':
        await this.shutdown()
        break

      default:
        console.log(`Unknown command: ${cmd}. Type 'help' for commands.`)
    }
  }

  async shutdown () {
    console.log('\n🔌 Shutting down...')
    this.isRunning = false
    if (this.rl) this.rl.close()
    if (this.server) this.server.close()
    if (this.swarm) await this.swarm.destroy()
    if (this.bee) await this.bee.close()
    if (this.corestore) await this.corestore.close()
    console.log('👋 Goodbye!')
    process.exit(0)
  }
}

// Helper Functions
function readBody (req) {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('end', () => resolve(body))
  })
}

// Main Entry
async function main () {
  const app = new PeerPredict()

  process.on('SIGINT', () => app.shutdown())
  process.on('SIGTERM', () => app.shutdown())

  try {
    await app.init()
    await app.startServer(process.env.PORT || 3000)

    if (process.stdin.isTTY) {
      await app.startCLI()
    }
  } catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  }
}

main()

export { PeerPredict, Wallet, Prediction }
