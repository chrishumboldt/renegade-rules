import { isNumber, isString } from '@module/is';
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

export function rulesParse(rules: Rules): RulesParsed {
  const rulesReturn: RulesParsed = {};

  for (const key in rules) {
    rulesReturn[key] = rulesParseRuleItem(rules[key], Object.keys(rules));
  }

  return rulesReturn;
}

function isStateVariable(input: any): boolean {
  return isString(input) && input.startsWith('{$.');
}

// Parse the "against" property value on the rule condition.
function parseAgainst(input: string): RuleValue {
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

export function rulesParseRuleItem(
  ruleItem: RuleItem,
  rootRulesKeys: string[] = [],
): RuleItemParsed {
  const { rules, ...leftOvers } = ruleItem;
  const ruleItemReturn = objectClone(leftOvers);
  const stateVariables: string[] = []

  ruleItemReturn.rules = {};

  for (const key in rules) {
    ruleItemReturn.rules[key] = rulesParseRuleItemRule(
      key,
      rules[key],
      stateVariables,
    );
  }

  const dependencies = stateVariables.filter(
    (item: string) => {
      return rootRulesKeys.includes(item);
    },
  );

  if (dependencies.length > 0) {
    ruleItemReturn.dependencies = dependencies;
  }

  return ruleItemReturn;
}

export function rulesParseRuleItemRule(
  condition: string,
  ruleResult: RuleResult,
  stateVariables: string[] = [],
): RuleParsed {
  const ruleReturn: RuleParsed = objectClone(ruleResult);

  ruleReturn.conditions = [];

  condition
    .substring(3)
    .split('and')
    .forEach(condition => {
      const [check, operator, ...against] = condition.trim().split(' ');
      const againstResult = parseAgainst(against.join(' '));

      ruleReturn.conditions!.push({
        against: againstResult,
        check,
        operator: operator as RuleOperator,
      });

      if (isStateVariable(check) && !stateVariables.includes(check)) {
        stateVariables.push(check);
      }
      if (
        isStateVariable(againstResult) &&
        !stateVariables.includes(againstResult)
      ) {
        stateVariables.push(againstResult);
      }
    });

  return ruleReturn;
}
