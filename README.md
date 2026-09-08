# Renegade Rules

Business logic that turns some values into another value, a discount tier from a
cart total, a permission from a role, a status from a set of flags, tends to grow
into nested `if` statements that are hard to read and harder to change safely.
Renegade Rules lets you write that logic as data instead. A rule set is a plain
object that says "this path becomes this value when this sentence is true", and
the sentences read close to English.

You describe each output as a target path, an optional default, and an ordered
list of `if ...` conditions. `rules()` compiles that description once.
`run(state)` then takes a plain object of inputs, flattens it, resolves every
rule, and hands back a new object with the resolved values folded in. The input
object is never mutated and the same compiled engine can be run against as many
different states as you like.

Rules can lean on each other. If one rule's target path appears inside another
rule's condition, the first is treated as a dependency and resolved earlier in
the same run. A cycle in those references is detected and reported rather than
looped over.

- [Installation](#installation)
- [A First Rule](#a-first-rule)
- [State](#state)
- [The Condition Grammar](#the-condition-grammar)
- [Operators](#operators)
- [Multiple Conditions](#multiple-conditions)
- [Defaults And Precedence](#defaults-and-precedence)
- [Dependencies Between Rules](#dependencies-between-rules)
- [The Run Result](#the-run-result)
- [Inspecting Parsed Rules](#inspecting-parsed-rules)
- [Checking A Single Condition](#checking-a-single-condition)
- [Debug Mode](#debug-mode)
- [Errors](#errors)
- [Grammar Limitations](#grammar-limitations)
- [Functions](#functions)
- [Environment](#environment)

#### Installation

```bash
npm install @renegaderocks/rules
```

```javascript
import { rules } from '@renegaderocks/rules'
```

#### A First Rule

A rule set maps a target path to a rule item. Each rule item has an optional
`default` and an ordered `rules` object whose keys are `if ...` sentences and
whose values carry the `result` to apply when that sentence holds.

```javascript
import { rules } from '@renegaderocks/rules'

const engine = rules({
  '{$.lightsaberColour}': {
    default: 'green',
    rules: {
      'if {$.age} greater 30': { result: 'red' },
    },
  },
})

engine.run({ age: 45 }).result
// { age: 45, lightsaberColour: 'red' }

engine.run({ age: 9 }).result
// { age: 9, lightsaberColour: 'green' }
```

The target path is written as a pointer, `{$.` followed by a dotted path and a
closing `}`. The same pointer notation is how a condition reads a value out of
state. Any input you passed that no rule touched, `age` above, is carried
straight through to the result.

#### State

The state you hand to `run()` is an ordinary nested object. It gets flattened
into pointer keys internally and rebuilt into a nested object on the way out, so
a condition can reach any depth.

```javascript
const engine = rules({
  '{$.user.rank}': {
    default: 'Padawan',
    rules: {
      'if {$.user.age} greater/equals 18 and {$.user.trained} equals true': {
        result: 'Jedi Knight',
      },
    },
  },
})

engine.run({ user: { age: 25, trained: true } }).result
// { user: { age: 25, trained: true, rank: 'Jedi Knight' } }
```

Arrays and built in objects such as `Date` are kept whole as leaf values. They
pass through a run unchanged and can be used with `includes` and `excludes`.

```javascript
const engine = rules({
  '{$.canEnterCouncil}': {
    default: false,
    rules: {
      'if {$.roles} includes master': { result: true },
    },
  },
})

engine.run({ roles: ['knight', 'master'] }).result
// { roles: ['knight', 'master'], canEnterCouncil: true }
```

#### The Condition Grammar

Every key in a `rules` object is a sentence of the form:

```
if <term> [and <term> [and <term> ...]]
```

Each `<term>` is three parts separated by single spaces:

```
<check> <operator> <against>
```

- `<check>` is a single token. When it starts with `{$.` it is read from state,
  otherwise it is used as a literal string.
- `<operator>` is one of the nine names in the next section.
- `<against>` is everything after the operator. It is joined back together with
  spaces, so it may contain spaces (`equals Darth Vader`). It is then read as:
  - `true` or `false` becomes a boolean.
  - An ordinary decimal literal (`30`, `-2`, `4.5`) becomes a number. Tokens
    like `007`, `1e3` or `0x10` stay strings so identifiers and codes are not
    quietly turned into numbers.
  - A `{$.` pointer is read from state when the condition runs.
  - Anything else stays a string.

```javascript
const engine = rules({
  '{$.title}': {
    default: 'Anakin Skywalker',
    rules: {
      'if {$.fallen} equals true': { result: 'Darth Vader' },
    },
  },
})

engine.run({ fallen: true }).result
// { fallen: true, title: 'Darth Vader' }
```

#### Operators

| Operator         | True when                                                              |
| ---------------- | ---------------------------------------------------------------------- |
| `equals`         | `check` is strictly equal to `against`.                                |
| `greater`        | `check` is greater than `against`.                                     |
| `greater/equals` | `check` is greater than or equal to `against`.                         |
| `less`           | `check` is less than `against`.                                        |
| `less/equals`    | `check` is less than or equal to `against`.                            |
| `startsWith`     | `check` is a string that starts with `against`.                        |
| `endsWith`       | `check` is a string that ends with `against`.                          |
| `includes`       | `check` is a string or array that contains `against`.                  |
| `excludes`       | `check` does not contain `against`, or cannot contain anything at all. |

`greater`, `less`, `greater/equals` and `less/equals` use the native comparison,
so strings are ordered lexicographically.

```javascript
const engine = rules({
  '{$.needsHaircut}': {
    default: false,
    rules: {
      'if {$.name} startsWith Chewb': { result: true },
    },
  },
})

engine.run({ name: 'Chewbacca' }).result
// { name: 'Chewbacca', needsHaircut: true }
```

A reference that is missing from state reads as `undefined`, so `includes`
returns `false`, `excludes` returns `true`, and the ordering operators return
`false` rather than throwing.

#### Multiple Conditions

Terms joined by `and` all have to hold for the rule to fire. There is no `or`.
To express alternatives, list more than one rule. They are tried in declaration
order and the first one that holds wins.

```javascript
const engine = rules({
  '{$.threatLevel}': {
    default: 'none',
    rules: {
      'if {$.force} equals true and {$.army} greater 1000': { result: 'sith' },
      'if {$.force} equals true': { result: 'jedi' },
    },
  },
})

engine.run({ force: true, army: 5000 }).result.threatLevel
// 'sith'

engine.run({ force: true, army: 3 }).result.threatLevel
// 'jedi'
```

If the first rule sat below the second, `jedi` would always match first and
`sith` would never be reached, so order is part of the meaning.

#### Defaults And Precedence

A target path takes its value from the first source that has one, in this order:

1. A rule that fires.
2. A value the caller already passed in `state` for that path.
3. The rule item's `default`.

The default only fills a gap. It never overwrites a value you supplied.

```javascript
const engine = rules({
  '{$.midichlorians}': {
    default: 5000,
    rules: {
      'if {$.chosenOne} equals true': { result: 20000 },
    },
  },
})

engine.run({}).result
// { midichlorians: 5000 }              (the default)

engine.run({ midichlorians: 12000 }).result
// { midichlorians: 12000 }             (your value beats the default)

engine.run({ chosenOne: true }).result
// { chosenOne: true, midichlorians: 20000 }   (a rule beats both)
```

If no rule fires, there is no default, and you passed nothing, the path is left
out of the result entirely.

#### Dependencies Between Rules

When a condition reads a pointer that is itself a target path in the same rule
set, that target is a dependency. It is resolved first, so a rule always sees
the settled value of anything it depends on, whatever order you wrote the rules
in.

```javascript
const engine = rules({
  '{$.lightsaberColour}': {
    default: 'blue',
    rules: {
      'if {$.title} equals Darth Vader': { result: 'red' },
    },
  },
  '{$.title}': {
    default: 'Anakin Skywalker',
    rules: {
      'if {$.fallen} equals true': { result: 'Darth Vader' },
    },
  },
})

const output = engine.run({ fallen: true })

output.result
// { fallen: true, title: 'Darth Vader', lightsaberColour: 'red' }

output.rulesRun
// ['{$.title}', '{$.lightsaberColour}']
```

`{$.lightsaberColour}` is written first but `{$.title}` runs first because the
colour rule depends on it. A shared dependency in a wider graph is resolved once
and reused.

If two rules end up depending on each other, directly or through a chain, the
run stops and reports it.

```javascript
const engine = rules({
  '{$.age}': {
    rules: { 'if {$.name} equals Darth Vader': { result: 45 } },
  },
  '{$.name}': {
    rules: { 'if {$.age} greater 40': { result: 'Darth Vader' } },
  },
})

engine.run({}).errors
// ['There is a circular dependency with {$.name}->{$.age}->{$.name}.']
```

The cycle is found from the reference graph, so it is reported even in cases
where the conditions themselves would have settled without looping.

#### The Run Result

`run(state, debug?)` returns an object with three fields:

```javascript
const output = engine.run({ fallen: true })

output.result
// the resolved state, rebuilt into a nested object

output.rulesRun
// string[] of the target paths that executed, dependency first,
// each in '{$.path}' form

output.errors
// present only on failure, a string[] describing what went wrong.
// When it is present the run stopped early and `result` holds whatever
// resolved before that point.
```

`run()` does not mutate the `state` argument and returns a fresh object every
call.

#### Inspecting Parsed Rules

`rules()` also exposes `parse`, the fully expanded form of the rule set. Each
`if ...` string is turned into a list of `conditions`, and any rule item that
depends on another carries a `dependencies` array. It is handy for debugging a
rule set that is not behaving as expected.

```javascript
const engine = rules({
  '{$.grade}': {
    default: 'F',
    rules: { 'if {$.score} greater/equals 50': { result: 'P' } },
  },
})

engine.parse
// {
//   '{$.grade}': {
//     default: 'F',
//     rules: {
//       'if {$.score} greater/equals 50': {
//         result: 'P',
//         conditions: [
//           { against: 50, check: '{$.score}', operator: 'greater/equals' },
//         ],
//       },
//     },
//   },
// }
```

#### Checking A Single Condition

`checkCondition` evaluates one already parsed condition against a flat state map,
where the keys are in `{$.path}` form. It is the primitive the engine uses and
is exported for tests and custom evaluation. The `against` value here is passed
already parsed, a number or boolean rather than the raw token.

```javascript
import { checkCondition } from '@renegaderocks/rules'

checkCondition(
  { check: '{$.age}', operator: 'greater/equals', against: 18 },
  { '{$.age}': 21 },
)
// true

checkCondition(
  { check: '{$.roles}', operator: 'includes', against: 'master' },
  { '{$.roles}': ['knight'] },
)
// false
```

#### Debug Mode

Pass `true` as the second argument to `run()` to log the parsed rules and the
final result to the console. The return value is exactly the same as a normal
run.

```javascript
engine.run({ fallen: true }, true)
```

#### Errors

`rules()` throws while compiling when a rule set cannot be made sense of:

- A condition that does not start with `if `.
- A condition that uses an operator outside the nine listed above.
- Definitions that are not a plain object.

A circular dependency does not throw. It comes back on `output.errors` and the
run halts at that point.

A condition that reads a state value which is not there does not throw either.
It resolves as described in [Operators](#operators).

#### Grammar Limitations

- There is no `or`. Use several rules and rely on first match wins.
- The parser breaks a sentence into terms at every `and` that has a space on
  both sides, so an `against` value cannot contain the word `and` between two
  other words.
- Tokens are split on single spaces. Two spaces in a row produce an empty
  operator and `rules()` throws.
- There is no quoting or escaping.
- `check` and `operator` are always single tokens. Only `against` may hold
  spaces.

#### Functions

| Function                          | Description                                                                 |
| --------------------------------- | --------------------------------------------------------------------------- |
| `rules(definitions)`              | Compile a rule set. Returns `{ parse, run }`, or throws on a malformed set. |
| `[engine].run(state, debug)`      | Resolve `state` against the rules. Returns `{ result, rulesRun, errors? }`. |
| `[engine].parse`                  | The rule set expanded into materialised conditions and dependency lists.    |
| `checkCondition(condition, flat)` | Evaluate one parsed condition against a flat `{$.path}` state map.          |

#### Environment

The package ships as CommonJS with TypeScript declarations and runs on Node 18
and up as well as in the browser. The evaluation path is plain functions with no
Node built ins. Debug logging uses `util` when it is available and falls back to
`JSON` elsewhere.
