import type { GameClientPlugin } from '@tongzhuo/core-shared'
import { GuandanGame } from './GuandanGame'

export const guandanSimpleClientPlugin: GameClientPlugin = {
  id: 'guandan-simple',
  name: '简化掼蛋',
  description: '四人两队、108张牌、单副对战',
  minPlayers: 4,
  maxPlayers: 4,
  deckConfig: {
    suits: ['spades', 'hearts', 'diamonds', 'clubs'],
    ranks: ['2','3','4','5','6','7','8','9','10','J','Q','K','A'],
    jokers: 2,
  },
  GameComponent: GuandanGame,
}
