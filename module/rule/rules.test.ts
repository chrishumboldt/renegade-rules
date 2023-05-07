import { Rules } from '@type/rule';
import { rules } from './rules';

describe('Rule Module Run Tests', () => {
  test('Test that a simple rule will resolve properly', () => {
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

    expect(rules(testRules).run({})).toStrictEqual({
      errors: [
        'There is a circular dependency with {$.name}->{$.age}->{$.name}.',
      ],
      result: {},
    });
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

    expect(rules(testRules).run({})).toStrictEqual({
      errors: [
        'There is a circular dependency with {$.isOlder}->{$.age}->{$.name}->{$.isOlder}.',
      ],
      result: {},
    });
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
      testRules.run({ gameDuration: 40, personalFoulCount: 6 }).result
        .fouledOut,
    ).toBe(true);

    expect(
      testRules.run({ gameDuration: 48, personalFoulCount: 6 }).result
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
