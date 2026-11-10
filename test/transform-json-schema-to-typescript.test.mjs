import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { transformJsonSchemaToTypescript } from "../src/transform-json-schema-to-typescript.mjs";

test("transforms object properties, required keys, and literals", () => {
  const source = transformJsonSchemaToTypescript({
    title: "Message",
    type: "object",
    required: ["kind", "body"],
    properties: {
      kind: { const: "message" },
      body: { type: "string" },
      attempts: { type: "integer" },
    },
  });
  assert.equal(source, 'export type Message = { readonly "kind": "message"; readonly "body": string; readonly "attempts"?: number; };\n');
});

test("transforms unions, tuples, and named local definitions", () => {
  const source = transformJsonSchemaToTypescript({
    type: "object",
    $defs: { Tag: { enum: ["left", "right"] } },
    properties: {
      tag: { $ref: "#/$defs/Tag" },
      pair: { type: "array", items: [{ type: "string" }, { type: "null" }] },
      value: { oneOf: [{ type: "boolean" }, { type: "number" }] },
    },
  }, { typeName: "Envelope" });
  assert.equal(source, 'export type Tag = "left" | "right";\nexport type Envelope = { readonly "tag"?: Tag; readonly "pair"?: readonly [string, null]; readonly "value"?: boolean | number; };\n');
});

test("refuses non-schema inputs and unsafe TypeScript names", () => {
  assert.throws(() => transformJsonSchemaToTypescript(null), /schema must/u);
  assert.throws(() => transformJsonSchemaToTypescript({}, { typeName: "not-a-name" }), /valid TypeScript identifier/u);
  assert.throws(() => transformJsonSchemaToTypescript({ $defs: { "not-a-name": {} } }), /\$defs key/u);
});


test("the installed type helper resolves as an ESM declaration", async t => {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const temporary = await mkdtemp(join(tmpdir(), "schema-types-consumer-"));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  const npm = (...args) => execFileSync("npm", args, { cwd: root, encoding: "utf8", stdio: "pipe" });
  const [packed] = JSON.parse(npm("pack", "--ignore-scripts", "--json", "--pack-destination", temporary));
  await writeFile(join(temporary, "package.json"), '{"private":true,"type":"module"}\n');
  execFileSync("npm", ["install", "--offline", "--ignore-scripts", "--no-audit", "--no-fund",
    join(temporary, packed.filename)], { cwd: temporary, stdio: "pipe" });
  const consumer = join(temporary, "check.mjs");
  await writeFile(consumer, [
    'import assert from "node:assert/strict";',
    'import { access } from "node:fs/promises";',
    'const target = new URL(import.meta.resolve("@red-cup-engineering/transform-json-schema-to-typescript-service/types"));',
    'assert.ok(target.pathname.endsWith("/types.d.mts"));',
    'await access(target);',
  ].join("\n"));
  execFileSync(process.execPath, ["--conditions=types", consumer], { cwd: temporary, stdio: "pipe" });
});
