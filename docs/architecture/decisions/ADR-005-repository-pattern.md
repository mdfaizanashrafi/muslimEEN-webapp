# ADR-005: Repository Pattern for Data Access

## Status
- **Accepted**

## Context

MuslimEEN's data access layer evolved from direct SQL queries in controllers to a more structured approach. The challenges encountered included:

1. **Query Duplication**: The same SQL queries appeared in multiple controllers (e.g., finding a user by ID was written separately in auth, profile, and trust controllers)

2. **Testing Difficulty**: Controllers with embedded SQL queries required a database connection for unit testing, making tests slow and flaky

3. **Schema Coupling**: Changes to database schema required updates across multiple controllers, increasing risk of missed updates

4. **Transaction Complexity**: Ensuring ACID compliance for financial operations (Qard Hasan transfers, Sadaqah donations) required careful transaction management scattered across services

5. **Security Risks**: SQL injection vulnerabilities were harder to audit when queries were distributed throughout the codebase

6. **Domain Boundary Confusion**: It was unclear which code "owned" the users table—auth logic, profile logic, or trust score logic?

The modular architecture (ADR-001) requires clear data ownership boundaries where each module owns specific tables and exposes only necessary operations.

## Decision

We will implement the **Repository Pattern** with the following structure:

### Repository Structure

Each module has repositories that own specific tables:

```
backend/src/modules/
├── iam/
│   └── repositories/
│       └── UserRepository.ts       # Owns: users table (core identity)
├── profile/
│   └── repositories/
│       └── ProfileRepository.ts    # Owns: profiles, user_preferences
├── trust/
│   └── repositories/
│       ├── TrustScoreRepository.ts # Owns: trust_scores, trust_history
│       └── VerificationRepository.ts # Owns: verifications, witness_attestations
├── marketplace/
│   └── repositories/
│       └── MarketplaceRepository.ts # Owns: marketplace_items, categories
└── islamic-finance/
    └── repositories/
        └── IslamicFinanceRepository.ts # Owns: qard_hasan, sadaqah, waqf, zakat
```

### Repository Implementation Example

```typescript
// backend/src/modules/iam/repositories/UserRepository.ts
import pool from '../../database/pool';
import { UserRole, VerificationTier } from '../../../types/index';

export interface UserIdentity {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  verificationTier: VerificationTier;
  trustScore: number;
  isWitnessEligible: boolean;
  isActive: boolean;
  passwordHash?: string;
  lastLogin?: Date;
  createdAt: Date;
}

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  verificationTier: VerificationTier;
}

// Query operations
export const findById = async (id: string): Promise<UserIdentity | null> => {
  const result = await pool.query(
    `SELECT id, email, first_name, last_name, role, verification_tier, 
            trust_score, is_witness_eligible, is_active, password_hash, 
            last_login, created_at
     FROM users 
     WHERE id = $1`,
    [id]
  );
  
  if (result.rows.length === 0) return null;
  return mapToUserIdentity(result.rows[0]);
};

export const findByEmail = async (email: string): Promise<UserIdentity | null> => {
  const result = await pool.query(
    `SELECT id, email, first_name, last_name, role, verification_tier,
            trust_score, is_witness_eligible, is_active, password_hash,
            last_login, created_at
     FROM users 
     WHERE email = $1`,
    [email.toLowerCase()]
  );
  
  if (result.rows.length === 0) return null;
  return mapToUserIdentity(result.rows[0]);
};

// Command operations
export const create = async (input: CreateUserInput): Promise<UserIdentity> => {
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, role, verification_tier)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, email, first_name, last_name, role, verification_tier,
               trust_score, is_witness_eligible, is_active, last_login, created_at`,
    [input.email.toLowerCase(), input.passwordHash, input.firstName, input.lastName, input.role, input.verificationTier]
  );
  
  return mapToUserIdentity(result.rows[0]);
};

export const updateLastLogin = async (userId: string): Promise<void> => {
  await pool.query(
    'UPDATE users SET last_login = NOW() WHERE id = $1',
    [userId]
  );
};

// Private mapper function
const mapToUserIdentity = (row: any): UserIdentity => ({
  id: row.id,
  email: row.email,
  firstName: row.first_name,
  lastName: row.last_name,
  fullName: `${row.first_name} ${row.last_name}`,
  role: row.role,
  verificationTier: row.verification_tier,
  trustScore: row.trust_score || 0,
  isWitnessEligible: row.is_witness_eligible || false,
  isActive: row.is_active !== false,
  passwordHash: row.password_hash,
  lastLogin: row.last_login,
  createdAt: row.created_at,
});
```

### Transaction Support

Repositories support transactions for multi-table operations:

```typescript
// backend/src/modules/database/pool.ts
export const transaction = async <T>(callback: (client: any) => Promise<T>): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Usage in service layer
export const transferQardHasan = async (data: TransferData) => {
  return await transaction(async (client) => {
    // All repository operations in this block use the same transaction
    await IslamicFinanceRepository.createLoan(client, data);
    await TrustScoreRepository.recordTransaction(client, data.lenderId);
    await NotificationRepository.create(client, {
      userId: data.borrowerId,
      type: 'qard_hasan_received',
      // ...
    });
  });
};
```

### Repository Ownership Rules

1. **Single Ownership**: Each table has exactly one owning repository
2. **No Cross-Module Queries**: Repositories only access their owned tables; cross-module data needs are satisfied through service layer composition
3. **Type Safety**: All repository functions have explicit TypeScript return types
4. **No Business Logic**: Repositories handle data access only; business logic belongs in services
5. **Parameterized Queries**: All SQL uses parameterized queries (`$1`, `$2`) to prevent SQL injection

## Consequences

### Positive

1. **Clear Data Ownership**: The IAM module owns the `users` table through `UserRepository`. Other modules access user data through service APIs, not direct queries.

2. **Testability**: Repositories can be mocked in service tests, enabling fast unit tests without database dependencies:
```typescript
jest.mock('../repositories/UserRepository');
const mockFindByEmail = UserRepository.findByEmail as jest.Mock;
mockFindByEmail.mockResolvedValue(mockUser);
```

3. **Schema Changes Isolated**: Changing a column name requires updates only in the owning repository's mapper function, not across the entire codebase.

4. **SQL Injection Prevention**: Centralized query construction ensures consistent use of parameterized queries. No string concatenation in SQL.

5. **Transaction Boundaries**: Clear transaction boundaries in services ensure ACID compliance for financial operations. A Qard Hasan loan either fully succeeds or fully rolls back.

6. **Query Optimization**: Database query patterns are visible in repository files, making it easy to identify missing indexes or N+1 query problems.

7. **Module Encapsulation**: Repositories enforce the modular architecture by preventing direct table access from other modules.

### Negative

1. **Boilerplate Code**: Each repository requires mapper functions to transform database rows to TypeScript objects.

2. **Learning Curve**: Developers must understand which repository owns which table and route queries accordingly.

3. **Query Complexity**: Complex queries joining multiple tables must either:
   - Be split into multiple repository calls (with potential consistency issues)
   - Be placed in the repository that owns the "primary" table
   - Use a read model or view for reporting queries

4. **Performance Overhead**: The abstraction layer adds function call overhead, though this is negligible compared to database latency.

5. **Mapping Maintenance**: Schema changes require updating repository interfaces, mapper functions, and TypeScript types.

## Alternatives Considered

### ORM (Sequelize, TypeORM, Prisma)
- **Rejected**: ORMs abstract away SQL but add significant complexity and magic behavior. Raw SQL with the repository pattern provides:
  - Full control over query optimization
  - No hidden N+1 query problems
  - Transparent database operations for security audits
  - Smaller bundle size (no ORM dependency)

### Active Record Pattern
- **Rejected**: Active Record (where models have methods like `user.save()`) mixes data access with domain logic. The repository pattern keeps these concerns separate, making business logic easier to test and domain boundaries clearer.

### Direct SQL in Services
- **Rejected**: Services with embedded SQL queries create tight coupling between business logic and database schema. Testing requires database connections, and query duplication is inevitable.

### CQRS (Command Query Responsibility Segregation)
- **Partially Adopted**: While full CQRS with separate read/write models is complex, the repository pattern allows for future CQRS evolution. Read-optimized queries can be added to repositories without changing the write model.

### GraphQL with DataLoader
- **Rejected**: GraphQL is excellent for flexible client queries but adds complexity not needed for the current API surface. The REST API with repository pattern is simpler and sufficient for the current requirements.

## References

- [Repository Pattern - Martin Fowler](https://martinfowler.com/eaaCatalog/repository.html)
- [Patterns of Enterprise Application Architecture](https://martinfowler.com/books/eaa.html)
- [PostgreSQL Node.js Driver](https://node-postgres.com/)
- [Backend Module Repositories](../../../backend/src/modules/)
- Related ADRs:
  - ADR-001: Modular Architecture (repositories enforce module boundaries)
  - ADR-003: PostgreSQL (repositories abstract PostgreSQL access)
  - ADR-002: TypeScript Strict Mode (repository interfaces are strongly typed)
