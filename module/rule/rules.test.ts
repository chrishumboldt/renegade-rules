import { Rules } from '@type/rule';
import { rules } from './rules';

describe('Rule Module Run Tests', () => {
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

  test('That a simple rule will resolve properly', () => {
    const rulesTest = rules(testRules);

    expect(rulesTest.run(testState).result).toStrictEqual({
      age: 35,
      isOlder: true,
      lightsaberColour: 'red',
    });
  });
});
