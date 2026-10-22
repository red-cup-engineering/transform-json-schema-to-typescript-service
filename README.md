# Transform JSON Schema to TypeScript Service

<!-- 561-group-standards:badges:start -->
[![Red Cup Engineering](https://img.shields.io/badge/561%20Group-Red%20Cup%20Engineering-c0392b)](https://github.com/red-cup-engineering)
[![License: MIT](https://img.shields.io/badge/license-MIT-c0392b)](LICENSE)
[![Indigenous data: CARE](https://img.shields.io/badge/Indigenous%20data-CARE-4b6f44)](https://github.com/red-cup-engineering/.github/blob/main/GOVERNANCE.md)
[![Tips welcome](https://img.shields.io/badge/tips-welcome-d4a017)](https://github.com/561-group/.github/blob/main/TIPS.md)
<!-- 561-group-standards:badges:end -->

Purely transforms a JSON Schema literal into TypeScript source. It supports
`const`, `enum`, `anyOf`, `oneOf`, object properties and required keys, arrays
(including tuple `items`), primitive `type` values, and local `#/$defs` refs.
It neither reads files nor validates values.

```js
import { transformJsonSchemaToTypescript } from "@red-cup-engineering/transform-json-schema-to-typescript-service";

const source = transformJsonSchemaToTypescript(
  { title: "Message", type: "object", required: ["body"], properties: { body: { type: "string" } } },
);
// export type Message = { readonly "body": string; };
```

`./types` provides `FromJsonSchema<S>` for TypeScript code that needs the
equivalent type-level reading of an `as const` schema literal.
