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

// ============================================================================
// Yahoo Finance API Types
// ============================================================================

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
  SearchResult,
  SearchNews,
  RecommendationsBySymbolResponse,
  ChartResultArray,
  ChartOptions,
  HistoricalHistoryResult,
  HistoricalOptions,
  Quote,
  TrendingSymbolsResult,
  ScreenerResult,
  PredefinedScreenerModules,
  FundamentalsTimeSeriesResult,
  FundamentalsTimeSeriesResults,
  FundamentalsTimeSeriesFinancialsResult,
  FundamentalsTimeSeriesBalanceSheetResult,
  FundamentalsTimeSeriesCashFlowResult,
  NewsJson,
  StoryAtom,
} from "./types/yahoo";

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

export type {
  CoinStatsMeta,
  CoinStatsCoin,
  CoinStatsResponse,
  CoinStatsMarketData,
  CoinStatsBtcDominanceResponse,
  CoinStatsFearGreedResponse,
  CoinStatsRainbowChartResponse,
} from "./types/coinstats";

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
