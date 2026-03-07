# ADR-002: TypeScript Strict Mode

## Status
- **Accepted**

## Context

MuslimEEN handles sensitive data including:
- User identity information (biometric verification data, witness relationships)
- Financial transactions (Qard Hasan loans, Sadaqah donations, Waqf contributions)
- Trust scores that determine access levels
- Islamic Finance calculations (Zakat, Nisab thresholds, Hawl periods)

In the early prototype phase, several runtime errors occurred that could have been caught at compile time:
1. `undefined` values being passed to Zakat calculation functions, causing incorrect Nisab threshold calculations
2. Type mismatches in database query results leading to malformed API responses
3. Missing property checks on user objects resulting in "cannot read property of undefined" errors in production
4. Incorrect function return types masking error handling issues

Given the platform's commitment to transparency and trust (core platform immutables), runtime errors in financial calculations or trust score computations are unacceptable. A single incorrect Zakat calculation could undermine user confidence in the platform's Shariah compliance.

## Decision

We will enable TypeScript **strict mode** with the following compiler options:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": false,
    "strictNullChecks": false,
    "noImplicitReturns": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false
  }
}
```

**Note**: While `strict: true` enables all strict type-checking options, we initially disable some specific checks (`noImplicitAny`, `strictNullChecks`, etc.) to allow gradual migration of legacy JavaScript files. New code must be written with full strict compliance.

### Coding Standards

1. **Explicit Types**: All function parameters and return types must be explicitly declared:
```typescript
// Good
export const calculateZakat = (
  totalWealth: number, 
  nisabThreshold: number,
  hawlCompleted: boolean
): ZakatResult => {
  // implementation
};

// Bad (implicit return type)
export const calculateZakat = (totalWealth, nisabThreshold, hawlCompleted) => {
  // implementation
};
```

2. **No `any` Type**: Use `unknown` for truly unknown values and type guards:
```typescript
// Good
const processApiResponse = (data: unknown): UserData => {
  if (isUserData(data)) {
    return data;
  }
  throw new Error('Invalid user data');
};

// Bad
const processApiResponse = (data: any): UserData => {
  return data; // No validation
};
```

3. **Non-null Assertions**: Avoid `!` operator; use proper null checking:
```typescript
// Good
const user = await findUserById(id);
if (!user) {
  throw new NotFoundError('User not found');
}
return user.email;

// Bad
const user = await findUserById(id);
return user!.email; // Risky if user is null
```

4. **Strict Model Types**: Database models must have complete TypeScript interfaces:
```typescript
// backend/src/types/models.d.ts
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  verificationTier: VerificationTier;
  trustScore: number;
  createdAt: Date;
  updatedAt: Date;
}
```

## Consequences

### Positive

1. **Compile-Time Safety**: Critical financial calculations (Zakat, trust score algorithms) are type-checked before deployment. The ZakatCalculator service cannot be called with incorrect parameter types.

2. **Refactoring Confidence**: Large-scale refactoring (like the modular architecture migration) is safer with compiler support. Renaming a property in the User model will produce errors for all usages.

3. **Documentation**: Type annotations serve as inline documentation. Developers can understand function contracts without reading implementation details.

4. **IDE Support**: Better autocomplete, inline error detection, and refactoring tools in VS Code and similar editors.

5. **API Contract Alignment**: TypeScript types in the backend align with the API contract documented in `API_CONTRACT.md`, ensuring implementation matches specification.

6. **Islamic Finance Integrity**: Type safety for Hawl period calculations, Nisab thresholds, and Zakat rates ensures no runtime surprises that could affect religious compliance.

7. **Reduced Testing Burden**: Many runtime error scenarios are eliminated at compile time, reducing the need for defensive type-checking tests.

### Negative

1. **Learning Curve**: Developers new to TypeScript need time to understand strict type checking, generics, and advanced patterns.

2. **Initial Migration Effort**: Legacy JavaScript files and third-party types without strict declarations require gradual migration or `@ts-ignore` comments with explanations.

3. **Build Time**: Strict type checking adds to compilation time, though this is minimal for the current codebase size.

4. **Third-Party Types**: Some npm packages have incomplete or incorrect type definitions, requiring `@types/` packages or custom declarations.

5. **Verbosity**: Strict types require more code to express the same logic, though this trade-off is worthwhile for the safety guarantees.

## Alternatives Considered

### JavaScript with JSDoc
- **Rejected**: While JSDoc can provide type information for editors, it doesn't enforce type safety at build time. Critical financial calculations require stronger guarantees.

### Flow (Facebook's Type System)
- **Rejected**: Flow has a smaller ecosystem and less community support than TypeScript. TypeScript's integration with VS Code and npm ecosystem is superior.

### Relaxed TypeScript (no strict mode)
- **Rejected**: Without strict mode, `any` types proliferate and null/undefined errors remain unchecked. The platform's requirements for financial accuracy and trust demand the strongest type guarantees.

### Deno with Native TypeScript
- **Rejected**: Deno's runtime type checking is interesting but would require a complete platform migration. Node.js with TypeScript compilation provides the needed safety without ecosystem disruption.

## References

- [TypeScript Strict Mode Documentation](https://www.typescriptlang.org/tsconfig#strict)
- [Strict Null Checks](https://www.typescriptlang.org/tsconfig#strictNullChecks) - Eliminates the billion-dollar mistake
- [API Contract Documentation](../../../API_CONTRACT.md)
- [Backend tsconfig.json](../../../backend/tsconfig.json)
- Related ADRs:
  - ADR-001: Modular Architecture (modules use strict TypeScript)
  - ADR-005: Repository Pattern (type-safe data access)
