import { logOut } from '@module/log';
import { pipe } from '@module/pipe';
import {
  Rules,
  RulesAndStateParsed,
  RulesAndStateParser,
  RulesState,
  RulesStateParsed,
  RulesParsed,
  RuleValue,
  RuleParsed,
  RuleConditionResult,
  RuleCondition,
} from '@type/rule';
import { rulesParse } from './rules-parse';
import { objectCreateFromPath, objectFlatten } from '@module/object';
import { isString } from '@module/is';

function checkCondition(
  { against, check, operator }: RuleCondition,
  state: RulesStateParsed,
): boolean {
  const againstValue = getConditionValue(against, state);
  const checkValue = getConditionValue(check, state);

  switch (operator) {
    case 'equals':
      if (checkValue === againstValue) return true;
      break;
    case 'greater':
      if (checkValue > againstValue) return true;
      break;
    case 'greater/equals':
      if (checkValue >= againstValue) return true;
      break;
    case 'less':
      if (checkValue < againstValue) return true;
      break;
    case 'less/equals':
      if (checkValue <= againstValue) return true;
      break;
    default:
      return false;
  }

  return false;
}

function executeEachRule({
  rules,
  state,
}: RulesAndStateParsed): RulesStateParsed {
  for (const key in rules) {
    // We can simply skip over rules that have already run.
    if (rules[key].hasRun === true) continue;

    executeRule(rules, key, state);
  }

  logOut('Log it', false)({ rules, state })

  return state;
}

function executeRule(rules: RulesParsed, key: string, state: RulesStateParsed) {
  // Check the dependencies first.
  if (rules[key].dependencies && rules[key].dependencies.length > 0) {
    for (let index = 0; index < rules[key].dependencies.length; index++) {
      executeRule(rules, rules[key].dependencies[index], state);
    }
  }

  if (rules[key].hasRun === true) return state;

  if (rules[key].default !== undefined) {
    state[key] = rules[key].default!;
  }

  for (const ruleKey in rules[key].rules) {
    const { fulfilled, result } = getRuleResult(
      rules[key].rules[ruleKey],
      state,
    );

    if (fulfilled === true) {
      state[key] = result;
      break;
    }
  }

  rules[key].hasRun = true;
}

function getConditionFulfillment(
  conditions: RuleCondition[] = [],
  state: RulesStateParsed,
): boolean {
  if (conditions.length < 1) return false

  let result = false;

  for (let index = 0; index < conditions.length; index++) {
    const conditionResult = checkCondition(conditions[index], state);

    if (conditionResult === true) {
      result = true;
      break;
    }
  }

  return result;
}

function getConditionValue(input: any, state: RulesStateParsed): RuleValue {
  if (isString(input) && (input as string).startsWith('{$.')) {
    return state[input];
  }

  return input;
}

function getRuleResult(
  ruleItem: RuleParsed,
  state: RulesStateParsed,
): RuleConditionResult {
  let fulfilled = getConditionFulfillment(ruleItem.conditions, state);

  return {
    fulfilled,
    result: ruleItem.result,
  };
}

export function rules(rules: Rules) {
  return {
    parse: () => rulesParse(rules),
    run: rulesRun(rules),
  };
}

function rulesAndStateParser({
  rules,
  state,
}: RulesAndStateParser): RulesAndStateParsed {
  return {
    rules: rulesParse(rules),
    state: objectFlatten(state),
  };
}

function rulesRun(rules: Rules) {
  return function (state: RulesState) {
    return pipe(
      rulesAndStateParser,
      executeEachRule,
      sanitiseKeys,
      objectCreateFromPath,
      logOut('Rules Result', false),
    )({ rules, state });
  };
}

function sanitiseKeys(state: RulesStateParsed): Record<string, any> {
  const newObject: Record<string, any> = {}

  for (const key in state) {
    newObject[key.substring(3, key.length - 1)] = state[key]
  }

  return newObject
}
