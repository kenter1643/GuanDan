import { describe, expect, it } from 'vitest'
import { newSimpleRound, applyAction, clientView } from '../engine'
import { canBeat, classifyPlain } from '../rules'

const players = ['north', 'east', 'south', 'west']

/**
 * End-to-end *engine* simulation: 4 independent player identities, one
 * authoritative state. Not a Socket.IO or browser E2E substitute.
 */
describe('simple Guandan complete round simulation', () => {
  it('plays complete deterministic rounds without deadlock or card duplication', () => {
    for (const randomValue of [0.01, 0.23, 0.51, 0.83]) {
      let state = newSimpleRound(players, () => randomValue)
      const initialIds = new Set(state.players.flatMap(p => p.hand.map(c => c.id)))
      let played = 0
      let actions = 0
      while (state.phase === 'playing' && actions < 1500) {
        const seat = state.currentTurn
        const hand = state.players[seat].hand
        const candidate = hand.find(card => {
          const pattern = classifyPlain([card], state.config)
          return pattern && canBeat(pattern, state.lastPlay?.pattern ?? null)
        })
        const action = candidate
          ? { type: 'play' as const, cardIds: [candidate.id] }
          : { type: 'pass' as const }
        const original = state
        const result = applyAction(state, players[seat], action)
        expect(result.error).toBeUndefined()
        state = result.state
        expect(state.version).toBe(original.version + 1)
        if (candidate) played++
        const hands = state.players.flatMap(p => p.hand.map(c => c.id))
        expect(hands.length).toBe(108 - played)
        expect(new Set(hands).size).toBe(hands.length)
        expect(hands.every(id => initialIds.has(id))).toBe(true)
        for (const playerId of players) {
          const view = clientView(state, playerId)
          const otherHands = state.players.filter(p => p.id !== playerId).flatMap(p => p.hand)
          expect(otherHands.every(c => !view.myHand.some(own => own.id === c.id))).toBe(true)
        }
        actions++
      }
      expect(state.phase).toBe('ended')
      expect(actions).toBeLessThan(1500)
      expect(state.finishOrder.length).toBeGreaterThanOrEqual(2)
      expect(players).toContain(state.winner)
      expect(applyAction(state, players[0], { type: 'pass' }).error).toBeTruthy()
    }
  })
})
