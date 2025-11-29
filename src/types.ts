/**
 * Centralized Type Definitions
 *
 * This file exports all type definitions used across the yahoo-finance-server project.
 * It re-exports types from yahoo-finance2 library and defines custom types for
 * data structures not directly exported by the library.
 *
 * @module types
 */

import type { Quote } from "yahoo-finance2/esm/src/modules/quote";

// Re-export types from yahoo-finance2 library
export type {
  QuoteSummaryResult,
  AssetProfile,
  FinancialData,
  FundProfile,
  TopHoldings,
  SummaryProfile,
  RecommendationTrend,
  UpgradeDowngradeHistory,
  InsiderTransactions,
} from "yahoo-finance2/esm/src/modules/quoteSummary-iface";

export type {
  SearchResult,
  SearchNews,
} from "yahoo-finance2/esm/src/modules/search";
export type { RecommendationsBySymbolResponse } from "yahoo-finance2/esm/src/modules/recommendationsBySymbol";
export type {
  ChartResultArray,
  ChartOptions,
} from "yahoo-finance2/esm/src/modules/chart";
export type {
  HistoricalHistoryResult,
  HistoricalOptions,
} from "yahoo-finance2/esm/src/modules/historical";
export type { Quote } from "yahoo-finance2/esm/src/modules/quote";
export type { TrendingSymbolsResult } from "yahoo-finance2/esm/src/modules/trendingSymbols";
export type {
  ScreenerResult,
  PredefinedScreenerModules,
} from "yahoo-finance2/esm/src/modules/screener";

/**
 * Fundamentals Time Series types
 */
export type {
  FundamentalsTimeSeriesResult,
  FundamentalsTimeSeriesResults,
  FundamentalsTimeSeriesFinancialsResult,
  FundamentalsTimeSeriesBalanceSheetResult,
  FundamentalsTimeSeriesCashFlowResult,
} from "yahoo-finance2/esm/src/modules/fundamentalsTimeSeries";

/**
 * News article JSON structure (for scraping)
 */
export interface NewsJson {
  headline?: string;
  title?: string;
  body?: {
    items?: Array<{
      data?: {
        storyAtoms?: unknown[];
      };
    }>;
  };
}

/**
 * Story atom structure (for news content extraction)
 */
export interface StoryAtom {
  type: string;
  content: string;
}

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
}

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
 * Fear & Greed Index data structure
 */
export interface FearGreedIndex {
  score: number;
  rating: string;
  timestamp: string;
}

/**
 * Market sentiment indicators
 */
export interface MarketSentiment {
  vix?: Quote | null;
  fearGreedIndex?: FearGreedIndex | null;
}
