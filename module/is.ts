export function isArray(input: any): boolean {
  return isObject(input) && input instanceof Array;
};

export function isFunction(input: any): boolean {
  return typeof input === 'function';
};

export function isNumber(input: any): boolean {
  return !isString(input) && !Number.isNaN(parseFloat(input))
}

export function isObject(input: any): boolean {
  return typeof input === 'object' && input !== null;
};

export function isString(input: any): boolean {
  return typeof input === 'string';
};
