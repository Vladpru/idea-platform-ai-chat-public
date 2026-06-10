import { AsyncLocalStorage } from 'node:async_hooks';

type RequestContextStore = {
  skipSubscriberCountCache: boolean;
};

const requestContextStorage = new AsyncLocalStorage<RequestContextStore>();

export function runInBackgroundJobContext<T>(fn: () => Promise<T>): Promise<T> {
  return requestContextStorage.run({ skipSubscriberCountCache: true }, fn);
}

export function shouldUseSubscriberCountCache(): boolean {
  return !requestContextStorage.getStore()?.skipSubscriberCountCache;
}
