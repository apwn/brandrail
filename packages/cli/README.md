# brandrail

CLI for humans and automation: compile BrandSpecs, render assets, manage versioned templates and content programs, coordinate durable agent runs, resume human review, and safely schedule publishing.

```sh
export BRANDRAIL_API_URL=https://api.brandrail.dev
export BRANDRAIL_API_KEY='brk_…'

brandrail compile https://acme.com
brandrail render "Summer promotion" --brand acme --json
brandrail agent start "Launch campaign" --brand acme --json
brandrail mcp doctor
```

Use `--json` for machine-readable output. Publishing supports an explicit dry-run and requires approved work or user confirmation. Run `brandrail --help` for the complete command surface.

See the [developer documentation](https://playground.brandrail.dev/docs) and [security policy](https://github.com/apwn/brandrail/security/policy).
