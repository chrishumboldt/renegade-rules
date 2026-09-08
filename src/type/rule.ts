export interface CheckForDependencyLoopInput {
  dependencies: string[];
  history: DependencyHistory;
  ruleString: string;
}

export interface CheckForDependencyLoopOutput {
  errors?: string[];
  hasError: boolean;
}

type DependencyHistory = Record<string, boolean>

export interface ExecuteRuleInput {
  dependencyHistory?: DependencyHistory;
  errors: string[];
  hasRun: RuleHasRun;
  key: string;
  rules: RulesParsed;
  state: RulesStateParsed;
}

export type RuleHasRun = Record<string, boolean>

export type RuleResult = {
  result: RuleValue;
};

export interface RuleCondition {
  against: RuleValue;
  check: string;
  operator: RuleOperator;
}

export interface RuleConditionResult {
  fulfilled: boolean;
  result: RuleValue;
}

export interface RuleItem {
  default?: RuleValue;
  hasRun?: boolean;
  rules: Record<string, RuleResult>;
}

export interface RuleItemParsed extends Omit<RuleItem, 'rules'> {
  dependencies?: string[];
  rules: Record<string, RuleParsed>;
}

export type RuleOperator =
  | 'endsWith'
  | 'equals'
  | 'excludes'
  | 'greater'
  | 'greater/equals'
  | 'includes'
  | 'less'
  | 'less/equals'
  | 'startsWith';

export interface RuleParsed {
  conditions?: RuleCondition[];
  result: RuleValue;
}

export interface RuleRunPipe {
  rulesParsed: RulesParsed;
  stateFlat: Record<string, any>;
}

export type Rules = Record<string, RuleItem>;

export type RulesParsed = Record<string, RuleItemParsed>;

export interface RulesOutput<T = unknown> {
  errors?: string[];
  result: Record<string, T>;
  rulesRun: string[]
}

export interface RulesAndStateParsed {
  rules: RulesParsed;
  state: RulesStateParsed;
}

export type RulesState = Record<string, any>;

export type RulesStateParsed = Record<string, RuleValue>;

export type RuleValue = any

export interface StateParser {
  rules: RulesParsed;
  state: RulesState;
}

