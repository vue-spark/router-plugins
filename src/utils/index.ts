export const assign: typeof Object.assign = Object.assign

export function isString(val: unknown): val is string {
  return typeof val === 'string'
}

export function isFunction(val: unknown): val is (...args: any[]) => any {
  return typeof val === 'function'
}

export const isBrowser = typeof document !== 'undefined'
