# mobx-spy-console sanitizer crash repro

Minimal browser reproduction for the `mobx-spy-console` unsafe sanitizer crash from
https://github.com/fe-dudu/mobx-spy-console/issues/1.

## Steps

```sh
npm install
npm run dev
```

Open the page and click **Trigger unsafe sanitize crash**.

## Actual result

The page logs the same sanitizer crash:

```text
Uncaught TypeError: Cannot read properties of undefined (reading 'get')
    at ObservableObjectAdministration.getObservablePropValue_
    at SiteMapStore.get [as map]
    at sanitize
```

## Expected result

The spy event should be serialized without invoking MobX accessors on `event.object`, and sanitizer failures should not
escape the spy callback.

## Reproduction details

The repro installs a small `__MOBX_DEVTOOLS_GLOBAL_HOOK__` implementation in
`src/mobx-spy-console-hook-repro.ts`. It intentionally uses the old unsafe sanitizer behavior:

```ts
output[key] = sanitize((value as Record<string, unknown>)[key], depth + 1, seen);
```

The app creates a `SiteMapStore` with an enumerable MobX accessor named `map`, removes the matching MobX
administration value, and then triggers a MobX spy event. The unsafe sanitizer walks `event.object`, reads
`event.object.map`, and throws.

The extension fix is to serialize own data descriptors instead of invoking getters, and to keep sanitizer errors from
escaping the spy callback.

## StackBlitz

https://stackblitz.com/github/rakleed/mobx-spy-console-sanitizer-crash-repro
