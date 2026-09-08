import assert from 'node:assert/strict';
import { test } from 'node:test';
import { rules } from './rules';

// How a single rule item resolves: rules are tried in declaration order, the
// first fulfilled one wins, and the default is the fallback.

test('The first rule that is fulfilled wins, so declaration order matters.', () => {
  const highFirst = rules({
    '{$.band}': {
      rules: {
        'if {$.age} greater 40': { result: 'over-40' },
        'if {$.age} greater 30': { result: 'over-30' },
      },
    },
  });
  const lowFirst = rules({
    '{$.band}': {
      rules: {
        'if {$.age} greater 30': { result: 'over-30' },
        'if {$.age} greater 40': { result: 'over-40' },
      },
    },
  });

  assert.strictEqual(highFirst.run({ age: 50 }).result.band, 'over-40');
  assert.strictEqual(lowFirst.run({ age: 50 }).result.band, 'over-30');
});

test('When no rule is fulfilled the default is used.', () => {
  const engine = rules({
    '{$.plan}': {
      default: 'free',
      rules: { 'if {$.spend} greater 100': { result: 'pro' } },
    },
  });

  assert.strictEqual(engine.run({ spend: 5 }).result.plan, 'free');
});

test('When no rule is fulfilled and there is no default the key is absent from the result.', () => {
  const engine = rules({
    '{$.plan}': {
      rules: { 'if {$.spend} greater 100': { result: 'pro' } },
    },
  });

  const output = engine.run({ spend: 5 });

  assert.deepStrictEqual(output.result, { spend: 5 });
  assert.ok(!('plan' in output.result));
});

test('Falsy defaults (false, 0, null) are applied, undefined is treated as no default.', () => {
  const engine = rules({
    '{$.flag}': { default: false, rules: {} },
    '{$.count}': { default: 0, rules: {} },
    '{$.ref}': { default: null, rules: {} },
    '{$.missing}': { rules: {} },
  });

  assert.deepStrictEqual(engine.run({}).result, {
    flag: false,
    count: 0,
    ref: null,
  });
});

test('Precedence for a rule key is: fulfilled rule, then incoming state value, then default.', () => {
  const engine = rules({
    '{$.age}': {
      default: 9,
      rules: { 'if {$.grownUp} equals true': { result: 35 } },
    },
  });

  // No incoming value, no rule -> default.
  assert.strictEqual(engine.run({}).result.age, 9);
  // Incoming value, no rule -> incoming value wins over the default.
  assert.strictEqual(engine.run({ age: 25 }).result.age, 25);
  // A fulfilled rule beats both the incoming value and the default.
  assert.strictEqual(engine.run({ age: 25, grownUp: true }).result.age, 35);
});

test('An incoming state value for a rule key is visible to other rules that depend on it.', () => {
  const engine = rules({
    '{$.tier}': {
      default: 'junior',
      rules: { 'if {$.age} greater/equals 30': { result: 'senior' } },
    },
    '{$.age}': {
      default: 18,
      rules: { 'if {$.promoted} equals true': { result: 40 } },
    },
  });

  // age comes in as 33: no age rule fires, but the seeded value (not the
  // default 18) is what {$.tier} sees.
  assert.deepStrictEqual(engine.run({ age: 33 }).result, {
    age: 33,
    tier: 'senior',
  });
});

test('A falsy incoming value still counts as seeded and is not replaced by the default.', () => {
  const engine = rules({
    '{$.count}': { default: 10, rules: {} },
    '{$.flag}': { default: true, rules: {} },
  });

  assert.deepStrictEqual(engine.run({ count: 0, flag: false }).result, {
    count: 0,
    flag: false,
  });
});

test('All conditions joined by "and" must hold for a rule to fire.', () => {
  const engine = rules({
    '{$.approved}': {
      default: 'no',
      rules: {
        'if {$.age} greater/equals 18 and {$.hasId} equals true': { result: 'yes' },
      },
    },
  });

  assert.strictEqual(engine.run({ age: 20, hasId: true }).result.approved, 'yes');
  assert.strictEqual(engine.run({ age: 20, hasId: false }).result.approved, 'no');
  assert.strictEqual(engine.run({ age: 16, hasId: true }).result.approved, 'no');
});

test('A condition can compare two state references.', () => {
  const engine = rules({
    '{$.inRange}': {
      default: false,
      rules: {
        'if {$.value} greater/equals {$.min} and {$.value} less/equals {$.max}': {
          result: true,
        },
      },
    },
  });

  assert.strictEqual(engine.run({ value: 5, min: 1, max: 10 }).result.inRange, true);
  assert.strictEqual(engine.run({ value: 10, min: 1, max: 10 }).result.inRange, true);
  assert.strictEqual(engine.run({ value: 50, min: 1, max: 10 }).result.inRange, false);
});

test('The against value keeps its spaces, so multi word comparisons work.', () => {
  const engine = rules({
    '{$.rank}': {
      rules: { 'if {$.name} equals Obi Wan Kenobi': { result: 'Master' } },
    },
  });

  assert.strictEqual(engine.run({ name: 'Obi Wan Kenobi' }).result.rank, 'Master');
  assert.strictEqual(engine.run({ name: 'Obi Wan' }).result.rank, undefined);
});

test('equals is strict, so a numeric string in state does not match a numeric literal.', () => {
  const engine = rules({
    '{$.match}': {
      default: false,
      rules: { 'if {$.code} equals 42': { result: true } },
    },
  });

  assert.strictEqual(engine.run({ code: 42 }).result.match, true);
  assert.strictEqual(engine.run({ code: '42' }).result.match, false);
});

test('greater and less use native comparison, including lexicographic order for strings.', () => {
  const engine = rules({
    '{$.late}': {
      default: false,
      rules: { 'if {$.name} greater M': { result: true } },
    },
  });

  assert.strictEqual(engine.run({ name: 'Zorro' }).result.late, true);
  assert.strictEqual(engine.run({ name: 'Alpha' }).result.late, false);
});

test('greater is exclusive and greater/equals is inclusive at the boundary.', () => {
  const engine = rules({
    '{$.gt}': { default: 'no', rules: { 'if {$.n} greater 10': { result: 'yes' } } },
    '{$.gte}': {
      default: 'no',
      rules: { 'if {$.n} greater/equals 10': { result: 'yes' } },
    },
  });

  assert.deepStrictEqual(engine.run({ n: 10 }).result, {
    n: 10,
    gt: 'no',
    gte: 'yes',
  });
});

test('startsWith and endsWith only apply to string values.', () => {
  const engine = rules({
    '{$.hit}': {
      default: false,
      rules: { 'if {$.token} startsWith abc': { result: true } },
    },
  });

  assert.strictEqual(engine.run({ token: 'abcdef' }).result.hit, true);
  assert.strictEqual(engine.run({ token: 123 }).result.hit, false);
});

test('includes matches a substring of a string and a member of an array.', () => {
  const engine = rules({
    '{$.ok}': {
      default: false,
      rules: { 'if {$.value} includes admin': { result: true } },
    },
  });

  assert.strictEqual(engine.run({ value: 'super-admin-user' }).result.ok, true);
  assert.strictEqual(engine.run({ value: ['guest', 'admin'] }).result.ok, true);
  assert.strictEqual(engine.run({ value: ['guest'] }).result.ok, false);
});

test('excludes is the negation of includes and holds when the value cannot contain anything.', () => {
  const engine = rules({
    '{$.safe}': {
      default: false,
      rules: { 'if {$.roles} excludes banned': { result: true } },
    },
  });

  assert.strictEqual(engine.run({ roles: ['user', 'editor'] }).result.safe, true);
  assert.strictEqual(engine.run({ roles: ['user', 'banned'] }).result.safe, false);
  // roles missing entirely: it excludes "banned" by definition.
  assert.strictEqual(engine.run({}).result.safe, true);
});

test('run() does not mutate the state it is given and returns a fresh object.', () => {
  const engine = rules({ '{$.added}': { default: true, rules: {} } });
  const state = { a: 1, nested: { b: 2 } };

  const output = engine.run(state);

  assert.deepStrictEqual(state, { a: 1, nested: { b: 2 } });
  assert.notStrictEqual(output.result, state);
  assert.notStrictEqual(output.result.nested, state.nested);
});

test('The same engine can be run many times with independent results.', () => {
  const engine = rules({
    '{$.grade}': {
      default: 'F',
      rules: { 'if {$.score} greater/equals 50': { result: 'P' } },
    },
  });

  assert.strictEqual(engine.run({ score: 80 }).result.grade, 'P');
  assert.strictEqual(engine.run({ score: 10 }).result.grade, 'F');
  assert.strictEqual(engine.run({ score: 80 }).result.grade, 'P');
});

test('Building an engine does not mutate the rule definitions passed in.', () => {
  const definitions = {
    '{$.x}': {
      default: 'd',
      rules: { 'if {$.y} greater 1': { result: 'r' } },
    },
  };
  const snapshot = JSON.stringify(definitions);

  const engine = rules(definitions);
  engine.run({ y: 5 });

  assert.strictEqual(JSON.stringify(definitions), snapshot);
});

test('An empty rule set passes the state straight through.', () => {
  const engine = rules({});

  assert.deepStrictEqual(engine.run({ a: 1, b: { c: 2 } }), {
    result: { a: 1, b: { c: 2 } },
    rulesRun: [],
  });
});

test('Debug mode does not change the result.', () => {
  const engine = rules({ '{$.x}': { default: 1, rules: {} } });
  const originalLog = console.log;
  let logged = 0;
  console.log = () => {
    logged += 1;
  };

  let quiet;
  let loud;
  try {
    quiet = engine.run({}, false).result;
    loud = engine.run({}, true).result;
  } finally {
    console.log = originalLog;
  }

  assert.deepStrictEqual(quiet, loud);
  assert.ok(logged > 0);
});
