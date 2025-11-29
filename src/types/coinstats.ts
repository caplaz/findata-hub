/**
 * CoinStats API Type Definitions
 *
 * This file contains all TypeScript interfaces and types for the CoinStats API integration.
 * These types define the structure of cryptocurrency data returned by the CoinStats API.
 *
 * @module types/coinstats
 */

// ============================================================================
// CoinStats API Types
// ============================================================================

/**
 * CoinStats API pagination metadata
 */
export interface CoinStatsMeta {
  page: number;
  limit: number;
  itemCount: number;
  pageCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

/**
 * CoinStats cryptocurrency coin data
 */
export interface CoinStatsCoin {
  id: string;
  icon: string;
  name: string;
  symbol: string;
  rank: number;
  price: number;
  priceBtc: number;
  volume: number;
  marketCap: number;
  availableSupply: number;
  totalSupply: number;
  fullyDilutedValuation: number;
  priceChange1h: number;
  priceChange1d: number;
  priceChange1w: number;
  websiteUrl?: string;
  redditUrl?: string;
  twitterUrl?: string;
  contractAddress?: string | null;
  contractAddresses?: string[];
  decimals?: number;
  explorers?: string[];
  liquidityScore?: number;
  volatilityScore?: number;
  marketCapScore?: number;
  riskScore?: number;
  avgChange?: number;
}

/**
 * CoinStats API response for coins endpoint
 */
export interface CoinStatsResponse {
  meta: CoinStatsMeta;
  result: CoinStatsCoin[];
}

/**
 * CoinStats market data structure for global cryptocurrency market statistics
 */
export interface CoinStatsMarketData {
  marketCap: number;
  volume: number;
  btcDominance: number;
  marketCapChange: number;
  volumeChange: number;
  btcDominanceChange: number;
}
