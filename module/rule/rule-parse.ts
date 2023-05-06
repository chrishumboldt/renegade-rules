import { isNumber } from '@module/is';
import { objectClone } from '@module/object';
import type {
  RuleItem,
  RuleItemParsed,
  RuleOperator,
  RuleParsed,
  RuleResult,
  RuleValue,
  Rules,
  RulesParsed,
} from '@type/rule';

export function ruleParse(ruleMap: Rules): RulesParsed {
  const ruleReturn: RulesParsed = {};

  for (const key in ruleMap) {
    ruleReturn[key] = ruleParseRuleItem(ruleMap[key]);
  }

  return ruleReturn;
}

// Parse the "against" property value on the rule condition.
function ruleParseAgainst(input: string): RuleValue {
  if (input === 'true') {
    return true;
  }

  if (input === 'false') {
    return false;
  }

  const number = parseFloat(input);
  if (isNumber(number)) {
    return number;
  }

  return input;
}

export function ruleParseRuleItem(ruleItem: RuleItem): RuleItemParsed {
  const { rule, ...leftOvers } = ruleItem;
  const ruleItemReturn = objectClone(leftOvers);

  ruleItemReturn.rule = {};

  for (const key in rule) {
    ruleItemReturn.rule[key] = ruleParseRuleItemRule(key, rule[key]);
  }

  return ruleItemReturn;
}

export function ruleParseRuleItemRule(
  condition: string,
  ruleResult: RuleResult,
): RuleParsed {
  const ruleReturn: RuleParsed = objectClone(ruleResult);

  ruleReturn.conditions = [];

  condition
    .substring(3)
    .split('and')
    .filter(item => item.length > 2)
    .forEach(condition => {
      const [check, operator, ...against] = condition.trim().split(' ');

      ruleReturn.conditions!.push({
        against: ruleParseAgainst(against.join(' ')),
        check,
        operator: operator as RuleOperator,
      });
    });

  return ruleReturn;
}
