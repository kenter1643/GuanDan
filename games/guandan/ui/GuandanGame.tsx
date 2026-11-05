import { useEffect, useMemo, useState } from 'react'
import type { GameComponentProps } from '@tongzhuo/core-shared'
import type { Card } from '../types'
import './styles.css'

type TableState = {
  myPlayerIndex: number
  playerIds: string[]
  myHand: Card[]
  otherHandCounts: (number | null)[]
  mode: 'simple' | 'classic'
  phase: 'playing' | 'ended'
  currentTurn: number
  lastPlay: { seat: number; cards: Card[]; pattern: { name: string } } | null
  finishOrder: number[]
  winner: string | null
  version: number
}

const FACE: Record<number, string> = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' }
const SUITS: Record<string, string> = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' }
const PATTERNS: Record<string, string> = {
  single: '单张', pair: '对子', triple: '三张', triple_pair: '三带对',
  straight: '顺子', three_pairs: '三连对', two_triples: '钢板',
  bomb: '炸弹', straight_flush: '同花顺', four_jokers: '四大天王',
}
const face = (card: Card) => card.suit === 'joker'
  ? (card.joker === 'big' ? '大王' : '小王')
  : (FACE[card.rank] ?? String(card.rank))
const suit = (card: Card) => card.suit === 'joker' ? '★' : SUITS[card.suit]
const red = (card: Card) => card.suit === 'hearts' || card.suit === 'diamonds' || (card.suit === 'joker' && card.joker === 'big')

function sortHand(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => {
    const value = (c: Card) => c.suit === 'joker'
      ? (c.joker === 'big' ? 17 : 16) : c.rank
    return value(b) - value(a) || a.id.localeCompare(b.id)
  })
}

export function GuandanGame({ state, onAction, playerNames = {} }: GameComponentProps) {
  const s = state as TableState
  const [selected, setSelected] = useState<string[]>([])
  // Filter selections on every authoritative server state update.
  useEffect(() => {
    const valid = new Set(s.myHand.map(c => c.id))
    setSelected(prev => prev.filter(id => valid.has(id)))
  }, [s.version, s.myHand])
  const cards = useMemo(() => sortHand(s.myHand), [s.myHand])
  const mine = s.myPlayerIndex
  const person = (delta: number) => (mine + delta) % 4
  const name = (seat: number) => playerNames[s.playerIds[seat]] || `玩家${seat + 1}`
  const turn = s.phase === 'playing' && s.currentTurn === mine
  const canPass = turn && !!s.lastPlay
  const selectCard = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const submit = () => {
    if (!turn || selected.length === 0) return
    onAction('play', { cardIds: selected })
    setSelected([])
  }
  const skip = () => {
    if (!canPass) return
    onAction('pass', {})
    setSelected([])
  }
  const player = (seat: number, location: string) => (
    <div className={`gd-player gd-player--${location} ${s.currentTurn === seat && s.phase === 'playing' ? 'gd-player--turn' : ''}`}>
      <strong>{name(seat)} {seat % 2 === mine % 2 ? '· 队友' : ''}</strong>
      <span>{s.otherHandCounts[seat] ?? s.myHand.length} 张</span>
      {s.finishOrder.includes(seat) && <span>第 {s.finishOrder.indexOf(seat) + 1} 游</span>}
    </div>
  )
  return (
    <section className="gd-root" aria-label="四人掼蛋牌桌">
      <header className="gd-header">
        <strong>掼蛋 · {s.mode === 'simple' ? '简化模式' : '经典模式'}</strong>
        <span>两副牌 · 对家组队 · 2v2</span>
      </header>
      <div className="gd-table">
        {player(person(2), 'top')}
        {player(person(1), 'right')}
        {player(person(3), 'left')}
        <div className="gd-center" aria-live="polite">
          {s.lastPlay ? (
            <>
              <span className="gd-center-label">{name(s.lastPlay.seat)} · {PATTERNS[s.lastPlay.pattern.name] ?? s.lastPlay.pattern.name}</span>
              <div className="gd-trick">
                {s.lastPlay.cards.map(card => <span key={card.id} className={`gd-mini-card ${red(card) ? 'gd-red' : ''}`}>{face(card)}{suit(card)}</span>)}
              </div>
            </>
          ) : <span className="gd-center-label">新一轮 · 自由出牌</span>}
          {s.phase === 'playing' && <div className="gd-turn-label">{turn ? '轮到你出牌' : `等待 ${name(s.currentTurn)} 出牌`}</div>}
        </div>
        {player(mine, 'self')}
      </div>
      <div className="gd-bottom">
        <div className="gd-controls">
          <button type="button" onClick={() => setSelected([])} disabled={!selected.length}>取消选牌</button>
          <button type="button" onClick={skip} disabled={!canPass}>不出</button>
          <button type="button" className="gd-primary" onClick={submit} disabled={!turn || !selected.length}>出牌 {selected.length > 0 ? `(${selected.length})` : ''}</button>
        </div>
        <div className="gd-hand" aria-label="我的手牌">
          {cards.map(card => (
            <button
              type="button"
              key={card.id}
              className={`gd-card ${red(card) ? 'gd-red' : ''} ${selected.includes(card.id) ? 'gd-card--selected' : ''}`}
              aria-pressed={selected.includes(card.id)}
              aria-label={`${face(card)} ${suit(card)}`}
              onClick={() => selectCard(card.id)}
            >
              <span>{face(card)}</span><span>{suit(card)}</span>
            </button>
          ))}
        </div>
      </div>
      {s.phase === 'ended' && <div className="gd-finished">本副牌已结束</div>}
    </section>
  )
}
