/**
 * Marketplace Types
 * Following BACKEND_README.md MarketplaceItem interface
 */

export type Vertical = 'earn' | 'build' | 'live' | 'protect';

export interface Provider {
  id: string;
  name: string;
  trustScore: number;
  verified: boolean;
  badges: string[];
}

export interface MarketplaceItem {
  id: string;
  vertical: Vertical;
  category: string;
  subcategory?: string;
  provider: Provider;
  title: string;
  description: string;
  location?: string;
  endorsements?: number;
  createdAt: string;
  // Vertical-specific fields
  rate?: string;
  salary?: string;
  seeking?: number;
  raised?: number;
  price?: string;
  coverage?: string;
  units?: number;
}

export interface MarketplaceFilter {
  category?: string;
  location?: string;
  trustScoreMin?: number;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface Investment {
  amount: number;
}

export interface CreateMarketplaceItemInput {
  category: string;
  subcategory?: string;
  title: string;
  description: string;
  location?: string;
  rate?: string;
  salary?: string;
  seeking?: number;
  price?: string;
  coverage?: string;
  units?: number;
}

export interface UpdateMarketplaceItemInput {
  category?: string;
  subcategory?: string;
  title?: string;
  description?: string;
  location?: string;
  rate?: string;
  salary?: string;
  seeking?: number;
  raised?: number;
  price?: string;
  coverage?: string;
  units?: number;
}

export interface RawMarketplaceItem {
  id: string;
  vertical: string;
  category: string;
  subcategory?: string;
  provider_id: string;
  provider_user_id?: string;
  provider_first_name?: string;
  provider_last_name?: string;
  provider_trust_score?: number;
  provider_verification_tier?: string;
  provider_badges?: string[];
  title: string;
  description: string;
  location?: string;
  rate?: string;
  salary?: string;
  seeking?: number;
  raised?: number;
  price?: string;
  coverage?: string;
  units?: number;
  endorsements?: number;
  created_at: string;
  updated_at?: string;
}
