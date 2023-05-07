import { isString } from '@module/is';
import { logOut } from '@module/log';
import { objectCreateFromPath, objectFlatten } from '@module/object';
import { pipe } from '@module/pipe';
import {
  CheckForDependencyLoopInput,
  CheckForDependencyLoopOutput,
  ExecuteRuleInput,
  RuleCondition,
  RuleConditionResult,
  RuleParsed,
  RuleValue,
  Rules,
  RulesAndStateParsed,
  RulesAndStateParser,
  RulesOutput,
  RulesState,
  RulesStateParsed,
} from '@type/rule';
import { rulesParse } from './rules-parse';

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

function checkForDependencyLoop({
  dependencies,
  history,
  ruleString,
}: CheckForDependencyLoopInput): CheckForDependencyLoopOutput {
  for (let index = 0; index < dependencies.length; index++) {
    if (history[dependencies[index]]) {
      return {
        hasError: true,
        errors: [
          `There is a circular dependency with ${ruleString}->${Object.keys(
            history,
          ).join('->')}->${ruleString}.`,
        ],
      };
    }
  }

  return {
    hasError: false,
  };
}

function executeEachRule({ rules, state }: RulesAndStateParsed): RulesOutput {
  const errors: string[] = [];

  for (const key in rules) {
    // We can simply skip over rules that have already run.
    if (rules[key].hasRun === true) continue;

    executeRule({ errors, key, rules, state });
    if (errors.length > 0) break;
  }

  if (errors.length > 0) {
    return { errors, result: state };
  }

  return { result: state };
}

function executeRule({
  dependencyHistory = {},
  errors,
  key,
  rules,
  state,
}: ExecuteRuleInput) {
  if (!key.startsWith('{$.') || rules[key].hasRun === true) return;

  // Check the dependencies first.
  if (rules[key].dependencies && rules[key].dependencies.length > 0) {
    const check = checkForDependencyLoop({
      dependencies: rules[key].dependencies,
      history: dependencyHistory,
      ruleString: key,
    });

    if (check.hasError) {
      check.errors?.forEach(item => errors.push(item));
      return;
    }

    dependencyHistory[key] = true;

    for (let index = 0; index < rules[key].dependencies.length; index++) {
      executeRule({
        dependencyHistory,
        errors,
        key: rules[key].dependencies[index],
        rules,
        state,
      });
    }
  }

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
  if (conditions.length < 1) return false;

  for (let index = 0; index < conditions.length; index++) {
    const conditionResult = checkCondition(conditions[index], state);

    if (conditionResult === false) {
      return false;
    }
  }

  return true;
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

function logOutResult(debug: boolean) {
  return function (input: RulesOutput): RulesOutput {
    if (debug === true) {
      logOut('Rules Debug: Result', false)(input);
    }

    return input;
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
  return function (state: RulesState, debug = false): RulesOutput {
    return pipe(
      rulesAndStateParser,
      executeEachRule,
      sanitiseKeys,
      transformFlatResults,
      logOutResult(debug),
    )({ rules, state });
  };
}

function sanitiseKeys(input: RulesOutput): RulesOutput {
  for (const key in input.result) {
    if (!key.startsWith('{$.')) continue;

    input.result[key.substring(3, key.length - 1)] = input.result[key];
    delete input.result[key];
  }

  return input;
}

function transformFlatResults(input: RulesOutput): RulesOutput {
  input.result = objectCreateFromPath(input.result);

  return input;
}
