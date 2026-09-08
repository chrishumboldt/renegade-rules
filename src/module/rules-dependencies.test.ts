import assert from 'node:assert/strict'
import { test } from 'node:test'
import { rules } from './rules'

// A rule whose condition references another top-level rule key depends on it.
// The engine must resolve that dependency first, regardless of declaration
// order, and it detects cycles from the static dependency graph rather than
// by actually recursing at run time.

test('A dependency is resolved before the rule that needs it, even when declared later.', () => {
  const engine = rules({
    // "tier" is declared first but depends on "age".
    '{$.tier}': {
      default: 'junior',
      rules: { 'if {$.age} greater/equals 30': { result: 'senior' } },
    },
    '{$.age}': {
      default: 18,
      rules: { 'if {$.experienced} equals true': { result: 40 } },
    },
  })

  const output = engine.run({ experienced: true })

  assert.deepStrictEqual(output.result, {
    experienced: true,
    age: 40,
    tier: 'senior',
  })
})

test('rulesRun reports every rule that executed, dependency first.', () => {
  const engine = rules({
    '{$.tier}': {
      rules: { 'if {$.age} greater 30': { result: 'senior' } },
    },
    '{$.age}': {
      default: 20,
      rules: { 'if {$.member} equals true': { result: 40 } },
    },
  })

  const output = engine.run({ member: true })

  assert.deepStrictEqual(output.rulesRun, ['{$.age}', '{$.tier}'])
})

test('A dependency declared through the "against" side of a condition is still resolved first.', () => {
  const engine = rules({
    '{$.limit}': {
      default: 100,
      rules: { 'if {$.vip} equals true': { result: 500 } },
    },
    '{$.withinLimit}': {
      default: false,
      rules: { 'if {$.spent} less {$.limit}': { result: true } },
    },
  })

  assert.strictEqual(
    engine.parse['{$.withinLimit}'].dependencies?.[0],
    '{$.limit}',
  )
  assert.strictEqual(
    engine.run({ vip: true, spent: 300 }).result.withinLimit,
    true,
  )
  assert.strictEqual(
    engine.run({ vip: false, spent: 300 }).result.withinLimit,
    false,
  )
})

test('A rule result feeds the condition of a rule that depends on it.', () => {
  const engine = rules({
    '{$.net}': {
      default: 'gross',
      rules: { 'if {$.tax} greater 0': { result: 'taxed' } },
    },
    '{$.tax}': {
      default: 0,
      rules: { 'if {$.income} greater 1000': { result: 200 } },
    },
  })

  const output = engine.run({ income: 5000 })

  assert.strictEqual(output.result.tax, 200)
  assert.strictEqual(output.result.net, 'taxed')
})

test('A shared dependency in a diamond graph runs exactly once.', () => {
  const engine = rules({
    '{$.d}': {
      default: 'no',
      rules: { 'if {$.b} greater 0 and {$.c} greater 0': { result: 'yes' } },
    },
    '{$.b}': { default: 0, rules: { 'if {$.a} greater 10': { result: 1 } } },
    '{$.c}': { default: 0, rules: { 'if {$.a} greater 10': { result: 1 } } },
    '{$.a}': {
      default: 0,
      rules: { 'if {$.seed} equals true': { result: 20 } },
    },
  })

  const output = engine.run({ seed: true })

  assert.strictEqual(output.result.d, 'yes')
  assert.deepStrictEqual(output.rulesRun, ['{$.a}', '{$.b}', '{$.c}', '{$.d}'])
  assert.strictEqual(output.rulesRun.filter(key => key === '{$.a}').length, 1)
})

test('A direct two rule cycle is reported as a circular dependency.', () => {
  const engine = rules({
    '{$.age}': {
      rules: { 'if {$.name} equals Darth Vader': { result: 35 } },
    },
    '{$.name}': {
      rules: { 'if {$.age} greater 30': { result: 'Darth Vader' } },
    },
  })

  assert.deepStrictEqual(engine.run({}).errors, [
    'There is a circular dependency with {$.name}->{$.age}->{$.name}.',
  ])
})

test('A rule that references itself is reported as a circular dependency.', () => {
  const engine = rules({
    '{$.a}': {
      default: 1,
      rules: { 'if {$.a} greater 5': { result: 10 } },
    },
  })

  assert.deepStrictEqual(engine.run({}).errors, [
    'There is a circular dependency with {$.a}->{$.a}->{$.a}.',
  ])
})

test('A cycle is reported even when the conditions could never actually recurse.', () => {
  // Neither default (1 / 5) can ever equal 99, so at run time this would
  // settle immediately. The engine still rejects it because the dependency
  // graph has a cycle.
  const engine = rules({
    '{$.a}': { default: 1, rules: { 'if {$.b} equals 99': { result: 2 } } },
    '{$.b}': { default: 5, rules: { 'if {$.a} equals 99': { result: 6 } } },
  })

  const output = engine.run({})

  assert.deepStrictEqual(output.errors, [
    'There is a circular dependency with {$.b}->{$.a}->{$.b}.',
  ])
})

test('When a cycle is found, the run aborts and returns the partial result.', () => {
  const engine = rules({
    '{$.a}': {
      default: 'a-default',
      rules: { 'if {$.b} equals x': { result: 'a2' } },
    },
    '{$.b}': {
      default: 'b-default',
      rules: { 'if {$.a} equals y': { result: 'b2' } },
    },
  })

  const output = engine.run({})

  assert.ok(output.errors)
  assert.deepStrictEqual(output.result, { a: 'a-default' })
  assert.deepStrictEqual(output.rulesRun, ['{$.a}'])
})

test('Referencing a plain state value (not a rule key) creates no dependency.', () => {
  const engine = rules({
    '{$.a}': { rules: { 'if {$.plainInput} greater 1': { result: 2 } } },
  })

  assert.strictEqual(engine.parse['{$.a}'].dependencies, undefined)
  assert.strictEqual(engine.run({ plainInput: 5 }).result.a, 2)
})

test('Independent rules all run regardless of declaration order.', () => {
  const engine = rules({
    '{$.x}': { rules: { 'if {$.on} equals true': { result: 'X' } } },
    '{$.y}': { rules: { 'if {$.on} equals true': { result: 'Y' } } },
    '{$.z}': { rules: { 'if {$.on} equals true': { result: 'Z' } } },
  })

  assert.deepStrictEqual(engine.run({ on: true }).result, {
    on: true,
    x: 'X',
    y: 'Y',
    z: 'Z',
  })
})
