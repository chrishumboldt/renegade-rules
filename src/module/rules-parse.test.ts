import assert from 'node:assert/strict';
import { test } from 'node:test';
import { RuleItem, Rules } from '../type/rule';
import { rules as rulesFacade } from './rules';
import {
  rulesParse,
  rulesParseRuleItem,
  rulesParseRuleItemRule,
} from './rules-parse';

let condition = 'if {$.user.age} greater/equals 30';
let rules: Rules = {
  '{$.user.lightsaberColour}': {
    default: 'blue',
    rules: {
      'if {$.user.age} greater 30': { result: 'red' },
    },
  },
};
let ruleItem: RuleItem = {
  default: 'Anakin Skywalker',
  rules: {
    'if {$.user.age} greater/equals 30': { result: 'Darth Vader' },
  },
};
let ruleResult: any = {
  result: 'Darth Vader',
};

test('Test that a single rule condition can be parsed.', () => {
  const parsed = rulesParseRuleItemRule(condition, ruleResult);
  const result = {
    conditions: [
      {
        against: 30,
        check: '{$.user.age}',
        operator: 'greater/equals',
      },
    ],
    result: 'Darth Vader',
  };

  assert.deepStrictEqual(parsed, result);
});

test('Test that a single rule condition can be parsed with two JPaths pointers.', () => {
  condition = 'if {$.user.age} greater/equals {$.user.something}';

  const parsed = rulesParseRuleItemRule(condition, ruleResult);
  const result = {
    conditions: [
      {
        against: '{$.user.something}',
        check: '{$.user.age}',
        operator: 'greater/equals',
      },
    ],
    result: 'Darth Vader',
  };

  assert.deepStrictEqual(parsed, result);
});

test('Test that a single rule with 2 conditions can be parsed.', () => {
  condition = 'if {$.user.age} greater/equals 30 and {$.user.age} less 40';

  const parsed = rulesParseRuleItemRule(condition, ruleResult);
  const result = {
    conditions: [
      {
        against: 30,
        check: '{$.user.age}',
        operator: 'greater/equals',
      },
      {
        against: 40,
        check: '{$.user.age}',
        operator: 'less',
      },
    ],
    result: 'Darth Vader',
  };

  assert.deepStrictEqual(parsed, result);
});

test('Test that a single rule with 3 conditions can be parsed.', () => {
  condition =
    'if {$.user.age} greater/equals 30 and {$.user.age} less 40 and {$.user.name} equals Darth Vader';

  const parsed = rulesParseRuleItemRule(condition, ruleResult);
  const result = {
    conditions: [
      {
        against: 30,
        check: '{$.user.age}',
        operator: 'greater/equals',
      },
      {
        against: 40,
        check: '{$.user.age}',
        operator: 'less',
      },
      {
        against: 'Darth Vader',
        check: '{$.user.name}',
        operator: 'equals',
      },
    ],
    result: 'Darth Vader',
  };

  assert.deepStrictEqual(parsed, result);
});

test('Test that a rule item with a single condition can be parsed.', () => {
  const parsed = rulesParseRuleItem(ruleItem);
  const result = {
    rules: {
      'if {$.user.age} greater/equals 30': {
        conditions: [
          {
            against: 30,
            check: '{$.user.age}',
            operator: 'greater/equals',
          },
        ],
        result: 'Darth Vader',
      },
    },
    default: 'Anakin Skywalker',
  };

  assert.deepStrictEqual(parsed, result);
});

test('Test that a rule item with 2 conditions can be parsed.', () => {
  ruleItem = {
    default: 'Anakin Skywalker',
    rules: {
      'if {$.user.age} greater/equals 30': { result: 'Darth Vader' },
      'if {$.user.age} less 10': { result: 'Young Ani' },
    },
  };

  const parsed = rulesParseRuleItem(ruleItem);
  const result = {
    rules: {
      'if {$.user.age} greater/equals 30': {
        conditions: [
          {
            against: 30,
            check: '{$.user.age}',
            operator: 'greater/equals',
          },
        ],
        result: 'Darth Vader',
      },
      'if {$.user.age} less 10': {
        conditions: [
          {
            against: 10,
            check: '{$.user.age}',
            operator: 'less',
          },
        ],
        result: 'Young Ani',
      },
    },
    default: 'Anakin Skywalker',
  };

  assert.deepStrictEqual(parsed, result);
});

test('Test that a rule item with 2 conditions (including an "and" phrase) can be parsed.', () => {
  ruleItem = {
    default: 'Anakin Skywalker',
    rules: {
      'if {$.user.age} greater/equals 30 and {$.user.age} less {$.user.ageLimit}':
        {
          result: 'Darth Vader',
        },
      'if {$.user.age} less 10': {
        result: 'Young Ani',
      },
    },
  };

  const parsed = rulesParseRuleItem(ruleItem);
  const result = {
    rules: {
      'if {$.user.age} greater/equals 30 and {$.user.age} less {$.user.ageLimit}':
        {
          conditions: [
            {
              against: 30,
              check: '{$.user.age}',
              operator: 'greater/equals',
            },
            {
              against: '{$.user.ageLimit}',
              check: '{$.user.age}',
              operator: 'less',
            },
          ],
          result: 'Darth Vader',
        },
      'if {$.user.age} less 10': {
        conditions: [
          {
            against: 10,
            check: '{$.user.age}',
            operator: 'less',
          },
        ],
        result: 'Young Ani',
      },
    },
    default: 'Anakin Skywalker',
  };

  assert.deepStrictEqual(parsed, result);
});

test('Test that a rule item with 3 conditions can be parsed.', () => {
  ruleItem = {
    default: 'Anakin Skywalker',
    rules: {
      'if {$.user.age} greater/equals 30': { result: 'Darth Vader' },
      'if {$.user.age} less 10': { result: 'Young Ani' },
      'if {$.user.age} greater 40': { result: 'Old Anakin' },
    },
  };

  const parsed = rulesParseRuleItem(ruleItem);
  const result = {
    rules: {
      'if {$.user.age} greater/equals 30': {
        conditions: [
          {
            against: 30,
            check: '{$.user.age}',
            operator: 'greater/equals',
          },
        ],
        result: 'Darth Vader',
      },
      'if {$.user.age} less 10': {
        conditions: [
          {
            against: 10,
            check: '{$.user.age}',
            operator: 'less',
          },
        ],
        result: 'Young Ani',
      },
      'if {$.user.age} greater 40': {
        conditions: [
          {
            against: 40,
            check: '{$.user.age}',
            operator: 'greater',
          },
        ],
        result: 'Old Anakin',
      },
    },
    default: 'Anakin Skywalker',
  };

  assert.deepStrictEqual(parsed, result);
});

test('Test that a basic rule object can be parsed.', () => {
  const parsed = rulesParse(rules);
  const result = {
    '{$.user.lightsaberColour}': {
      default: 'blue',
      rules: {
        'if {$.user.age} greater 30': {
          conditions: [
            {
              against: 30,
              check: '{$.user.age}',
              operator: 'greater',
            },
          ],
          result: 'red',
        },
      },
    },
  };

  assert.deepStrictEqual(parsed, result);
});

test('Test that a multi rule object can be parsed.', () => {
  rules = {
    '{$.user.name}': {
      default: 'Anakin Skywalker',
      rules: {
        'if {$.user.age} greater/equals 30': { result: 'Darth Vader' },
        'if {$.user.age} less 10': { result: 'Young Ani' },
        'if {$.user.age} greater 40': { result: 'Old Anakin' },
      },
    },
    '{$.user.lightsaberColour}': {
      default: 'blue',
      rules: {
        'if {$.user.age} greater 30': { result: 'red' },
      },
    },
  };

  const parsed = rulesParse(rules);
  const result = {
    '{$.user.name}': {
      default: 'Anakin Skywalker',
      rules: {
        'if {$.user.age} greater/equals 30': {
          conditions: [
            {
              against: 30,
              check: '{$.user.age}',
              operator: 'greater/equals',
            },
          ],
          result: 'Darth Vader',
        },
        'if {$.user.age} less 10': {
          conditions: [
            {
              against: 10,
              check: '{$.user.age}',
              operator: 'less',
            },
          ],
          result: 'Young Ani',
        },
        'if {$.user.age} greater 40': {
          conditions: [
            {
              against: 40,
              check: '{$.user.age}',
              operator: 'greater',
            },
          ],
          result: 'Old Anakin',
        },
      },
    },
    '{$.user.lightsaberColour}': {
      default: 'blue',
      rules: {
        'if {$.user.age} greater 30': {
          conditions: [
            {
              against: 30,
              check: '{$.user.age}',
              operator: 'greater',
            },
          ],
          result: 'red',
        },
      },
    },
  };

  assert.deepStrictEqual(parsed, result);
});

test('That the rules have the correct dependencies.', () => {
  rules = {
    '{$.age}': {
      default: 9,
      rules: {
        'if {$.isOlder} equals true': {
          result: 35,
        },
      },
    },
    '{$.lightsaberColour}': {
      default: 'blue',
      rules: {
        'if {$.age} greater 30': {
          result: 'red',
        },
      },
    },
  };

  const parsed = rulesParse(rules);
  const result = {
    '{$.age}': {
      default: 9,
      rules: {
        'if {$.isOlder} equals true': {
          conditions: [
            {
              against: true,
              check: '{$.isOlder}',
              operator: 'equals',
            },
          ],
          result: 35,
        },
      },
    },
    '{$.lightsaberColour}': {
      default: 'blue',
      dependencies: ['{$.age}'],
      rules: {
        'if {$.age} greater 30': {
          conditions: [
            {
              against: 30,
              check: '{$.age}',
              operator: 'greater',
            },
          ],
          result: 'red',
        },
      },
    },
  };

  assert.deepStrictEqual(parsed, result);
});

test('Test that a numeric looking token keeps its string form when it is not a plain number.', () => {
  const parsed = rulesParseRuleItemRule('if {$.code} equals 007', {
    result: 'match',
  });

  assert.strictEqual(parsed.conditions![0].against, '007');
});

test('Test that an ordinary number literal is still coerced.', () => {
  const parsed = rulesParseRuleItemRule('if {$.age} greater 30', {
    result: 'match',
  });

  assert.strictEqual(parsed.conditions![0].against, 30);
});

test('Test that a condition without an "if " prefix throws.', () => {
  assert.throws(
    () => rulesParseRuleItemRule('when {$.age} greater 30', { result: 1 }),
    /must start with "if "/,
  );
});

test('Test that an unknown operator throws.', () => {
  assert.throws(
    () => rulesParseRuleItemRule('if {$.age} biggerThan 30', { result: 1 }),
    /Unknown rule operator "biggerThan"/,
  );

  assert.throws(
    () =>
      rulesParse({
        '{$.x}': { rules: { 'if {$.age} > 30': { result: 1 } } },
      }),
    /Unknown rule operator ">"/,
  );
});

test('Test that rules().parse exposes the fully materialised rule structure.', () => {
  const { parse } = rulesFacade({
    '{$.x}': {
      default: 'd',
      rules: { 'if {$.y} greater 1': { result: 'r' } },
    },
  });

  assert.deepStrictEqual(parse, {
    '{$.x}': {
      default: 'd',
      rules: {
        'if {$.y} greater 1': {
          result: 'r',
          conditions: [{ against: 1, check: '{$.y}', operator: 'greater' }],
        },
      },
    },
  });
});

test('Test that "true" and "false" in the against slot parse to booleans.', () => {
  const parsed = rulesParseRuleItemRule('if {$.on} equals true', { result: 1 });
  assert.strictEqual(parsed.conditions![0].against, true);

  const parsedFalse = rulesParseRuleItemRule('if {$.on} equals false', {
    result: 1,
  });
  assert.strictEqual(parsedFalse.conditions![0].against, false);
});

test('Test that a state pointer in the against slot is kept as a string, not coerced.', () => {
  const parsed = rulesParseRuleItemRule('if {$.a} equals {$.b}', { result: 1 });
  assert.strictEqual(parsed.conditions![0].against, '{$.b}');
});

test('Test that the against value may contain spaces.', () => {
  const parsed = rulesParseRuleItemRule('if {$.name} equals Darth Vader', {
    result: 1,
  });
  assert.strictEqual(parsed.conditions![0].against, 'Darth Vader');
});

test('Test that an against value cannot contain the word "and" (grammar limitation).', () => {
  // " and " always splits conditions, so the trailing fragment has no
  // operator and parsing fails loudly rather than silently mis-reading it.
  assert.throws(
    () =>
      rulesParseRuleItemRule('if {$.title} equals Salt and Pepper', {
        result: 1,
      }),
    /Unknown rule operator/,
  );
});

test('Test that only rule keys referenced by a condition become dependencies.', () => {
  const parsed = rulesParse({
    '{$.a}': { rules: { 'if {$.b} greater 1': { result: 1 } } },
    '{$.b}': { rules: { 'if {$.c} greater 1': { result: 1 } } },
  });

  // {$.a} references {$.b}, which is a rule key -> dependency.
  assert.deepStrictEqual(parsed['{$.a}'].dependencies, ['{$.b}']);
  // {$.b} references {$.c}, which is not a rule key -> no dependency.
  assert.strictEqual(parsed['{$.b}'].dependencies, undefined);
});

test('Test that a condition with multiple "and" clauses parses every clause.', () => {
  const parsed = rulesParseRuleItemRule(
    'if {$.a} greater 1 and {$.b} less 2 and {$.c} equals x',
    { result: 'ok' },
  );

  assert.strictEqual(parsed.conditions!.length, 3);
  assert.deepStrictEqual(parsed.conditions!.map(c => c.operator), [
    'greater',
    'less',
    'equals',
  ]);
});
