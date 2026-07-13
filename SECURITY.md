# Security Policy

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Report privately via GitHub's [Security Advisories](https://github.com/apwn/brandrail/security/advisories/new)
(Security → Report a vulnerability), or email the maintainer listed on the
GitHub profile. Include a description, reproduction steps, and impact. We aim to
acknowledge within 72 hours.

## Scope

This repository holds the open-source packages and the playground app. The
rendering/compiling engine and any hosted service are separate — flag anything
that looks cross-cutting and we'll route it.

## Handling secrets

Brandrail never commits secrets. API keys, session secrets, and provider keys
live only in gitignored `.env` files. If you believe a secret was committed,
report it privately as above — do not open a public issue or PR referencing it.

## Supported versions

Brandrail is pre-1.0; security fixes land on `main`. Pin a commit if you need
stability.
