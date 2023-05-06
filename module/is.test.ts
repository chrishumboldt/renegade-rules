import { isArray, isFunction, isNumber, isObject, isString } from './is';

describe('Is Module Tests', () => {
  test('Test that arrays validate.', () => {
    expect(isArray([])).toBe(true);
    expect(isArray([1, 2, 3])).toBe(true);
    expect(isArray(['one', 'two', 'three'])).toBe(true);
    expect(isArray(['one', 2, () => {}])).toBe(true);
  });

  test('Test that a everything else does not validate as an array.', () => {
    expect(isArray(1)).toBe(false);
    expect(isArray(false)).toBe(false);
    expect(isArray(true)).toBe(false);
    expect(isArray(2.5)).toBe(false);
    expect(isArray(-1)).toBe(false);
    expect(isArray(() => {})).toBe(false);
    expect(isArray('This is a test.')).toBe(false);
    expect(isArray({})).toBe(false);
    expect(isArray(undefined)).toBe(false);
    expect(isArray(null)).toBe(false);
  });

  test('Test that a function validates.', () => {
    expect(isFunction(() => {})).toBe(true);
  });

  test('Test that a everything else does not validate as a function.', () => {
    expect(isFunction(1)).toBe(false);
    expect(isFunction(false)).toBe(false);
    expect(isFunction(true)).toBe(false);
    expect(isFunction(2.5)).toBe(false);
    expect(isFunction(-1)).toBe(false);
    expect(isFunction([])).toBe(false);
    expect(isFunction('This is a test.')).toBe(false);
    expect(isFunction({})).toBe(false);
    expect(isFunction(undefined)).toBe(false);
    expect(isFunction(null)).toBe(false);
  });

  test('Test that numbers validate.', () => {
    expect(isNumber(2)).toBe(true);
    expect(isNumber(2.5)).toBe(true);
    expect(isNumber(0.5)).toBe(true);
    expect(isNumber(0)).toBe(true);
    expect(isNumber(-1)).toBe(true);
  });

  test('Test that a everything else does not validate as a number.', () => {
    expect(isNumber('This is a test')).toBe(false);
    expect(isNumber('2')).toBe(false);
    expect(isNumber(false)).toBe(false);
    expect(isNumber(true)).toBe(false);
    expect(isNumber(() => {})).toBe(false);
    expect(isNumber([])).toBe(false);
    expect(isNumber({})).toBe(false);
    expect(isNumber(undefined)).toBe(false);
    expect(isNumber(null)).toBe(false);
  });

  test('Test that objects validate.', () => {
    expect(isObject({})).toBe(true);
    expect(isObject([])).toBe(true);
  });

  test('Test that a everything else does not validate as an object.', () => {
    expect(isObject(1)).toBe(false);
    expect(isObject(false)).toBe(false);
    expect(isObject(true)).toBe(false);
    expect(isObject(2.5)).toBe(false);
    expect(isObject(-1)).toBe(false);
    expect(isObject(() => {})).toBe(false);
    expect(isObject('This is a test.')).toBe(false);
    expect(isObject(undefined)).toBe(false);
    expect(isObject(null)).toBe(false);
  });

  test('Test that a string validates.', () => {
    expect(isString('This is a test')).toBe(true);
  });

  test('Test that a everything else does not validate as a string.', () => {
    expect(isString(1)).toBe(false);
    expect(isString(false)).toBe(false);
    expect(isString(true)).toBe(false);
    expect(isString(2.5)).toBe(false);
    expect(isString(-1)).toBe(false);
    expect(isString(() => {})).toBe(false);
    expect(isString([])).toBe(false);
    expect(isString({})).toBe(false);
    expect(isString(undefined)).toBe(false);
    expect(isString(null)).toBe(false);
  });
});
