export function isArray(input: any): boolean {
  return Array.isArray(input)
}

export function isFunction(input: any): boolean {
  return typeof input === 'function'
}

export function isNumber(input: any): boolean {
  return typeof input === 'number' && !Number.isNaN(input)
}

export function isObject(input: any): boolean {
  return typeof input === 'object' && input !== null
}

// A "plain" object is one produced by an object literal or "new Object()".
// Class instances and built ins (Date, Map, RegExp, ...) are excluded so the
// flatten and clone helpers treat them as opaque leaf values.
export function isPlainObject(input: any): boolean {
  if (!isObject(input) || isArray(input)) {
    return false
  }

  const prototype = Object.getPrototypeOf(input)
  return prototype === null || prototype === Object.prototype
}

export function isString(input: any): boolean {
  return typeof input === 'string'
}

// Keys that, written into a nested path, would let a caller reach and mutate
// the prototype chain. Rejected wherever untrusted keys are expanded back into
// an object structure.
export function isUnsafeKey(key: string): boolean {
  return key === '__proto__' || key === 'constructor' || key === 'prototype'
}
