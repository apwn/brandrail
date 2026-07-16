# @brandrail/spec

The portable BrandSpec schema and TypeScript toolkit: validation, canonical serialization, semantic diffs, inheritance, template contracts, and shared format metadata.

```ts
import { parse, validate, diff, stringify } from "@brandrail/spec";

const spec = parse(input);
const violations = validate(spec);
const canonical = stringify(spec);
```

Read the complete [BrandSpec format](./SPEC.md). The package is MIT-licensed so BrandSpecs can travel across tools and vendors.
