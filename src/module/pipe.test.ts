import assert from 'node:assert/strict'
import { test } from 'node:test'
import { pipe } from './pipe'

function addOne(input: number) {
  return input + 1
}
function addTwo(input: number) {
  return input + 2
}
function doubleString(value: string) {
  return `${value} ${value}`
}
function makeString(input: number) {
  return `${input} as a string.`
}
function uppercaseString(value: string) {
  return value.toUpperCase()
}

test('Test a basic pipe.', () => {
  assert.strictEqual(
    pipe(uppercaseString, doubleString)('Darth Vader'),
    'DARTH VADER DARTH VADER',
  )
})

test('Test that the type stays the same.', () => {
  assert.strictEqual(typeof pipe(addOne, addTwo)(1), 'number')
})

test('Test that the type changes.', () => {
  assert.strictEqual(typeof pipe(addOne, addTwo, makeString)(1), 'string')
})
