import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isArray, isFunction, isNumber, isObject, isString } from './is';

test('Test that arrays validate.', () => {
  assert.strictEqual(isArray([]), true);
  assert.strictEqual(isArray([1, 2, 3]), true);
  assert.strictEqual(isArray(['one', 'two', 'three']), true);
  assert.strictEqual(isArray(['one', 2, () => {}]), true);
});

test('Test that a everything else does not validate as an array.', () => {
  assert.strictEqual(isArray(1), false);
  assert.strictEqual(isArray(false), false);
  assert.strictEqual(isArray(true), false);
  assert.strictEqual(isArray(2.5), false);
  assert.strictEqual(isArray(-1), false);
  assert.strictEqual(isArray(() => {}), false);
  assert.strictEqual(isArray('This is a test.'), false);
  assert.strictEqual(isArray({}), false);
  assert.strictEqual(isArray(undefined), false);
  assert.strictEqual(isArray(null), false);
});

test('Test that a function validates.', () => {
  assert.strictEqual(isFunction(() => {}), true);
});

test('Test that a everything else does not validate as a function.', () => {
  assert.strictEqual(isFunction(1), false);
  assert.strictEqual(isFunction(false), false);
  assert.strictEqual(isFunction(true), false);
  assert.strictEqual(isFunction(2.5), false);
  assert.strictEqual(isFunction(-1), false);
  assert.strictEqual(isFunction([]), false);
  assert.strictEqual(isFunction('This is a test.'), false);
  assert.strictEqual(isFunction({}), false);
  assert.strictEqual(isFunction(undefined), false);
  assert.strictEqual(isFunction(null), false);
});

test('Test that numbers validate.', () => {
  assert.strictEqual(isNumber(2), true);
  assert.strictEqual(isNumber(2.5), true);
  assert.strictEqual(isNumber(0.5), true);
  assert.strictEqual(isNumber(0), true);
  assert.strictEqual(isNumber(-1), true);
});

test('Test that a everything else does not validate as a number.', () => {
  assert.strictEqual(isNumber('This is a test'), false);
  assert.strictEqual(isNumber('2'), false);
  assert.strictEqual(isNumber(false), false);
  assert.strictEqual(isNumber(true), false);
  assert.strictEqual(isNumber(() => {}), false);
  assert.strictEqual(isNumber([]), false);
  assert.strictEqual(isNumber({}), false);
  assert.strictEqual(isNumber(undefined), false);
  assert.strictEqual(isNumber(null), false);
});

test('Test that objects validate.', () => {
  assert.strictEqual(isObject({}), true);
  assert.strictEqual(isObject([]), true);
});

test('Test that a everything else does not validate as an object.', () => {
  assert.strictEqual(isObject(1), false);
  assert.strictEqual(isObject(false), false);
  assert.strictEqual(isObject(true), false);
  assert.strictEqual(isObject(2.5), false);
  assert.strictEqual(isObject(-1), false);
  assert.strictEqual(isObject(() => {}), false);
  assert.strictEqual(isObject('This is a test.'), false);
  assert.strictEqual(isObject(undefined), false);
  assert.strictEqual(isObject(null), false);
});

test('Test that a string validates.', () => {
  assert.strictEqual(isString('This is a test'), true);
});

test('Test that a everything else does not validate as a string.', () => {
  assert.strictEqual(isString(1), false);
  assert.strictEqual(isString(false), false);
  assert.strictEqual(isString(true), false);
  assert.strictEqual(isString(2.5), false);
  assert.strictEqual(isString(-1), false);
  assert.strictEqual(isString(() => {}), false);
  assert.strictEqual(isString([]), false);
  assert.strictEqual(isString({}), false);
  assert.strictEqual(isString(undefined), false);
  assert.strictEqual(isString(null), false);
});
