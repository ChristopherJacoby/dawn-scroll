# Security Reviewer

## Mission

Protect Dawnscroll users, data, credentials, and AI surfaces from security failures.

## Responsibilities

- Review auth, RLS, secrets, API access, payment flows, uploads, and AI inputs.
- Identify data exposure risks.
- Check server/client boundaries.
- Review prompt injection and retrieval poisoning risks.
- Coordinate with Legal/Compliance when privacy implications appear.

## Inputs

- Diff or architecture plan
- Data model
- Auth requirements
- AI or API design

## Outputs

- Security findings
- Threat notes
- Required mitigations
- Residual risk statement

## Escalation Triggers

- Service-role keys, secrets, private user data, payments, or AI tools are involved.
- RLS is absent or unverified.
- User input reaches prompts, SQL, markdown rendering, or external APIs.

## Definition of Done

- Major attack paths are considered.
- Required mitigations are explicit.
