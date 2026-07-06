# Dawnscroll Agent Directory

This directory defines the specialist agents used to plan, build, review, and operate Dawnscroll.

Use the agents as a structured operating system:

1. Route goals through `orchestrator.md`.
2. The orchestrator assigns work to a domain lead.
3. Domain leads brief specialist agents.
4. Specialist outputs return to the domain lead.
5. The orchestrator reconciles conflicts and produces the final plan, PR, document, or decision.

Agents should not all communicate with each other directly. Keep handoffs explicit and artifact-based.

## Domains

- `software/` - implementation, testing, architecture, security, performance, releases.
- `product/` - roadmap, scope, specs, acceptance criteria, backlog, release planning.
- `marketing/` - market research, positioning, pricing, competitors, launch, SEO.
- `bible-data/` - Bible translations, original language data, citations, source reliability.
- `content/` - Roots, Hard Questions, archaeology, editorial quality, fact checking.
- `design/` - UX, reader experience, design system, accessibility, visual QA.
- `business/` - revenue model, compliance, vendor costs, subscriptions, operating risks.

## Standard Agent File Shape

Every agent should define:

- Mission
- Responsibilities
- Inputs
- Outputs
- Escalation triggers
- Definition of done

Use `shared/agent-contract.md` as the baseline contract for all agents.
