import { RuleItem, Rules } from '@type/rule';
import {
  rulesParse,
  rulesParseRuleItem,
  rulesParseRuleItemRule,
} from './rules-parse';

describe('Rule Module Parse Tests', () => {
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
    const test = rulesParseRuleItemRule(condition, ruleResult);
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

    expect(test).toStrictEqual(result);
  });

  test('Test that a single rule condition can be parsed with two JPaths pointers.', () => {
    condition = 'if {$.user.age} greater/equals {$.user.something}';

    const test = rulesParseRuleItemRule(condition, ruleResult);
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

    expect(test).toStrictEqual(result);
  });

  test('Test that a single rule with 2 conditions can be parsed.', () => {
    condition = 'if {$.user.age} greater/equals 30 and {$.user.age} less 40';

    const test = rulesParseRuleItemRule(condition, ruleResult);
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

    expect(test).toStrictEqual(result);
  });

  test('Test that a single rule with 3 conditions can be parsed.', () => {
    condition =
      'if {$.user.age} greater/equals 30 and {$.user.age} less 40 and {$.user.name} equals Darth Vader';

    const test = rulesParseRuleItemRule(condition, ruleResult);
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

    expect(test).toStrictEqual(result);
  });

  test('Test that a rule item with a single condition can be parsed.', () => {
    const test = rulesParseRuleItem(ruleItem);
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

    expect(test).toStrictEqual(result);
  });

  test('Test that a rule item with 2 conditions can be parsed.', () => {
    ruleItem = {
      default: 'Anakin Skywalker',
      rules: {
        'if {$.user.age} greater/equals 30': { result: 'Darth Vader' },
        'if {$.user.age} less 10': { result: 'Young Ani' },
      },
    };

    const test = rulesParseRuleItem(ruleItem);
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

    expect(test).toStrictEqual(result);
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

    const test = rulesParseRuleItem(ruleItem);
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

    expect(test).toStrictEqual(result);
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

    const test = rulesParseRuleItem(ruleItem);
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

    expect(test).toStrictEqual(result);
  });

  test('Test that a basic rule object can be parsed.', () => {
    const test = rulesParse(rules);
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

    expect(test).toStrictEqual(result);
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

    const test = rulesParse(rules);
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

    expect(test).toStrictEqual(result);
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

    const test = rulesParse(rules);
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

    expect(test).toStrictEqual(result);
  });
});
