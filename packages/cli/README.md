# brandrail

CLI for humans and automation: compile BrandSpecs, render assets, manage versioned templates and content programs, coordinate durable agent runs, resume human review, and safely schedule publishing.

```sh
export BRANDRAIL_API_URL=https://api.brandrail.dev
read -rsp 'Brandrail API key: ' BRANDRAIL_API_KEY; printf '\n'; export BRANDRAIL_API_KEY

brandrail compile https://acme.com
brandrail render "Summer promotion" --brand acme --json
brandrail agent start "Launch campaign" --brand acme --json
brandrail mcp doctor
```

Use `--json` for machine-readable output. Durable runs pause for plan approval in the Brandrail workspace. Agent publishing supports an explicit dry-run and requires an approved review item. Run `brandrail --help` for the complete command surface.

See the [developer documentation](https://playground.brandrail.dev/docs) and [security policy](https://github.com/apwn/brandrail/security/policy).
