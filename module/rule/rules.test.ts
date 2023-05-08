import { RuleCondition, Rules } from '@type/rule';
import { checkCondition, rules } from './rules';

describe('Rule Module Run Tests', () => {
  test('Test that the equals rule condition resolves properly.', () => {
    expect(
      checkCondition(
        {
          against: 'Darth Vader',
          check: 'Darth Vader',
          operator: 'equals',
        },
        {},
      ),
    ).toBe(true);

    expect(
      checkCondition(
        {
          against: 'Darth Vader',
          check: '{$.name}',
          operator: 'equals',
        },
        {
          '{$.name}': 'Darth Vader',
        },
      ),
    ).toBe(true);

    const fullCondition: RuleCondition = {
      against: '{$.sithName}',
      check: '{$.name}',
      operator: 'equals',
    };

    expect(
      checkCondition(fullCondition, {
        '{$.name}': 'Darth Vader',
        '{$.sithName}': 'Darth Vader',
      }),
    ).toBe(true);

    expect(
      checkCondition(fullCondition, {
        '{$.name}': 'Anakin Skywalker',
        '{$.sithName}': 'Darth Vader',
      }),
    ).toBe(false);

    expect(
      checkCondition(fullCondition, {
        '{$.name}': true,
        '{$.sithName}': 'Darth Vader',
      }),
    ).toBe(false);

    expect(
      checkCondition(fullCondition, {
        '{$.name}': 'Darth Vader',
        '{$.sithName}': true,
      }),
    ).toBe(false);

    expect(
      checkCondition(fullCondition, {
        '{$.name}': 2,
        '{$.sithName}': 'Darth Vader',
      }),
    ).toBe(false);
  });

  test('Test that a simple rule will resolve properly.', () => {
    let testRules: Rules = {
      '{$.lightsaberColour}': {
        default: 'blue',
        rules: {
          'if {$.age} greater 30': {
            result: 'red',
          },
        },
      },
      '{$.age}': {
        default: 9,
        rules: {
          'if {$.isOlder} equals true': {
            result: 35,
          },
        },
      },
    };
    let testState = {
      isOlder: true,
    };
    const rulesTest = rules(testRules);

    expect(rulesTest.run(testState).result).toStrictEqual({
      age: 35,
      isOlder: true,
      lightsaberColour: 'red',
    });
  });

  test('Test that we can catch a simple dependency loop.', () => {
    const testRules: Rules = {
      '{$.age}': {
        rules: {
          'if {$.name} equal Darth Vader': {
            result: 35,
          },
        },
      },
      '{$.name}': {
        rules: {
          'if {$.age} > 30': {
            result: 'Darth Vader',
          },
        },
      },
    };

    expect(rules(testRules).run({}).errors).toStrictEqual([
      'There is a circular dependency with {$.name}->{$.age}->{$.name}.',
    ]);
  });

  test('Test that we can catch a 3 tier dependency loop.', () => {
    const testRules: Rules = {
      '{$.age}': {
        rules: {
          'if {$.name} equal Darth Vader': {
            result: 35,
          },
        },
      },
      '{$.name}': {
        rules: {
          'if {$.isOlder} equals true': {
            result: 'Darth Vader',
          },
        },
      },
      '{$.isOlder}': {
        rules: {
          'if {$.age} greater 30': {
            result: true,
          },
        },
      },
    };

    expect(rules(testRules).run({}, false).errors).toStrictEqual([
      'There is a circular dependency with {$.isOlder}->{$.age}->{$.name}->{$.isOlder}.',
    ]);
  });

  test('Test a rule set from another library.', () => {
    const testRules = rules({
      '{$.fouledOut}': {
        default: false,
        rules: {
          'if {$.gameDuration} equals 40 and {$.personalFoulCount} greater/equals 5':
            {
              result: true,
            },
          'if {$.gameDuration} equals 48 and {$.personalFoulCount} greater/equals 6':
            {
              result: true,
            },
        },
      },
    });

    expect(
      testRules.run({ gameDuration: 40, personalFoulCount: 5 }).result
        .fouledOut,
    ).toBe(true);

    expect(
      testRules.run({ gameDuration: 48, personalFoulCount: 6 }, false).result
        .fouledOut,
    ).toBe(true);

    expect(
      testRules.run({ gameDuration: 25, personalFoulCount: 6 }).result
        .fouledOut,
    ).toBe(false);

    expect(
      testRules.run({ gameDuration: 45, personalFoulCount: 2 }).result
        .fouledOut,
    ).toBe(false);

    expect(
      testRules.run({ gameDuration: 45, personalFoulCount: 10 }).result
        .fouledOut,
    ).toBe(false);

    expect(
      testRules.run({ gameDuration: 40, personalFoulCount: 10 }).result
        .fouledOut,
    ).toBe(true);
  });
});
