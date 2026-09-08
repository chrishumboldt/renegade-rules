import { isString } from './is'
import { objectClone } from './object'
import type {
  RuleItem,
  RuleItemParsed,
  RuleOperator,
  RuleParsed,
  RuleResult,
  RuleValue,
  Rules,
  RulesParsed,
} from '../type/rule'

export function rulesParse(rules: Rules): RulesParsed {
  const rulesReturn: RulesParsed = {}

  for (const key in rules) {
    rulesReturn[key] = rulesParseRuleItem(rules[key], Object.keys(rules))
  }

  return rulesReturn
}

function isStateVariable(input: any): boolean {
  return isString(input) && input.startsWith('{$.')
}

const KNOWN_OPERATORS: RuleOperator[] = [
  'endsWith',
  'equals',
  'excludes',
  'greater',
  'greater/equals',
  'includes',
  'less',
  'less/equals',
  'startsWith',
]

// Parse the "against" property value on the rule condition.
function parseAgainst(input: string): RuleValue {
  if (input === 'true') {
    return true
  }

  if (input === 'false') {
    return false
  }

  // Only coerce values that read as an ordinary decimal literal. Tokens
  // such as "007", "1e3" or "0x10" stay strings so identifiers and codes
  // are not silently turned into numbers.
  if (/^-?(0|[1-9]\d*)(\.\d+)?$/.test(input)) {
    return Number(input)
  }

  return input
}

export function rulesParseRuleItem(
  ruleItem: RuleItem,
  rootRulesKeys: string[] = [],
): RuleItemParsed {
  const { rules, ...leftOvers } = ruleItem
  const ruleItemReturn: RuleItemParsed = {
    ...objectClone(leftOvers),
    rules: {},
  }
  const stateVariables: string[] = []

  for (const key in rules) {
    ruleItemReturn.rules[key] = rulesParseRuleItemRule(
      key,
      rules[key],
      stateVariables,
    )
  }

  const dependencies = stateVariables.filter((item: string) => {
    return rootRulesKeys.includes(item)
  })

  if (dependencies.length > 0) {
    ruleItemReturn.dependencies = dependencies
  }

  return ruleItemReturn
}

export function rulesParseRuleItemRule(
  condition: string,
  ruleResult: RuleResult,
  stateVariables: string[] = [],
): RuleParsed {
  if (!condition.startsWith('if ')) {
    throw new Error(
      `A rule condition must start with "if ". Received: "${condition}".`,
    )
  }

  const ruleReturn: RuleParsed = objectClone(ruleResult)

  ruleReturn.conditions = []

  condition
    .substring(3)
    .split(' and ')
    .forEach(part => {
      const [check, operator, ...against] = part.trim().split(' ')

      if (!KNOWN_OPERATORS.includes(operator as RuleOperator)) {
        throw new Error(
          `Unknown rule operator "${operator}" in condition "${condition}". ` +
            `Expected one of: ${KNOWN_OPERATORS.join(', ')}.`,
        )
      }

      const againstResult = parseAgainst(against.join(' '))

      ruleReturn.conditions!.push({
        against: againstResult,
        check,
        operator: operator as RuleOperator,
      })

      if (isStateVariable(check) && !stateVariables.includes(check)) {
        stateVariables.push(check)
      }
      if (
        isStateVariable(againstResult) &&
        !stateVariables.includes(againstResult)
      ) {
        stateVariables.push(againstResult)
      }
    })

  return ruleReturn
}
