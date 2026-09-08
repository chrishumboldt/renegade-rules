import { isArray, isPlainObject, isUnsafeKey } from './is';

export function objectClone<T>(source: T): T {
  if (isArray(source)) {
    return objectCloneArray(source as any[]) as T;
  } else if (isPlainObject(source)) {
    return objectCloneObject(source as Record<string, any>) as T;
  } else {
    return source;
  }
}

function objectCloneArray(source: any[]): any[] {
  const returnItem: any[] = [];

  for (let item of source) {
    returnItem.push(objectClone(item));
  }

  return returnItem;
}

function objectCloneObject(source: Record<string, any>): Record<string, any> {
  const newObject: Record<string, any> = {};

  for (let key in source) {
    if (source[key] === undefined || isUnsafeKey(key)) continue;

    newObject[key] = objectClone(source[key]);
  }

  return newObject;
}

// This function will take in a map of "flat" paths that point to a
// property on an object along with the corresponding value. We can take
// that map and now turn it into a new object.
export function objectCreateFromPath(
  input: Record<string, any>,
): Record<string, any> {
  let newObject = {}

  for (let key in input) {
    const keySplit = key.split('.').filter(item => item !== '$')

    // Never let an untrusted path reach into the prototype chain.
    if (keySplit.some(isUnsafeKey)) continue

    let ref: Record<string, any> = newObject

    keySplit.forEach((property, index) => {
      if (index === keySplit.length - 1) {
        // Since we are at the end of the path, we can safely apply the
        // actual value.
        ref[property] = input[key]
      } else {
        // Only descend into an existing plain object, otherwise start a
        // fresh one. A falsy leaf such as 0 or false is replaced rather
        // than treated as "already there".
        if (!isPlainObject(ref[property])) {
          ref[property] = {}
        }
        // Pass the reference to the nesting so we can continue to generate.
        ref = ref[property]
      }
    })
  }

  return newObject
}


export function objectFlatten<T = unknown>(
  input: Record<string, any>,
  parentKey?: string,
): Record<string, T> {
  let result: Record<string, T> = {}

  for (const key in input) {
    if (isUnsafeKey(key)) continue

    const innerParentKey = parentKey ? `${parentKey}.${key}` : key

    // Only walk plain objects. Arrays and built ins stay whole as leaf
    // values so they survive a flatten/rebuild round trip.
    if (isPlainObject(input[key])) {
      const innerResult = objectFlatten(
        input[key],
        innerParentKey,
      )

      result = objectMerge(result, innerResult)
    } else {
      result[`{$.${innerParentKey}}`] = input[key]
    }
  }

  return result
}

export function objectMerge<T = Record<string, any>>(
  source: Record<string, any>,
  target: Record<string, any>,
): T {
  for (let key in target) {
    if (target[key] === undefined || isUnsafeKey(key)) continue

    source[key] = objectReplaceValue(source[key], target[key])
  }

  return source as T
}

function objectReplaceValue(value: any, nextValue: any) {
  if (isArray(value) && isArray(nextValue)) {
    nextValue.forEach((item: any, index: number) => {
      value[index] = objectReplaceValue(value[index], item)
    })

    return value
  }

  // Merge deeper plain objects.
  if (isPlainObject(value) && isPlainObject(nextValue)) {
    return objectMerge(value, nextValue)
  }

  return nextValue
}
