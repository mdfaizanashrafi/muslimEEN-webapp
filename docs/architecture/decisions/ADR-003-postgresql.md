# ADR-003: PostgreSQL as Primary Database

## Status
- **Accepted**

## Context

MuslimEEN's data requirements include:

1. **Relational Data**: Users, connections, invitations, marketplace listings with complex relationships
2. **Financial Records**: Qard Hasan loans (with repayment schedules), Sadaqah campaigns (with donation tracking), Waqf contributions, Zakat calculations history
3. **Trust Score System**: Multi-factor trust calculations with audit trails
4. **Verification Data**: Biometric verification records, witness attestations, business verifications
5. **ACID Compliance**: Financial transactions must be atomic and consistent
6. **Complex Queries**: Trust score calculations require joins across users, connections, verifications, and transactions
7. **Data Integrity**: Given the platform's immutables (transparency, no data sales), data must be accurate and tamper-evident

The platform must handle:
- Invitation-only user growth (organic, controlled scaling)
- Complex marketplace searches across four verticals (EARN, BUILD, LIVE, PROTECT)
- Real-time trust score updates based on user behavior
- Audit requirements for Islamic finance compliance

## Decision

We will use **PostgreSQL 14+** as the primary database with the following architecture:

### Database Configuration

```typescript
// backend/src/config/database.ts
const poolConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'muslimeen',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
};
```

### Key PostgreSQL Features Utilized

1. **UUID Extension**: All primary keys use UUID v4 for distributed uniqueness and security:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- ...
);
```

2. **JSONB for Flexible Attributes**: Marketplace item metadata and user preferences:
```sql
CREATE TABLE marketplace_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  metadata JSONB DEFAULT '{}',
  -- ...
);
```

3. **Transactions for Financial Operations**:
```typescript
export const createQardHasan = async (loanData: QardHasanInput): Promise<QardHasan> => {
  return await transaction(async (client) => {
    // Deduct from lender
    await client.query(
      'UPDATE user_balances SET balance = balance - $1 WHERE user_id = $2',
      [loanData.amount, loanData.lenderId]
    );
    
    // Create loan record
    const loanResult = await client.query(
      `INSERT INTO qard_hasan_loans (lender_id, borrower_id, amount, purpose)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [loanData.lenderId, loanData.borrowerId, loanData.amount, loanData.purpose]
    );
    
    // Add to borrower
    await client.query(
      'UPDATE user_balances SET balance = balance + $1 WHERE user_id = $2',
      [loanData.amount, loanData.borrowerId]
    );
    
    return mapToQardHasan(loanResult.rows[0]);
  });
};
```

4. **Indexes for Performance**:
```sql
-- Trust score queries
CREATE INDEX idx_users_trust_score ON users(trust_score DESC);

-- Marketplace searches
CREATE INDEX idx_marketplace_vertical_status ON marketplace_items(vertical, status);
CREATE INDEX idx_marketplace_created_at ON marketplace_items(created_at DESC);

-- Connection lookups
CREATE INDEX idx_connections_users ON connections(requester_id, recipient_id);
```

5. **Check Constraints for Data Integrity**:
```sql
-- Trust score must be between 0 and 1000
ALTER TABLE users ADD CONSTRAINT chk_trust_score 
  CHECK (trust_score >= 0 AND trust_score <= 1000);

-- Zakat rate validation
ALTER TABLE zakat_calculations ADD CONSTRAINT chk_zakat_rate 
  CHECK (zakat_rate >= 0 AND zakat_rate <= 1);
```

## Consequences

### Positive

1. **ACID Compliance**: Financial transactions (Qard Hasan, Sadaqah, Waqf) are guaranteed to be atomic, consistent, isolated, and durable. A failed loan transfer cannot leave the system in an inconsistent state.

2. **Complex Query Support**: PostgreSQL's query optimizer handles complex joins for trust score calculations efficiently. The trust algorithm joins users, connections, verifications, and transaction history.

3. **JSONB Flexibility**: Marketplace items can have varying attributes (job listings vs. real estate vs. services) stored in JSONB without schema migrations for every new attribute.

4. **Data Integrity**: Foreign key constraints, check constraints, and not-null constraints prevent invalid data that could corrupt trust scores or financial calculations.

5. **Open Source**: Aligns with platform immutables (open source forever). PostgreSQL is AGPL-compatible and has no licensing concerns.

6. **Rich Ecosystem**: Excellent Node.js driver (`pg`), connection pooling, migration tools, and monitoring solutions.

7. **Full-Text Search**: PostgreSQL's built-in full-text search capabilities support marketplace item search without requiring additional services like Elasticsearch for the current scale.

8. **Time-Travel Queries**: Using temporal tables or audit triggers, we can reconstruct trust scores at any point in time for transparency and dispute resolution.

### Negative

1. **Horizontal Scaling**: PostgreSQL is vertically scalable; horizontal scaling (sharding) is complex. However, invitation-only growth means user growth is controlled and manageable on a single large instance.

2. **Schema Migrations**: Database schema changes require careful migration scripts. The migration system uses versioned SQL files in `backend/database/migrations/`.

3. **Connection Limits**: The connection pool (max 20) must be monitored. High traffic may require connection pooler (PgBouncer) in production.

4. **NoSQL Feature Gaps**: While JSONB provides flexibility, deeply nested queries are less efficient than native document databases. This is acceptable as the primary access patterns are relational.

5. **Backup Complexity**: Point-in-time recovery and backup strategies require operational expertise compared to managed NoSQL solutions.

## Alternatives Considered

### MongoDB
- **Rejected**: While MongoDB offers flexible schemas, it lacks ACID transactions (though multi-document transactions exist, they're complex). Financial data requires strong consistency guarantees that MongoDB's eventual consistency model doesn't provide by default.

### MySQL / MariaDB
- **Rejected**: PostgreSQL has superior support for complex queries, JSON operations, and data types. MySQL's handling of concurrent writes and its less strict data integrity defaults make it less suitable for financial applications.

### SQLite
- **Rejected**: SQLite is excellent for embedded applications but lacks the concurrency and feature set needed for a multi-user web platform with complex queries.

### CockroachDB / YugabyteDB
- **Rejected**: Distributed SQL databases offer horizontal scaling but add operational complexity and cost. The current scale doesn't justify the overhead. Can be reconsidered if the platform grows beyond a single PostgreSQL instance.

### Redis as Primary Store
- **Rejected**: Redis is used for caching and session storage but lacks persistence guarantees and complex query capabilities needed for relational financial data.

## References

- [PostgreSQL Documentation](https://www.postgresql.org/docs/14/index.html)
- [Node.js pg Driver](https://node-postgres.com/)
- [Database Setup Guide](../../../DATABASE_SETUP.md)
- [Migration Files](../../../backend/database/migrations/)
- Related ADRs:
  - ADR-005: Repository Pattern (PostgreSQL access abstraction)
  - ADR-001: Modular Architecture (modules own their tables)
