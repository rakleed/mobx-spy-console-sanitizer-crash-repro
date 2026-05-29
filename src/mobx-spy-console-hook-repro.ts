type MobxSpyEvent = Record<string, unknown>;

type MobxInstance = {
  spy?: (listener: (event: MobxSpyEvent) => void) => () => void;
};

declare global {
  interface Window {
    __MOBX_DEVTOOLS_GLOBAL_HOOK__?: {
      injectMobx: (mobx: MobxInstance) => void;
    };
  }
}

function sanitize(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value !== 'object') {
    return value;
  }

  const output: Record<string, unknown> = {};

  Object.keys(value).forEach((key) => {
    output[key] = sanitize((value as Record<string, unknown>)[key]);
  });

  return output;
}

window.__MOBX_DEVTOOLS_GLOBAL_HOOK__ = {
  injectMobx(mobx) {
    mobx.spy?.((event) => {
      if (event.type === 'report-end') {
        return;
      }

      console.log('[mobx-spy-console hook repro]', sanitize(event));
    });
  },
};

export {};
