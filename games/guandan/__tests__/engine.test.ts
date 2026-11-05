import { expect, describe, it } from 'vitest'
import { makeDeck } from '../cards'
import { newSimpleRound, applyAction, clientView } from '../engine'
import type { GuandanRound } from '../engine'

const ids = ['alice','bob','carol','dave']
const make = () => newSimpleRound(ids, () => 0.5)

function withHands(hands: number[][]): GuandanRound {
  const s = make()
  const deck = makeDeck()
  s.players.forEach((p, i) => { p.hand = hands[i].map(j => deck[j]) })
  return s
}

describe('guandan: simple four-seat authoritative reducer', () => {
  it('initializes four unique 27-card hands', () => {
    const game = make()
    expect(game.players.map(p => p.hand.length)).toEqual([27,27,27,27])
    expect(new Set(game.players.flatMap(p => p.hand.map(c => c.id))).size).toBe(108)
  })
  it('rejects wrong turn, invalid IDs and duplicate cards without mutation', () => {
    const state = make()
    const original = JSON.stringify(state)
    expect(applyAction(state, ids[1], { type: 'pass' }).error).toBeTruthy()
    expect(applyAction(state, ids[0], { type: 'pass' }).error).toBeTruthy()
    expect(applyAction(state, ids[0], { type: 'play', cardIds: ['forged'] }).error).toBeTruthy()
    expect(applyAction(state, ids[0], { type: 'play', cardIds: [state.players[0].hand[0].id, state.players[0].hand[0].id] }).error).toBeTruthy()
    expect(JSON.stringify(state)).toBe(original)
  })
  it('plays and cycles turns; after three passes leader gets the lead', () => {
    let s = make()
    const id = s.players[0].hand[0].id
    s = applyAction(s, 'alice', { type:'play', cardIds:[id] }).state
    expect(s.currentTurn).toBe(1)
    for (const p of ['bob', 'carol', 'dave']) s = applyAction(s, p, { type:'pass' }).state
    expect(s.currentTurn).toBe(0)
    expect(s.lastPlay).toBeNull()
    expect(s.players[0].hand.some(c => c.id === id)).toBe(false)
  })
  it('partner receives lead after owner finishes and remaining players pass', () => {
    const deck = makeDeck()
    let s = withHands([[0],[1,2],[3,4],[5,6]])
    s = applyAction(s, 'alice', { type:'play', cardIds:[deck[0].id] }).state
    expect(s.finishOrder).toEqual([0])
    for (const p of ['bob','carol','dave']) s = applyAction(s, p, { type:'pass' }).state
    expect(s.currentTurn).toBe(2)
    expect(s.lastPlay).toBeNull()
  })
  it('same-team first and second finishers end round', () => {
    const deck = makeDeck()
    let s = withHands([[1],[2,3],[12],[4,5]])
    s = applyAction(s, 'alice', { type:'play', cardIds:[deck[1].id] }).state
    s = applyAction(s, 'bob', { type:'pass' }).state
    s = applyAction(s, 'carol', { type:'play', cardIds:[deck[12].id] }).state
    expect(s.phase).toBe('ended')
    expect(s.winner).toBe('alice')
    expect(s.finishOrder).toEqual([0,2])
  })
  it('hides opponents hands from client state', () => {
    const s = make()
    const mine = clientView(s,'alice')
    const otherId = s.players[1].hand[0].id
    expect(mine.myHand).toHaveLength(27)
    expect(mine.otherHandCounts).toEqual([null,27,27,27])
    expect(JSON.stringify(mine)).not.toContain(otherId)
    expect(() => clientView(s,'intruder')).toThrow()
  })
})
