export type RuleResult = {
  result: RuleValue
} 

export interface RuleCondition {
  against: RuleValue
  check: string
  operator: RuleOperator
}

export interface RuleItem {
  default?: RuleValue
  rule: Record<string, RuleResult>
}

export interface RuleItemParsed extends Omit<RuleItem, 'rule'> {
  rule: Record<string, RuleParsed>
}

export type RulesParsed = Record<string, RuleItemParsed>

export type RuleOperator =
  | 'equals'
  | 'greater'
  | 'greater/equals'
  | 'less'
  | 'less/equals'

export interface RuleParsed {
  conditions?: RuleCondition[]
  result: RuleValue
}

export interface RuleRunParams<T = Record<string, any>> {
  debug?: boolean
  rules: Rules
  state: T
}

export interface RuleRunPipe {
  debug?: boolean
  rulesParsed: RulesParsed
  stateFlat: Record<string, any>
}

export type Rules = Record<string, RuleItem>

export type RuleValue = boolean | number | string

