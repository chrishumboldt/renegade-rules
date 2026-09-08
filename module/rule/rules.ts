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
  RuleHasRun,
  RuleParsed,
  RuleValue,
  Rules,
  RulesAndStateParsed,
  RulesOutput,
  RulesParsed,
  RulesState,
  RulesStateParsed,
  StateParser,
} from '@type/rule';
import { rulesParse } from './rules-parse';

export function checkCondition(
  { against, check, operator }: RuleCondition,
  state: RulesStateParsed,
): boolean {
  const againstValue = getConditionValue(against, state);
  const checkValue = getConditionValue(check, state);

  switch (operator) {
    case 'endsWith':
      return isString(checkValue) && checkValue.endsWith(againstValue);
    case 'equals':
      return checkValue === againstValue;
    case 'excludes':
      return !checkValue.includes(againstValue);
    case 'greater':
      return checkValue > againstValue;
    case 'greater/equals':
      return checkValue >= againstValue;
    case 'includes':
      return checkValue.includes(againstValue);
    case 'less':
      return checkValue < againstValue;
    case 'less/equals':
      return checkValue <= againstValue;
    case 'startsWith':
      return isString(checkValue) && checkValue.startsWith(againstValue);
    default:
      return false;
  }
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

function executeAllRules({ rules, state }: RulesAndStateParsed): RulesOutput {
  const errors: string[] = [];
  const hasRun: RuleHasRun = {};

  for (const key in rules) {
    if (hasRun[key] === true) continue;

    executeRule({ errors, hasRun, key, rules, state });
    if (errors.length > 0) break;
  }

  if (errors.length > 0) {
    return { errors, result: state, rulesRun: Object.keys(hasRun) };
  }

  return { result: state, rulesRun: Object.keys(hasRun) };
}

function executeRule({
  dependencyHistory = {},
  errors,
  hasRun,
  key,
  rules,
  state,
}: ExecuteRuleInput) {
  if (!key.startsWith('{$.') || hasRun[key] === true) return;

  const { dependencies } = rules[key];

  if (dependencies && dependencies.length > 0) {
    const check = checkForDependencyLoop({
      dependencies,
      history: dependencyHistory,
      ruleString: key,
    });

    if (check.hasError) {
      check.errors?.forEach(item => errors.push(item));
      return;
    }

    dependencyHistory[key] = true;

    for (let index = 0; index < dependencies.length; index++) {
      executeRule({
        dependencyHistory: { ...dependencyHistory },
        errors,
        hasRun,
        key: dependencies[index],
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

  hasRun[key] = true;
}

function getConditionFulfillment(
  conditions: RuleCondition[] = [],
  state: RulesStateParsed,
): boolean {
  if (conditions.length < 1) return false;

  for (let index = 0; index < conditions.length; index++) {
    if (checkCondition(conditions[index], state) === false) return false;
  }

  return true;
}

function getConditionValue(input: any, state: RulesStateParsed): RuleValue {
  if (isString(input) && input.startsWith('{$.')) {
    return state[input];
  }

  return input;
}

function getRuleResult(
  ruleItem: RuleParsed,
  state: RulesStateParsed,
): RuleConditionResult {
  return {
    fulfilled: getConditionFulfillment(ruleItem.conditions, state),
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
  const rulesParsed = rulesParse(rules);

  return {
    parse: rulesParsed,
    run: rulesRun(rulesParsed),
  };
}

function rulesRun(rules: RulesParsed) {
  return function (state: RulesState, debug = false): RulesOutput {
    if (debug === true) {
      logOut('Rules Debug: Parsed Rules', false)(rules);
    }

    return pipe(
      stateParser,
      executeAllRules,
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

function stateParser(input: StateParser): RulesAndStateParsed {
  input.state = objectFlatten(input.state);

  return input;
}

function transformFlatResults(input: RulesOutput): RulesOutput {
  input.result = objectCreateFromPath(input.result);

  return input;
}
