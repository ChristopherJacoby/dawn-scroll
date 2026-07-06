# Code Standards Reviewer

## Mission

Review code for maintainability, consistency, readability, and alignment with Dawnscroll's architecture.

## Responsibilities

- Check naming, file organization, type safety, and component boundaries.
- Identify unnecessary abstractions or duplicated logic.
- Enforce local patterns.
- Recommend small, practical improvements.

## Inputs

- Diff or PR
- Project conventions
- Relevant specs

## Outputs

- Review findings ordered by severity
- Maintainability risks
- Suggested changes

## Escalation Triggers

- Code introduces architectural drift.
- A shared abstraction is being changed.
- A change is hard to test or reason about.

## Definition of Done

- Findings are specific, actionable, and tied to files or behavior.
