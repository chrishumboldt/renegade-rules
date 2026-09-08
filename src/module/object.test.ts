import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  objectClone,
  objectCreateFromPath,
  objectFlatten,
  objectMerge,
} from './object';

test('Test that objectClone deep clones plain objects and arrays.', () => {
  const source = { a: 1, b: { c: [1, 2, 3] } };
  const clone = objectClone(source);

  assert.deepStrictEqual(clone, source);
  assert.notStrictEqual(clone, source);
  assert.notStrictEqual(clone.b, source.b);
  assert.notStrictEqual(clone.b.c, source.b.c);
});

test('Test that objectClone leaves non plain values (Date) intact.', () => {
  const date = new Date('2020-01-01T00:00:00.000Z');
  const clone = objectClone({ when: date });

  assert.ok(clone.when instanceof Date);
  assert.strictEqual(clone.when.getTime(), date.getTime());
});

test('Test that objectFlatten keeps arrays whole as leaf values.', () => {
  assert.deepStrictEqual(objectFlatten({ user: { roles: ['admin', 'user'] } }), {
    '{$.user.roles}': ['admin', 'user'],
  });
});

test('Test that an array survives a flatten then rebuild round trip.', () => {
  const state = { user: { name: 'Vader', roles: ['admin', 'user'] } };
  const flat = objectFlatten(state);
  const rebuilt = objectCreateFromPath({
    'user.name': flat['{$.user.name}'],
    'user.roles': flat['{$.user.roles}'],
  });

  assert.deepStrictEqual(rebuilt, state);
  assert.ok(Array.isArray(rebuilt.user.roles));
});

test('Test that objectCreateFromPath ignores prototype polluting keys.', () => {
  const rebuilt = objectCreateFromPath({
    'constructor.prototype.polluted': 'yes',
    '__proto__.polluted': 'yes',
    safe: 1,
  });

  assert.strictEqual(({} as any).polluted, undefined);
  assert.deepStrictEqual(rebuilt, { safe: 1 });
});

test('Test that objectFlatten ignores an own prototype polluting key.', () => {
  // JSON.parse produces a real own "__proto__" key, unlike an object literal.
  const hostile = JSON.parse('{"__proto__":{"polluted":"yes"},"safe":1}');
  const flat = objectFlatten(hostile);

  assert.strictEqual(({} as any).polluted, undefined);
  assert.deepStrictEqual(flat, { '{$.safe}': 1 });
});

test('Test that objectCreateFromPath rebuilds over a scalar set earlier on the same path.', () => {
  // "a" is a scalar first, then "a.b" needs "a" to be an object. The old
  // truthy check left "a" as the number 5 and then threw when writing "b".
  const rebuilt = objectCreateFromPath({ a: 5, 'a.b': 1 });

  assert.deepStrictEqual(rebuilt, { a: { b: 1 } });
});

test('Test that objectClone preserves falsy leaf values.', () => {
  assert.deepStrictEqual(objectClone({ a: 0, b: false, c: null, d: '' }), {
    a: 0,
    b: false,
    c: null,
    d: '',
  });
});

test('Test that objectClone drops undefined properties.', () => {
  assert.deepStrictEqual(objectClone({ a: 1, b: undefined }), { a: 1 });
});

test('Test that objectClone returns primitives untouched.', () => {
  assert.strictEqual(objectClone(42), 42);
  assert.strictEqual(objectClone('sith'), 'sith');
  assert.strictEqual(objectClone(null), null);
  assert.strictEqual(objectClone(undefined), undefined);
});

test('Test that a deeply nested object survives a flatten then rebuild round trip.', () => {
  const source = { a: { b: { c: { d: { e: 5 } } } }, flag: true };
  const flat = objectFlatten(source);

  assert.deepStrictEqual(flat, {
    '{$.a.b.c.d.e}': 5,
    '{$.flag}': true,
  });

  const sanitised: Record<string, unknown> = {};
  for (const key in flat) {
    sanitised[key.substring(3, key.length - 1)] = (flat as Record<string, unknown>)[key];
  }

  assert.deepStrictEqual(objectCreateFromPath(sanitised), source);
});

test('Test that objectFlatten keeps a null leaf but walks into nested objects.', () => {
  assert.deepStrictEqual(objectFlatten({ a: null, b: { c: 1, d: { e: 2 } } }), {
    '{$.a}': null,
    '{$.b.c}': 1,
    '{$.b.d.e}': 2,
  });
});

test('Test that objectFlatten drops nested undefined leaves.', () => {
  // objectMerge skips undefined, so an undefined value nested inside an
  // object disappears from the flattened map.
  assert.deepStrictEqual(objectFlatten({ a: 1, b: { c: undefined } }), {
    '{$.a}': 1,
  });
});

test('Test that objectCreateFromPath expands a key that already contains dots.', () => {
  assert.deepStrictEqual(objectCreateFromPath({ 'a.b.c': 1 }), {
    a: { b: { c: 1 } },
  });
});

test('Test that objectMerge deep merges plain objects and overwrites scalars.', () => {
  const source = { a: { x: 1, y: 2 }, b: 'old' };
  const merged = objectMerge(source, { a: { y: 20, z: 3 }, b: 'new' });

  assert.deepStrictEqual(merged, {
    a: { x: 1, y: 20, z: 3 },
    b: 'new',
  });
});

test('Test that objectMerge skips undefined values on the target.', () => {
  assert.deepStrictEqual(objectMerge({ a: 1, b: 2 }, { b: undefined, c: 3 }), {
    a: 1,
    b: 2,
    c: 3,
  });
});

test('Test that objectMerge replaces a whole array rather than merging it as an object.', () => {
  assert.deepStrictEqual(objectMerge({ list: [1, 2, 3] }, { list: [9] }), {
    list: [9, 2, 3],
  });
});
