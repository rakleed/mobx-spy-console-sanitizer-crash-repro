# MobX + Vite/Rolldown invalid pure annotation reproduction

Minimal reproduction for a Rolldown warning/error caused by a `/*#__PURE__*/` annotation in the published MobX ESM bundle.

It also contains a browser reproduction for the `mobx-spy-console` unsafe sanitizer crash from
https://github.com/fe-dudu/mobx-spy-console/issues/1.

## Steps

```sh
npm install
npm run build
```

## Actual result

The build reports:

```text
[INVALID_ANNOTATION] A comment "/*#__PURE__*/" in "node_modules/mobx/dist/mobx.esm.js" contains an annotation that Rolldown cannot interpret due to the position of the comment.
      ╭─[ node_modules/mobx/dist/mobx.esm.js:5974:54 ]
      │
 5974 │ var maybeIteratorPrototype = ((_getGlobal$Iterator = /*#__PURE__*/getGlobal().Iterator) == null ? void 0 : _getGlobal$Iterator.prototype) || {};
      │                                                      ──────┬──────
      │                                                            ╰──────── comment ignored due to position
      │
      │ Help: For more information on how to use pure annotations correctly, check the documentation: https://rolldown.rs/in-depth/dead-code-elimination#pure
──────╯
```

## Expected result

The project should build successfully without invalid annotation warnings/errors from `mobx/dist/mobx.esm.js`.

## StackBlitz

https://stackblitz.com/github/rakleed/mobx-vite-rolldown-invalid-annotation-repro

## mobx-spy-console sanitizer crash

```sh
npm install
npm run dev
```

Open the page and click **Trigger unsafe sanitize crash**.

The repro installs a small `__MOBX_DEVTOOLS_GLOBAL_HOOK__` implementation in
`src/mobx-spy-console-hook-repro.ts`. It intentionally uses the old unsafe sanitizer behavior:

```ts
output[key] = sanitize((value as Record<string, unknown>)[key], depth + 1, seen);
```

The app creates a `SiteMapStore` with an enumerable MobX accessor named `map`, removes the matching MobX
administration value, and then triggers a MobX spy event. The unsafe sanitizer walks `event.object`, reads
`event.object.map`, and throws:

```text
Uncaught TypeError: Cannot read properties of undefined (reading 'get')
    at ObservableObjectAdministration.getObservablePropValue_
    at SiteMapStore.get [as map]
    at sanitize
```

The extension fix is to serialize own data descriptors instead of invoking getters, and to keep sanitizer errors from
escaping the spy callback.
