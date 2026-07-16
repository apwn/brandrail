# @brandrail/sdk

Typed TypeScript client for the Brandrail REST API. It covers BrandSpecs, deterministic renders, template families, content programs, durable agent runs, human review, controlled publishing, campaigns, usage, analytics, and audit.

```ts
import { Brandrail } from "@brandrail/sdk";

const brandrail = new Brandrail({
  apiKey: process.env.BRANDRAIL_API_KEY,
});

const { spec } = await brandrail.compile("https://acme.com");
const render = await brandrail.render(spec.meta.name, "Summer promotion", {
  formats: ["li-image"],
});
```

The default endpoint is `https://api.brandrail.dev`. Override it with `apiUrl`, `BRANDRAIL_API_URL`, or `RENDER_API_URL`. Errors are raised as `BrandrailError`; a `422` includes structured BrandSpec violations.

See the [developer documentation](https://playground.brandrail.dev/docs) and [security policy](https://github.com/apwn/brandrail/security/policy).
