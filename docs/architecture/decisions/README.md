# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) for the MuslimEEN platform. ADRs capture significant architectural decisions, their context, consequences, and the alternatives considered.

## What is an ADR?

An Architecture Decision Record (ADR) captures an important architectural decision made along with its context and consequences. An ADR is a document that:

- Describes the architectural decision
- Explains the context in which the decision was made
- Documents the consequences (positive and negative) of the decision
- Lists alternatives that were considered
- Provides references to related documentation

## ADR Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [ADR-001](./ADR-001-modular-architecture.md) | Modular Architecture with Feature Flags | Accepted | 2026-02 |
| [ADR-002](./ADR-002-typescript-strict.md) | TypeScript Strict Mode | Accepted | 2026-02 |
| [ADR-003](./ADR-003-postgresql.md) | PostgreSQL as Primary Database | Accepted | 2026-02 |
| [ADR-004](./ADR-004-jwt-authentication.md) | JWT Authentication | Accepted | 2026-02 |
| [ADR-005](./ADR-005-repository-pattern.md) | Repository Pattern for Data Access | Accepted | 2026-02 |

## Status Definitions

- **Proposed**: The decision has been proposed but not yet accepted
- **Accepted**: The decision has been accepted and is being implemented
- **Deprecated**: The decision was previously accepted but is no longer relevant
- **Superseded by ADR-XXX**: The decision has been replaced by a newer ADR

## Contributing

When proposing a new ADR:

1. Create a new file following the naming convention: `ADR-XXX-short-description.md`
2. Use the template below
3. Update this README to include the new ADR in the index
4. Submit for review following the project's contribution guidelines

## ADR Template

```markdown
# ADR-XXX: Title

## Status
- Proposed / Accepted / Deprecated / Superseded by ADR-XXX

## Context
What is the issue that we're seeing that is motivating this decision or change?

## Decision
What is the change that we're proposing or have agreed to implement?

## Consequences
What becomes easier or more difficult to do and any risks introduced by the change.

### Positive
- Benefit 1
- Benefit 2

### Negative
- Drawback 1
- Drawback 2

## Alternatives Considered
- Alternative 1: Why rejected
- Alternative 2: Why rejected

## References
- Links to relevant documentation
- Related ADRs
```

## Related Documentation

- [Architecture Diagram](../../ARCHITECTURE_DIAGRAM.md)
- [Architectural Analysis](../../ARCHITECTURAL_ANALYSIS.md)
- [API Contract](../../API_CONTRACT.md)
- [Backend README](../../BACKEND_README.md)
- [AGENTS.md](../../AGENTS.md) - Agent development guide

---

**Last Updated**: March 2026
