export const isArray = (check: any): boolean => {
  return isObject(check) && check instanceof Array
}

export const isFunction = (check: any): boolean => {
  return typeof check === 'function'
}

export const isObject = (check: any): boolean => {
  return typeof check === 'object'
}

export const isString = (check: any): boolean => {
  return typeof check === 'string'
}

