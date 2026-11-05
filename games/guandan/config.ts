import type { Rank, RuleConfig } from './types'
export const classicConfig = (level: Rank = 2): RuleConfig => ({ mode: 'classic', level, wildcards: true, tribute: true, progression: true })
export const simpleConfig = (): RuleConfig => ({ mode: 'simple', level: 2, wildcards: false, tribute: false, progression: false })
