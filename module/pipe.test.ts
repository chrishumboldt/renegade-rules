import { pipe } from './pipe';

describe('Pipe Module Tests', () => {
  function addOne(input: number) {
    return input + 1;
  }
  function addTwo(input: number) {
    return input + 2;
  }
  function doubleString(value: string) {
    return `${value} ${value}`;
  }
  function makeString(input: number) {
    return `${input} as a string.`;
  }
  function uppercaseString(value: string) {
    return value.toUpperCase();
  }

  test('Test a basic pipe.', () => {
    expect(pipe(uppercaseString, doubleString)('Darth Vader')).toBe(
      'DARTH VADER DARTH VADER',
    );
  });

  test('Test that the type stays the same.', () => {
    expect(typeof pipe(addOne, addTwo)(1)).toBe('number')
  })

  test('Test that the type changes.', () => {
    expect(typeof pipe(addOne, addTwo, makeString)(1)).toBe('string')
  })
});
