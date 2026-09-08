import { isArray, isObject } from '@module/is';

export function objectClone(source: any): any {
  if (isArray(source)) {
    return objectCloneArray(source);
  } else if (isObject(source)) {
    return objectCloneObject(source);
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
    if (source[key] === undefined) continue;

    if (isObject(source[key])) {
      newObject[key] = objectClone(source[key]);
    } else {
      newObject[key] = source[key];
    }
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
    let ref: Record<string, any> = newObject

    keySplit.forEach((property, index) => {
      if (index === keySplit.length - 1) {
        // Since we are at the end of the path, we can safely apply the
        // actual value.
        ref[property] = input[key]
      } else {
        // If the object key does not exist then create it.
        if (!ref[property]) {
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
    const innerParentKey = parentKey ? `${parentKey}.${key}` : key

    if (isObject(input[key])) {
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
    if (target[key] === undefined) continue

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

  // Merge deeper objects.
  if (isObject(value) && isObject(nextValue)) {
    return objectMerge(value, nextValue)
  }

  return nextValue
}


