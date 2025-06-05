export type Awaitable<T> = T | Promise<T>

export type SetRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>
