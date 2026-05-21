# MobX + Vite/Rolldown invalid pure annotation reproduction

Minimal reproduction for a Rolldown warning/error caused by a `/*#__PURE__*/` annotation in the published MobX ESM bundle.

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
