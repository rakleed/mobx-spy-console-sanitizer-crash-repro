const MOBX_DEVTOOLS_GLOBAL_HOOK_KEY = '__MOBX_DEVTOOLS_GLOBAL_HOOK__';
const MOBX_SPY_EVENT_LOG_PREFIX = '[mobx-spy-console hook repro]';

type MobxSpyEvent = Record<string, unknown>;

type MobxInstance = {
  spy?: (listener: (event: MobxSpyEvent) => void) => () => void;
};

type MobxCollection = {
  mobx?: MobxInstance;
};

type MobxDevtoolsHook = {
  hookVersion: number;
  collections: Record<string, MobxCollection>;
  inject: (collection: MobxCollection) => void;
  injectMobx: (mobx: MobxInstance) => void;
  _listeners: Record<string, Array<(data: string) => void> | undefined>;
  sub: (eventName: string, listener: (data: string) => void) => () => void;
  on: (eventName: string, listener: (data: string) => void) => void;
  off: (eventName: string, listener: (data: string) => void) => void;
  emit: (eventName: string, data: string) => void;
};

declare global {
  interface Window {
    __MOBX_DEVTOOLS_GLOBAL_HOOK__?: MobxDevtoolsHook;
  }
}

function sanitize(value: unknown, depth: number, seen: WeakSet<object>): unknown {
  if (depth > 7) {
    return '[...]';
  }

  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'function') {
    return '[function]';
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack?.split('\n').slice(0, 6),
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item, depth + 1, seen));
  }

  if (value instanceof Map) {
    return {
      type: 'Map',
      size: value.size,
      entries: Array.from(value.entries()).map(([key, entryValue]) => [
        sanitize(key, depth + 1, seen),
        sanitize(entryValue, depth + 1, seen),
      ]),
    };
  }

  if (value instanceof Set) {
    return {
      type: 'Set',
      size: value.size,
      values: Array.from(value.values())
        .slice(0, 15)
        .map((entryValue) => sanitize(entryValue, depth + 1, seen)),
    };
  }

  if (typeof value === 'object') {
    if (seen.has(value)) {
      return '[circular]';
    }

    seen.add(value);

    const output: Record<string, unknown> = {};

    Object.keys(value).forEach((key) => {
      if (key === '$mobx') {
        return;
      }

      output[key] = sanitize((value as Record<string, unknown>)[key], depth + 1, seen);
    });

    seen.delete(value);

    return output;
  }

  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return String(value);
  }
}

function setupMobxHook(): MobxDevtoolsHook {
  const existingHook = window.__MOBX_DEVTOOLS_GLOBAL_HOOK__;

  if (existingHook?.collections) {
    return existingHook;
  }

  const hook: MobxDevtoolsHook = {
    hookVersion: 1,
    collections: {},
    inject(collection) {
      const mobxId = 'repro';

      this.collections[mobxId] = {
        ...this.collections[mobxId],
        ...collection,
      };

      this.emit('instances-injected', mobxId);
    },
    injectMobx(mobx) {
      this.inject({ mobx });
    },
    _listeners: {},
    sub(eventName, listener) {
      this.on(eventName, listener);

      return () => {
        this.off(eventName, listener);
      };
    },
    on(eventName, listener) {
      this._listeners[eventName] ??= [];
      this._listeners[eventName]?.push(listener);
    },
    off(eventName, listener) {
      const listeners = this._listeners[eventName];

      if (!listeners) {
        return;
      }

      const listenerIndex = listeners.indexOf(listener);

      if (listenerIndex !== -1) {
        listeners.splice(listenerIndex, 1);
      }
    },
    emit(eventName, data) {
      this._listeners[eventName]?.forEach((listener) => {
        listener(data);
      });
    },
  };

  window.__MOBX_DEVTOOLS_GLOBAL_HOOK__ = hook;

  return hook;
}

function setupSpyDisposers(hook: MobxDevtoolsHook): void {
  const spyDisposers: Record<string, (() => void) | undefined> = {};

  function attachSpyForMobx(mobx: MobxInstance | undefined, mobxId: string): void {
    if (!mobx || typeof mobx.spy !== 'function' || spyDisposers[mobxId]) {
      return;
    }

    spyDisposers[mobxId] = mobx.spy((event) => {
      if (event.type === 'report-end') {
        return;
      }

      console.log(MOBX_SPY_EVENT_LOG_PREFIX, sanitize(event, 0, new WeakSet()));
    });
  }

  hook.sub('instances-injected', (mobxId) => {
    attachSpyForMobx(hook.collections[mobxId]?.mobx, mobxId);
  });
}

setupSpyDisposers(setupMobxHook());

export {};