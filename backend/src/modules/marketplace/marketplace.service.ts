/**
 * Marketplace Service
 * Business logic for EARN, BUILD, LIVE, PROTECT verticals
 */

import { MarketplaceItem, MarketplaceFilter, CreateMarketplaceItemInput, UpdateMarketplaceItemInput, Vertical } from './marketplace.types';

// Valid verticals
const VALID_VERTICALS: Vertical[] = ['earn', 'build', 'live', 'protect'];

export function isValidVertical(vertical: string): vertical is Vertical {
  return VALID_VERTICALS.includes(vertical as Vertical);
}

export function getValidVerticals(): Vertical[] {
  return [...VALID_VERTICALS];
}

/**
 * Build filter query for marketplace items
 */
export function buildFilterQuery(filters: MarketplaceFilter): {
  query: string;
  countQuery: string;
  params: (string | number)[];
} {
  const {
    category,
    location,
    trustScoreMin,
    search,
    limit = 20,
    offset = 0
  } = filters;

  let whereClause = 'WHERE mi.vertical = $1';
  const params: (string | number)[] = [];
  let paramIndex = 2;

  if (category) {
    whereClause += ` AND mi.category = $${paramIndex}`;
    params.push(category);
    paramIndex++;
  }

  if (location) {
    whereClause += ` AND mi.location ILIKE $${paramIndex}`;
    params.push(`%${location}%`);
    paramIndex++;
  }

  if (trustScoreMin !== undefined) {
    whereClause += ` AND u.trust_score >= $${paramIndex}`;
    params.push(trustScoreMin);
    paramIndex++;
  }

  if (search) {
    whereClause += ` AND (mi.title ILIKE $${paramIndex} OR mi.description ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  const query = `
    SELECT 
      mi.*,
      u.id as provider_user_id,
      u.first_name as provider_first_name,
      u.last_name as provider_last_name,
      u.trust_score as provider_trust_score,
      u.verification_tier as provider_verification_tier,
      u.badges as provider_badges
    FROM marketplace_items mi
    JOIN users u ON mi.provider_id = u.id
    ${whereClause}
    ORDER BY u.trust_score DESC, mi.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  const countQuery = `
    SELECT COUNT(*) as total
    FROM marketplace_items mi
    JOIN users u ON mi.provider_id = u.id
    ${whereClause}
  `;

  params.push(limit, offset);

  return { query, countQuery, params };
}

/**
 * Build get by ID query
 */
export function buildGetByIdQuery(): string {
  return `
    SELECT 
      mi.*,
      u.id as provider_user_id,
      u.first_name as provider_first_name,
      u.last_name as provider_last_name,
      u.trust_score as provider_trust_score,
      u.verification_tier as provider_verification_tier,
      u.badges as provider_badges
    FROM marketplace_items mi
    JOIN users u ON mi.provider_id = u.id
    WHERE mi.id = $1
  `;
}

/**
 * Build create query
 */
export function buildCreateQuery(
  vertical: Vertical,
  itemData: CreateMarketplaceItemInput & { providerId: string }
): { query: string; params: (string | number | undefined)[] } {
  const {
    category,
    subcategory,
    providerId,
    title,
    description,
    location,
    rate,
    salary,
    seeking,
    price,
    coverage,
    units
  } = itemData;

  const query = `
    INSERT INTO marketplace_items 
      (vertical, category, subcategory, provider_id, title, description, location, rate, salary, seeking, price, coverage, units)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *
  `;

  const params = [
    vertical,
    category,
    subcategory,
    providerId,
    title,
    description,
    location,
    rate,
    salary,
    seeking,
    price,
    coverage,
    units
  ];

  return { query, params };
}

/**
 * Build update query
 */
export function buildUpdateQuery(
  id: string,
  updates: UpdateMarketplaceItemInput
): { query: string; params: (string | number | undefined)[] } | null {
  const allowedFields = [
    'category', 'subcategory', 'title', 'description', 'location',
    'rate', 'salary', 'seeking', 'raised', 'price', 'coverage', 'units'
  ];

  const fields: string[] = [];
  const values: (string | number | undefined)[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (fields.length === 0) return null;

  values.push(id);
  const query = `
    UPDATE marketplace_items 
    SET ${fields.join(', ')}, updated_at = NOW()
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  return { query, params: values };
}

/**
 * Build delete query
 */
export function buildDeleteQuery(): string {
  return 'DELETE FROM marketplace_items WHERE id = $1 RETURNING id';
}

/**
 * Build increment raised query (for BUILD vertical)
 */
export function buildIncrementRaisedQuery(): string {
  return `
    UPDATE marketplace_items
    SET raised = raised + $2
    WHERE id = $1
    RETURNING *
  `;
}

/**
 * Format database row to API response format
 */
export function formatItem(row: Record<string, unknown>): MarketplaceItem | null {
  if (!row) return null;

  const provider = {
    id: (row.provider_user_id as string) || (row.provider_id as string),
    name: `${(row.provider_first_name as string) || ''} ${(row.provider_last_name as string) || ''}`.trim(),
    trustScore: row.provider_trust_score as number,
    verified: row.provider_verification_tier !== 'basic',
    badges: (row.provider_badges as string[]) || []
  };

  const item: MarketplaceItem = {
    id: row.id as string,
    vertical: row.vertical as Vertical,
    category: row.category as string,
    subcategory: row.subcategory as string | undefined,
    provider,
    title: row.title as string,
    description: row.description as string,
    location: row.location as string | undefined,
    endorsements: row.endorsements as number | undefined,
    createdAt: row.created_at as string
  };

  // Vertical-specific fields
  if (row.rate) item.rate = row.rate as string;
  if (row.salary) item.salary = row.salary as string;
  if (row.seeking) item.seeking = row.seeking as number;
  if (row.raised !== undefined && row.raised !== null) item.raised = row.raised as number;
  if (row.price) item.price = row.price as string;
  if (row.coverage) item.coverage = row.coverage as string;
  if (row.units) item.units = row.units as number;

  return item;
}

/**
 * Validate investment amount
 */
export function validateInvestment(
  currentRaised: number,
  goal: number,
  amount: number
): { valid: boolean; error?: { code: string; message: string } } {
  if (currentRaised + amount > goal) {
    return {
      valid: false,
      error: {
        code: 'INVESTMENT_EXCEEDS_GOAL',
        message: 'Investment amount exceeds remaining goal'
      }
    };
  }

  return { valid: true };
}
