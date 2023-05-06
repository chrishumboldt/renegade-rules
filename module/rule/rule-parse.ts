import { objectClone } from '@module/object'
import type {
  RuleItem,
  RuleItemParsed,
  RuleOperator,
  RuleParseRuleItemRuleParams,
  RuleParsed,
  RuleValue,
  Rules,
  RulesParsed,
} from '@type/rule'

export const ruleParse = (ruleMap: Rules): RulesParsed => {
  const ruleReturn: RulesParsed = {}

  for (const key in ruleMap) {
    ruleReturn[key] = ruleParseRuleItem(ruleMap[key])
  }

  return ruleReturn
}

// Parse the "against" property value on the rule condition.
const ruleParseAgainst = (input: string): RuleValue => {
  if (input === 'true') {
    return true
  }

  if (input === 'false') {
    return false
  }

  const number = parseFloat(input)
  if (!Number.isNaN(number)) {
    return number
  }

  return input
}

export const ruleParseRuleItem = (ruleItem: RuleItem): RuleItemParsed => {
  const { rule, ...leftOvers } = ruleItem
  const ruleItemReturn = objectClone(leftOvers)

  ruleItemReturn.rule = {}

  for (const key in rule) {
    ruleItemReturn.rule[key] = ruleParseRuleItemRule({
      condition: key,
      ruleResult: rule[key],
    })
  }

  return ruleItemReturn
}

export const ruleParseRuleItemRule = ({
  condition,
  ruleResult,
}: RuleParseRuleItemRuleParams): RuleParsed => {
  const ruleReturn: RuleParsed = objectClone(ruleResult)

  ruleReturn.conditions = []

  condition
    .substring(3)
    .split('and')
    .filter(item => item.length > 2)
    .forEach(condition => {
      const [check, operator, ...against] = condition.trim().split(' ')

      ruleReturn.conditions!.push({
        against: ruleParseAgainst(against.join(' ')),
        check,
        operator: operator as RuleOperator,
      })
    })

  return ruleReturn
}

