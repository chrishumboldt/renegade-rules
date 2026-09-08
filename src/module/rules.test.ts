import assert from 'node:assert/strict'
import { test } from 'node:test'
import { RuleCondition, Rules } from '../type/rule'
import { checkCondition, rules } from './rules'

test('Test that the equals rule condition resolves properly.', () => {
  assert.strictEqual(
    checkCondition(
      {
        against: 'Darth Vader',
        check: 'Darth Vader',
        operator: 'equals',
      },
      {},
    ),
    true,
  )

  assert.strictEqual(
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
    true,
  )

  const fullCondition: RuleCondition = {
    against: '{$.sithName}',
    check: '{$.name}',
    operator: 'equals',
  }

  assert.strictEqual(
    checkCondition(fullCondition, {
      '{$.name}': 'Darth Vader',
      '{$.sithName}': 'Darth Vader',
    }),
    true,
  )

  assert.strictEqual(
    checkCondition(fullCondition, {
      '{$.name}': 'Anakin Skywalker',
      '{$.sithName}': 'Darth Vader',
    }),
    false,
  )

  assert.strictEqual(
    checkCondition(fullCondition, {
      '{$.name}': true,
      '{$.sithName}': 'Darth Vader',
    }),
    false,
  )

  assert.strictEqual(
    checkCondition(fullCondition, {
      '{$.name}': 'Darth Vader',
      '{$.sithName}': true,
    }),
    false,
  )

  assert.strictEqual(
    checkCondition(fullCondition, {
      '{$.name}': 2,
      '{$.sithName}': 'Darth Vader',
    }),
    false,
  )
})

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
  }
  let testState = {
    isOlder: true,
  }
  const rulesTest = rules(testRules)

  assert.deepStrictEqual(rulesTest.run(testState).result, {
    age: 35,
    isOlder: true,
    lightsaberColour: 'red',
  })
})

test('Test that we can catch a simple dependency loop.', () => {
  const testRules: Rules = {
    '{$.age}': {
      rules: {
        'if {$.name} equals Darth Vader': {
          result: 35,
        },
      },
    },
    '{$.name}': {
      rules: {
        'if {$.age} greater 30': {
          result: 'Darth Vader',
        },
      },
    },
  }

  assert.deepStrictEqual(rules(testRules).run({}).errors, [
    'There is a circular dependency with {$.name}->{$.age}->{$.name}.',
  ])
})

test('Test that we can catch a 3 tier dependency loop.', () => {
  const testRules: Rules = {
    '{$.age}': {
      rules: {
        'if {$.name} equals Darth Vader': {
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
  }

  assert.deepStrictEqual(rules(testRules).run({}, false).errors, [
    'There is a circular dependency with {$.isOlder}->{$.age}->{$.name}->{$.isOlder}.',
  ])
})

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
  })

  assert.strictEqual(
    testRules.run({ gameDuration: 40, personalFoulCount: 5 }).result.fouledOut,
    true,
  )

  assert.strictEqual(
    testRules.run({ gameDuration: 48, personalFoulCount: 6 }, false).result
      .fouledOut,
    true,
  )

  assert.strictEqual(
    testRules.run({ gameDuration: 25, personalFoulCount: 6 }).result.fouledOut,
    false,
  )

  assert.strictEqual(
    testRules.run({ gameDuration: 45, personalFoulCount: 2 }).result.fouledOut,
    false,
  )

  assert.strictEqual(
    testRules.run({ gameDuration: 45, personalFoulCount: 10 }).result.fouledOut,
    false,
  )

  assert.strictEqual(
    testRules.run({ gameDuration: 40, personalFoulCount: 10 }).result.fouledOut,
    true,
  )
})

test('Test that "includes" and "excludes" do not throw on a missing or scalar value.', () => {
  assert.strictEqual(
    checkCondition(
      { against: 'admin', check: '{$.tags}', operator: 'includes' },
      {},
    ),
    false,
  )

  // "excludes" is the strict negation of "includes", so a missing value
  // excludes everything rather than throwing.
  assert.strictEqual(
    checkCondition(
      { against: 'admin', check: '{$.tags}', operator: 'excludes' },
      {},
    ),
    true,
  )

  assert.strictEqual(
    checkCondition(
      { against: 'x', check: '{$.count}', operator: 'includes' },
      { '{$.count}': 5 },
    ),
    false,
  )
})

test('Test that "includes" and "excludes" work against an array state value.', () => {
  const state = { '{$.roles}': ['admin', 'user'] }

  assert.strictEqual(
    checkCondition(
      { against: 'admin', check: '{$.roles}', operator: 'includes' },
      state,
    ),
    true,
  )

  assert.strictEqual(
    checkCondition(
      { against: 'root', check: '{$.roles}', operator: 'excludes' },
      state,
    ),
    true,
  )
})

test('Test that an array in state survives a run and can be matched with "includes".', () => {
  const testRules = rules({
    '{$.isAdmin}': {
      default: false,
      rules: {
        'if {$.roles} includes admin': { result: true },
      },
    },
  })

  const output = testRules.run({ roles: ['admin', 'user'], name: 'Vader' })

  assert.deepStrictEqual(output.result, {
    isAdmin: true,
    name: 'Vader',
    roles: ['admin', 'user'],
  })
  assert.ok(Array.isArray(output.result.roles))
})

test('Test that a hostile state key cannot pollute Object.prototype through run.', () => {
  const testRules = rules({ '{$.ok}': { default: true, rules: {} } })

  testRules.run({ 'constructor.prototype.polluted': 'yes', a: 1 })

  assert.strictEqual(({} as any).polluted, undefined)
})

test('Test that rules() rejects a non object.', () => {
  assert.throws(() => rules(null as any), /plain object/)
  assert.throws(() => rules([] as any), /plain object/)
})
