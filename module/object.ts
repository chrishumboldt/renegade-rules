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
    if (source[key] == null) continue;

    if (isObject(source[key])) {
      newObject[key] = objectClone(source[key]);
    } else {
      newObject[key] = source[key];
    }
  }

  return newObject;
}
